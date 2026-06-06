const fs = require("fs");
const path = require("path");
const { safeFileName } = require("./lib/utils");
const { csvToObjects } = require("./lib/csv-parser");
const { parseTimeRange } = require("./lib/time-utils");
const { trimClip, removeDeadSilence, mergeOutro } = require("./lib/ffmpeg");

// Start timing
const startTime = process.hrtime();

const rawArgs = process.argv.slice(2);

function parseCommandArgs(args) {
  const positional = [];
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      if (arg.includes("=")) {
        const [key, ...rest] = arg.replace(/^--/, "").split("=");
        options[key] = rest.join("=");
        continue;
      }

      const key = arg.replace(/^--/, "");

      const next = args[i + 1];

      if (next && !next.startsWith("--")) {
        options[key] = next;
        i++;
      } else {
        options[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, options };
}

const { positional, options } = parseCommandArgs(rawArgs);

const inputVideo = positional[0];
const csvPath = positional[1];
const outputDir = positional[2] || "clips";

const shouldRemoveSilence = Boolean(options["remove-silence"]);
const disableHeading = Boolean(options["disable-heading"]);
const outroVideo = options["outro"];

// You can adjust these from command line.
const silenceThreshold = options["silence-threshold"] || "-35dB";
const silenceDuration = Number(options["silence-duration"] || 0.6);
const keepSilence = Number(options["keep-silence"] || 0.12);

if (outroVideo && !fs.existsSync(outroVideo)) {
  console.error(`Outro video not found: ${outroVideo}`);
  process.exit(1);
}

if (!inputVideo || !csvPath) {
  console.error(`
Usage:
  node clip-from-csv.js <input-video.mp4> <csv-file.csv> [output-folder] [options]

Basic trim only:
  node clip-from-csv.js full-video.mp4 sentence_structure_chapters.csv clips

Trim and remove dead silence:
  node clip-from-csv.js full-video.mp4 sentence_structure_chapters.csv clips --remove-silence

Optional silence settings:
  --silence-threshold -35dB
  --silence-duration 0.6
  --keep-silence 0.12

Other options:
  --disable-heading      Disable the yellowish golden heading from rendering even if true in CSV
  --outro=outro.mp4      Append an outro video clip to every generated clip

Example:
  node clip-from-csv.js full-video.mp4 sentence_structure_chapters.csv clips --remove-silence --outro=outro.mp4 --silence-threshold -35dB --silence-duration 0.6 --keep-silence 0.12
`);
  process.exit(1);
}

if (!fs.existsSync(inputVideo)) {
  console.error(`Input video not found: ${inputVideo}`);
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`CSV file not found: ${csvPath}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const tempDir = path.join(outputDir, "_temp");
fs.mkdirSync(tempDir, { recursive: true });

async function main() {
  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows = csvToObjects(csvText);

  console.log(`Found ${rows.length} rows in CSV.`);

  if (shouldRemoveSilence) {
    console.log("Dead silence removal: ON");
    console.log(`Silence threshold: ${silenceThreshold}`);
    console.log(`Silence duration: ${silenceDuration}s`);
    console.log(`Keep silence padding: ${keepSilence}s`);
  } else {
    console.log("Dead silence removal: OFF");
  }

  if (disableHeading) {
    console.log("Heading text: DISABLED via command line");
  } else {
    console.log("Heading text: ENABLED (if true in CSV)");
  }

  if (outroVideo) {
    console.log(`Outro video: ${outroVideo}`);
  }

  for (const row of rows) {
    const id = row["ID"];
    const title = row["Final title"];
    const range = row["Source time range"];

    const showHeadingVal = row["show_heading"];
    const showHeading = !disableHeading && showHeadingVal && showHeadingVal.trim().toLowerCase() === "true";

    if (!id || !title || !range) {
      console.warn("Skipping row with missing ID, Final title, or Source time range:", row);
      continue;
    }

    const { start, duration } = parseTimeRange(range);

    const outputName = `${String(id).padStart(2, "0")}_${safeFileName(title)}.mp4`;
    const outputPath = path.join(outputDir, outputName);

    console.log(`\nCreating clip ${id}: ${title}`);
    console.log(`Start: ${start}, Duration: ${duration}`);
    console.log(`Output: ${outputPath}`);

    let titleFile = null;
    if (showHeading) {
      titleFile = path.join(tempDir, `${String(id).padStart(2, "0")}_title.txt`);
      fs.writeFileSync(titleFile, title, "utf8");
    }

    const headingOptions = showHeading ? { showHeading: true, titleFile } : null;

    const needsSilenceRemoval = shouldRemoveSilence;
    const needsOutro = Boolean(outroVideo);

    const step1Out = (needsSilenceRemoval || needsOutro)
      ? path.join(tempDir, `${String(id).padStart(2, "0")}_step1.mp4`)
      : outputPath;

    if (needsSilenceRemoval || needsOutro) {
      console.log("Step 1: Trimming raw clip...");
    }
    await trimClip(inputVideo, step1Out, start, duration, headingOptions);

    let lastOut = step1Out;

    if (needsSilenceRemoval) {
      const step2Out = needsOutro
        ? path.join(tempDir, `${String(id).padStart(2, "0")}_step2.mp4`)
        : outputPath;
      
      console.log("Step 2: Removing dead silence...");
      await removeDeadSilence(lastOut, step2Out, silenceThreshold, silenceDuration, keepSilence);
      
      try { fs.unlinkSync(lastOut); } catch {}
      lastOut = step2Out;
    }

    if (needsOutro) {
      console.log(`Step ${needsSilenceRemoval ? 3 : 2}: Merging outro...`);
      await mergeOutro(lastOut, outroVideo, outputPath);
      
      try { fs.unlinkSync(lastOut); } catch {}
    }
  }

  console.log("\nAll clips created successfully.");

  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors.
  }
  
  // Calculate and display execution time
  const diff = process.hrtime(startTime);
  const totalSeconds = diff[0] + diff[1] / 1e9;
  
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  
  let timeStr = "";
  if (h > 0) timeStr += `${h}h `;
  if (m > 0 || h > 0) timeStr += `${m}m `;
  timeStr += `${s}s`;
  
  console.log(`\n======================================`);
  console.log(`Total time taken: ${timeStr.trim()}`);
  console.log(`======================================\n`);
}

main().catch((error) => {
  console.error("\nError:", error.message);
  process.exit(1);
});
