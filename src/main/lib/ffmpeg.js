import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { getFontFileFilterOption } from "./utils";

import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

// Setup FFmpeg static paths, replacing app.asar for unpacked binaries in production
const ffmpegBin = process.env.FFMPEG_PATH || ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
const ffprobeBin = process.env.FFPROBE_PATH || ffprobeStatic.path.replace('app.asar', 'app.asar.unpacked');

function runProcess(command, args, options = {}) {
  const capture = Boolean(options.capture);

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const child = spawn(command, args, {
      stdio: capture ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"],
    });

    if (capture) {
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    }

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} exited with code ${code}${stderr ? `\n\n${stderr}` : ""}`));
      }
    });
  });
}

async function getVideoDurationSeconds(filePath) {
  const result = await runProcess(
    ffprobeBin,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ],
    { capture: true },
  );

  const duration = Number(result.stdout.trim());

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read duration for file: ${filePath}`);
  }

  return duration;
}

async function hasAudioStream(filePath) {
  const result = await runProcess(
    ffprobeBin,
    [
      "-v",
      "error",
      "-select_streams",
      "a:0",
      "-show_entries",
      "stream=index",
      "-of",
      "csv=p=0",
      filePath,
    ],
    { capture: true },
  );

  return result.stdout.trim().length > 0;
}

async function detectSilences(filePath, totalDuration, silenceThreshold, silenceDuration) {
  const result = await runProcess(
    ffmpegBin,
    [
      "-hide_banner",
      "-nostats",
      "-i",
      filePath,
      "-af",
      `silencedetect=noise=${silenceThreshold}:d=${silenceDuration}`,
      "-f",
      "null",
      "-",
    ],
    { capture: true },
  );

  const lines = result.stderr.split(/\r?\n/);
  const silences = [];

  let currentStart = null;

  for (const line of lines) {
    const startMatch = line.match(/silence_start:\s*([0-9.]+)/);
    const endMatch = line.match(/silence_end:\s*([0-9.]+)/);

    if (startMatch) {
      currentStart = Number(startMatch[1]);
    }

    if (endMatch && currentStart !== null) {
      const end = Number(endMatch[1]);

      if (Number.isFinite(currentStart) && Number.isFinite(end) && end > currentStart) {
        silences.push({
          start: currentStart,
          end,
        });
      }

      currentStart = null;
    }
  }

  if (currentStart !== null && currentStart < totalDuration) {
    silences.push({
      start: currentStart,
      end: totalDuration,
    });
  }

  return silences;
}

function buildKeepSegments(silences, totalDuration, keepSilence) {
  const keepSegments = [];
  let cursor = 0;

  for (const silence of silences) {
    const removeStart = Math.max(0, silence.start + keepSilence);
    const removeEnd = Math.min(totalDuration, silence.end - keepSilence);

    if (removeEnd <= removeStart) {
      continue;
    }

    if (removeStart > cursor) {
      keepSegments.push({
        start: cursor,
        end: removeStart,
      });
    }

    cursor = Math.max(cursor, removeEnd);
  }

  if (cursor < totalDuration) {
    keepSegments.push({
      start: cursor,
      end: totalDuration,
    });
  }

  return keepSegments.filter((segment) => segment.end - segment.start >= 0.05);
}

function buildSilenceRemovalFilter(segments) {
  const parts = [];

  segments.forEach((segment, index) => {
    const start = segment.start.toFixed(3);
    const end = segment.end.toFixed(3);

    parts.push(`[0:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[v${index}]`);

    parts.push(`[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[a${index}]`);
  });

  const concatInputs = segments.map((_, index) => `[v${index}][a${index}]`).join("");

  parts.push(`${concatInputs}concat=n=${segments.length}:v=1:a=1[outv][outa]`);

  return parts.join(";");
}

