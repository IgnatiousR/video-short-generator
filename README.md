# Video Clipper from CSV

This Node.js script takes one full MP4 video and a CSV file, then creates separate video clips based on the time ranges listed in the CSV.

It can also optionally remove dead silence from each generated clip using FFmpeg.

---

## Features

- Read clip data from a CSV file
- Trim one full video into multiple clips
- Save each clip as a separate MP4 file
- Use the CSV `ID`, `Final title`, and `Source time range` columns
- Render a yellowish golden heading with the clip title (via `show_heading` column)
- Optional dead silence removal with `--remove-silence`
- Optional outro video appending with `--outro=outro.mp4`
- Global `--disable-heading` to easily turn off heading rendering
- Safe output filenames based on clip ID and title
- Works on Windows, macOS, and Linux if Node.js and FFmpeg are installed

---

## Requirements

You need these installed:

1. Node.js
2. FFmpeg
3. FFprobe

FFprobe usually comes with FFmpeg.

Check installation:

```bash
node -v
ffmpeg -version
ffprobe -version
```

If `ffmpeg` or `ffprobe` is not recognized on Windows, install FFmpeg and add the FFmpeg `bin` folder to your system PATH.

Example FFmpeg path on Windows:

```text
C:\ffmpeg\bin
```

---

## Project Structure

Example folder:

```text
video-clipper/
  clip-from-csv.js
  full-video.mp4
  sentence_structure_chapters.csv
  clips/
```

The `clips` folder will be created automatically if it does not exist.

---

## CSV Format

The script expects these columns:

```csv
ID,Final title,Source time range,Notes,show_heading
1,Class Goal: Build 1000+ Correct Sentences from One Structure,00:01:49–00:03:54,Optional intro module.,true
2,Sentence Pattern: What Makes a Sentence Work?,00:03:57–00:05:58,Good conceptual setup.,true
```

Required columns:

| Column | Required | Description |
|---|---:|---|
| `ID` | Yes | Used to number the output file |
| `Final title` | Yes | Used in the output filename and heading text |
| `Source time range` | Yes | Start and end time for the clip |
| `Notes` | No | Currently ignored by the script |
| `show_heading` | No | Set to `true` to render the title as a yellowish golden heading |

Supported time formats:

```text
00:01:49–00:03:54
00:01:49-00:03:54
01:03:58–01:13:39
```

The script supports both normal hyphen `-` and en dash `–` between start and end times.

---

## Basic Usage

Trim clips only:

```bash
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips
```

This will create separate MP4 files inside the `clips` folder.

Example output:

```text
clips/
  01_Class_Goal_Build_1000+_Correct_Sentences_from_One_Structure.mp4
  02_Sentence_Pattern_What_Makes_a_Sentence_Work.mp4
  03_Subject_+_Verb_+_Object_The_Skeleton_of_English.mp4
```

---

## Remove Dead Silence

To trim clips and remove dead silence from each clip, use:

```bash
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --remove-silence
```

When `--remove-silence` is enabled, the script does this for each CSV row:

```text
1. Trim raw clip from the full video
2. Detect silence inside the raw clip
3. Remove silent sections from audio and video
4. Save the cleaned final clip
5. Delete the temporary raw clip
```

---

## Silence Removal Options

You can customize the silence detection behavior.

### Default settings

```bash
--silence-threshold -35dB
--silence-duration 0.6
--keep-silence 0.12
```

Full example:

```bash
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --remove-silence --silence-threshold -35dB --silence-duration 0.6 --keep-silence 0.12
```

### Option details

| Option | Example | Meaning |
|---|---|---|
| `--remove-silence` | `--remove-silence` | Enables dead silence removal |
| `--silence-threshold` | `-35dB` | Audio quieter than this is treated as silence |
| `--silence-duration` | `0.6` | Silence must last this many seconds before being removed |
| `--keep-silence` | `0.12` | Keeps a small amount of silence before and after each cut |
| `--disable-heading`| `--disable-heading` | Globally disable the heading rendering even if `show_heading` is true |
| `--outro`| `--outro=outro.mp4` | Merge a specific video at the end of each generated clip |

