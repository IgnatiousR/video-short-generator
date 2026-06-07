import fs from "fs";
import path from "path";
import { safeFileName } from "./lib/utils";
import { csvToObjects } from "./lib/csv-parser";
import { parseTimeRange } from "./lib/time-utils";
import { trimClip, removeDeadSilence, mergeOutro } from "./lib/ffmpeg";

function wrapText(text, maxCharsPerLine = 40) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines.join("\n");
}

async function processVideo(options, sendProgress) {
  const {
    inputVideo,
    csvPath,
    manualClips,
    outputDir,
    shouldRemoveSilence,
    disableHeading,
    outroVideo,
    silenceThreshold = "-35dB",
    silenceDuration = 0.6,
    keepSilence = 0.12,
    aspectRatio,
    headingFont = 'Inter',
    encoder = 'libx264'
  } = options;

  if (!fs.existsSync(inputVideo)) {
    throw new Error(`Input video not found: ${inputVideo}`);
  }

  if (!manualClips && !fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  if (outroVideo && !fs.existsSync(outroVideo)) {
    throw new Error(`Outro video not found: ${outroVideo}`);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const tempDir = path.join(outputDir, "_temp");
  fs.mkdirSync(tempDir, { recursive: true });

  let rows = [];
  if (manualClips && manualClips.length > 0) {
    rows = manualClips.map((clip, index) => ({
      "ID": String(index + 1),
      "Final title": clip.final_title,
      "Source time range": `${clip.startTime}-${clip.endTime}`,
      "show_heading": clip.show_heading ? "TRUE" : "FALSE"
    }));
    sendProgress({ type: 'info', message: `Loaded ${rows.length} manual clips.` });
  } else {
    const csvText = fs.readFileSync(csvPath, "utf8");
    rows = csvToObjects(csvText);
    sendProgress({ type: 'info', message: `Found ${rows.length} rows in CSV.` });
  }

  let completedCount = 0;
  const validRows = rows.filter(r => r["ID"] && r["Final title"] && r["Source time range"]);
  const totalRows = validRows.length;

  sendProgress({
    type: 'init_batch',
    totalClips: totalRows,
    clips: validRows.map(r => ({
      id: r["ID"],
      filename: `${safeFileName(r["Final title"])}.mp4`,
      status: 'Queued',
      progress: 0
    }))
  });

  const concurrencyLimit = 3;
  let rowIndex = 0;

  const workers = Array(concurrencyLimit).fill(null).map(async () => {
    while (rowIndex < validRows.length) {
      const row = validRows[rowIndex++];
      const id = row["ID"];
      const title = row["Final title"];
      const range = row["Source time range"];

      const showHeadingVal = row["show_heading"];
      const showHeading = !disableHeading && showHeadingVal && String(showHeadingVal).trim().toLowerCase() === "true";

      const { start, duration } = parseTimeRange(range);

      const outputName = `${safeFileName(title)}.mp4`;
      const outputPath = path.join(outputDir, outputName);

      sendProgress({ type: 'clip_progress', id, status: 'Processing', progress: 5 });

      let titleFile = null;
      if (showHeading) {
        titleFile = path.join(tempDir, `${String(id).padStart(2, "0")}_title.txt`);
        fs.writeFileSync(titleFile, wrapText(title), "utf8");
      }

      const headingOptions = showHeading ? { showHeading: true, titleFile, headingFont } : null;
      const needsSilenceRemoval = shouldRemoveSilence;
      const needsOutro = Boolean(outroVideo);

      const step1Out = (needsSilenceRemoval || needsOutro)
        ? path.join(tempDir, `${String(id).padStart(2, "0")}_step1.mp4`)
        : outputPath;

      sendProgress({ type: 'clip_progress', id, status: 'Processing', progress: 10 });
      await trimClip(inputVideo, step1Out, start, duration, headingOptions, aspectRatio, options.encoder);
      sendProgress({ type: 'clip_progress', id, status: 'Processing', progress: needsSilenceRemoval ? 40 : (needsOutro ? 60 : 100) });

      let lastOut = step1Out;

      if (needsSilenceRemoval) {
        const step2Out = needsOutro
          ? path.join(tempDir, `${String(id).padStart(2, "0")}_step2.mp4`)
          : outputPath;
        
        sendProgress({ type: 'clip_progress', id, status: 'Processing', progress: 45 });
        await removeDeadSilence(lastOut, step2Out, silenceThreshold, silenceDuration, keepSilence, options.encoder);
        sendProgress({ type: 'clip_progress', id, status: 'Processing', progress: needsOutro ? 75 : 100 });
        
        try { fs.unlinkSync(lastOut); } catch {}
        lastOut = step2Out;
      }

      if (needsOutro) {
        sendProgress({ type: 'clip_progress', id, status: 'Processing', progress: 80 });
        await mergeOutro(lastOut, outroVideo, outputPath, aspectRatio, options.encoder);
        sendProgress({ type: 'clip_progress', id, status: 'Processing', progress: 100 });
        
        try { fs.unlinkSync(lastOut); } catch {}
      }

      completedCount++;
      sendProgress({ type: 'clip_progress', id, status: 'Done', progress: 100 });
    }
  });

  await Promise.all(workers);

  sendProgress({ type: 'info', message: "\nAll clips created successfully." });
  sendProgress({ type: 'done' });

  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors.
  }
}

export {
  processVideo
};