async function trimClip(inputPath, outputPath, start, duration, headingOptions = null, aspectRatio = "1:1", encoder = "libx264") {
  const args = [
    "-y",
    "-hide_banner",
    "-ss", start,
    "-i", inputPath,
    "-t", duration,
  ];

  if (aspectRatio === "Original" && (!headingOptions || !headingOptions.showHeading)) {
    args.push("-map", "0:v:0");
    args.push("-map", "0:a?");
    args.push("-c", "copy");
    args.push(outputPath);
    await runProcess(ffmpegBin, args);
    return;
  }

  let w = 1080;
  let h = 1080;
  let dar = "1:1";
  if (aspectRatio === "9:16") {
    w = 1080;
    h = 1920;
    dar = "9:16";
  } else if (aspectRatio === "16:9") {
    w = 1920;
    h = 1080;
    dar = "16:9";
  }

  let filterComplex = `[0:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1:1,setdar=${dar},fps=30,format=yuv420p[bg]`;

  if (headingOptions && headingOptions.showHeading) {
    const { titleFile, headingFont } = headingOptions;
    const relativeTitleFile = path.relative(process.cwd(), titleFile).replace(/\\/g, "/");
    const fontStr = getFontFileFilterOption(headingFont);
    filterComplex += `;[bg]drawtext=${fontStr}textfile='${relativeTitleFile}':fontcolor=#FFD700:fontsize=48:x=(w-text_w)/2:y=50:box=1:boxcolor=black@0.6:boxborderw=10:line_spacing=10[outv]`;
    args.push("-filter_complex", filterComplex);
    args.push("-map", "[outv]");
  } else {
    args.push("-filter_complex", filterComplex);
    args.push("-map", "[bg]");
  }

  args.push("-map", "0:a?");

  args.push(
    "-c:v",
    encoder,
    "-preset",
    "veryfast",
    "-crf",
    "18",

    "-c:a",
    "aac",
    "-b:a",
    "192k",

    "-movflags",
    "+faststart",

    outputPath,
  );

  await runProcess(ffmpegBin, args);
}

async function removeDeadSilence(inputClipPath, outputClipPath, silenceThreshold, silenceDuration, keepSilence, encoder = "libx264") {
  const audioExists = await hasAudioStream(inputClipPath);

  if (!audioExists) {
    console.warn("No audio stream found. Skipping silence removal.");
    fs.copyFileSync(inputClipPath, outputClipPath);
    return;
  }

  const totalDuration = await getVideoDurationSeconds(inputClipPath);
  const silences = await detectSilences(inputClipPath, totalDuration, silenceThreshold, silenceDuration);

  if (silences.length === 0) {
    console.log("No removable silence detected.");
    fs.copyFileSync(inputClipPath, outputClipPath);
    return;
  }

  const keepSegments = buildKeepSegments(silences, totalDuration, keepSilence);

  if (keepSegments.length === 0) {
    console.warn("Clip appears to be mostly/all silence. Keeping original clip.");
    fs.copyFileSync(inputClipPath, outputClipPath);
    return;
  }

  console.log(`Detected ${silences.length} silence section(s).`);
  console.log(`Keeping ${keepSegments.length} non-silent section(s).`);

  const filterComplex = buildSilenceRemovalFilter(keepSegments);

  const args = [
    "-y",
    "-hide_banner",

    "-i",
    inputClipPath,

    "-filter_complex",
    filterComplex,

    "-map",
    "[outv]",
    "-map",
    "[outa]",

    "-c:v",
    encoder,
    "-preset",
    "veryfast",
    "-crf",
    "18",

    "-c:a",
    "aac",
    "-b:a",
    "192k",

    "-movflags",
    "+faststart",

    outputClipPath,
  ];

  await runProcess(ffmpegBin, args);
}

async function mergeOutro(clipPath, outroPath, outputPath, aspectRatio = "1:1", encoder = "libx264") {
  const resolutionResult = await runProcess(
    ffprobeBin,
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height,sample_aspect_ratio,display_aspect_ratio,r_frame_rate",
      "-of", "json",
      clipPath
    ],
    { capture: true }
  );
  
  let videoInfo = {};
  try {
    const data = JSON.parse(resolutionResult.stdout);
    if (data.streams && data.streams.length > 0) {
      videoInfo = data.streams[0];
    }
  } catch (e) {
    // ignore
  }

  let w = 1080;
  let h = 1080;
  let dar = "1:1";
  if (aspectRatio === "9:16") {
    w = 1080;
    h = 1920;
    dar = "9:16";
  } else if (aspectRatio === "16:9") {
    w = 1920;
    h = 1080;
    dar = "16:9";
  }
  let fps = videoInfo.r_frame_rate || "30";

  const filterComplex = `[1:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1:1,setdar=${dar},fps=${fps},format=yuv420p[v1];` + 
                        `[0:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1:1,setdar=${dar},fps=${fps},format=yuv420p[v0];` +
                        `[1:a]aresample=44100[a1];` +
                        `[0:a]aresample=44100[a0];` +
                        `[v0][a0][v1][a1]concat=n=2:v=1:a=1[outv][outa]`;

  const args = [
    "-y",
    "-hide_banner",
    "-i", clipPath,
    "-i", outroPath,
    "-filter_complex", filterComplex,
    "-map", "[outv]",
    "-map", "[outa]",
    "-c:v", encoder,
    "-preset", "veryfast",
    "-crf", "18",
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
    outputPath
  ];

  await runProcess(ffmpegBin, args);
}

export {
  trimClip,
  removeDeadSilence,
  mergeOutro,
};