---

## Recommended Silence Settings

Good starting point for spoken educational videos:

```bash
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --remove-silence --silence-threshold -35dB --silence-duration 0.6 --keep-silence 0.12
```

If too much speech is being cut:

```bash
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --remove-silence --silence-threshold -40dB --silence-duration 0.8 --keep-silence 0.2
```

If not enough silence is being removed:

```bash
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --remove-silence --silence-threshold -30dB --silence-duration 0.4 --keep-silence 0.08
```

---

## Custom FFmpeg Path

If FFmpeg is installed but not available in PATH, you can set custom paths using environment variables.

### Windows CMD

```bat
set FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
set FFPROBE_PATH=C:\ffmpeg\bin\ffprobe.exe
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --remove-silence
```

### PowerShell

```powershell
$env:FFMPEG_PATH="C:\ffmpeg\bin\ffmpeg.exe"
$env:FFPROBE_PATH="C:\ffmpeg\bin\ffprobe.exe"
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --remove-silence
```

### macOS/Linux

```bash
FFMPEG_PATH=/usr/local/bin/ffmpeg FFPROBE_PATH=/usr/local/bin/ffprobe node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --remove-silence
```

---

## How Output Files Are Named

The script uses this format:

```text
<ID>_<Final title>.mp4
```

Example:

```text
01_Class_Goal_Build_1000+_Correct_Sentences_from_One_Structure.mp4
```

Unsafe filename characters are removed automatically.

---

## Troubleshooting

### Error: `spawn ffmpeg ENOENT`

This means Node.js cannot find FFmpeg.

Fix:

1. Install FFmpeg
2. Add FFmpeg `bin` folder to PATH
3. Close and reopen your terminal
4. Test:

```bash
ffmpeg -version
```

Or set `FFMPEG_PATH` and `FFPROBE_PATH` manually.

---

### Error: `spawn ffprobe ENOENT`

This means Node.js cannot find FFprobe.

FFprobe usually comes with FFmpeg. Make sure this file exists:

```text
C:\ffmpeg\bin\ffprobe.exe
```

Then add this folder to PATH:

```text
C:\ffmpeg\bin
```

---

### Warning: `Late SEI is not implemented`

This is an FFmpeg warning related to extra H.264 metadata in the source video.

Usually, it is not fatal.

If the clips are created and play correctly, you can ignore it.

---

### Silence removal cuts too much

Use less aggressive settings:

```bash
--silence-threshold -40dB --silence-duration 0.8 --keep-silence 0.2
```

---

### Silence removal does not cut enough

Use more aggressive settings:

```bash
--silence-threshold -30dB --silence-duration 0.4 --keep-silence 0.08
```

---

## Current Scope

Implemented:

- Trim clips from a CSV
- Optional dead silence removal
- Heading/title text overlay (using `show_heading` column)
- Fixed outro video merge (via `--outro` option)

Not implemented yet:

- Google Sheets direct API integration
- AI/model-based silence or scene detection

---

## Example Commands

### Create clips only

```bash
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips
```

### Create clips and remove silence

```bash
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --remove-silence
```

### Create clips with custom silence settings

```bash
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --remove-silence --silence-threshold -35dB --silence-duration 0.6 --keep-silence 0.12
```

### Create clips and add an outro video

```bash
node clip-from-csv.js --source=full-video.mp4 --clip-sheet=sentence_structure_chapters.csv --output=clips --outro=outro.mp4
```

---

## Notes

For the most accurate clip boundaries, this script re-encodes video using `libx264` instead of doing a fast stream copy.

This is slower than `-c copy`, but it is more reliable when cutting at exact timestamps.
