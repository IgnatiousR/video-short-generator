# Goal Description

The goal is to convert the existing `video-clipper` Node.js CLI tool into a desktop GUI application using **Electron.js** for the desktop window and **React** for the user interface. We will use the `electron-vite` scaffolding to manage the build process, and we will use native Electron Inter-Process Communication (IPC) to pass messages between the React frontend and the Node.js backend. We will also bundle FFmpeg statically so the app is completely self-contained.

## Why We Don't Need Remotion

**Remotion** is an incredible tool for *creating* videos programmatically from scratch using React components (HTML, CSS, Canvas). However, for your specific use case (trimming existing MP4 files, detecting and removing audio silence, and concatenating an outro), **raw FFmpeg is the absolute best tool for the job.** You've already written the complex FFmpeg filter logic! Rewriting that into Remotion would be overkill, less efficient for basic trimming, and unnecessary. We will stick with your existing FFmpeg logic.

## Proposed Architecture

We will restructure the project using the `create-electron-vite` scaffolding. 

### 1. Electron Backend (Main Process)
- **`src/main/index.js`**: The Electron entry point that creates the browser window and sets up IPC listeners.
- **`src/preload/index.js`**: A preload script to securely expose IPC methods to the React frontend.
- **FFmpeg Integration**: We will use `ffmpeg-static` and `ffprobe-static` npm packages. This means your app will download the necessary binaries during `npm install` and bundle them into your final executable.
- **Refactoring `clip-from-csv.js`**: We will move your `lib/` folder and `clip-from-csv.js` logic into the Main process directory, updating the FFmpeg spawn paths to use the static binaries. When the user clicks "Start" in the UI, React will send an IPC message, and the Main process will begin processing, streaming progress updates back to React.

### 2. React Frontend (Renderer Process)
We will implement the user interface based on the designs from our Stitch project. The UI will be built in React within `src/renderer/` and will consist of the following key screens:

- **Editor - Import Assets**: The initial screen where users can import `inputVideo.mp4`, `sheet.csv`, and any other required assets using native file pickers.
- **Clip Preview & Review**: A screen to preview the imported video, review the CSV chapters, and prepare the clips for extraction.
- **App Settings**: A configuration screen to toggle processing options such as "Remove Dead Silence", adjust "Silence Threshold", and select an "Outro Video" using clean form controls.
- **Batch Processing Status**: A progress dashboard to show real-time processing status, displaying which clip is currently being processed by FFmpeg and the overall completion percentage.

### 3. Build & Configuration
- **Initialization**: We will initialize the scaffolding using `npx create-electron-vite . --template react`.
- **Dependencies**: We will install `ffmpeg-static` and `ffprobe-static`.
- **Packaging**: `electron-vite` comes pre-configured with `electron-builder` to easily package your app into an executable (`.exe` for Windows) when you are ready to distribute it.

## Verification Plan

1. Scaffold the project using `electron-vite` and install dependencies (including static FFmpeg).
2. Verify that the Electron window opens, displaying the default React UI.
3. Migrate your FFmpeg logic and wire up the React components.
4. Select the `full-video.mp4` and `sentence_structure_chapters.csv` through the new UI.
5. Verify that the Electron Main process successfully triggers the FFmpeg processing via IPC and outputs clips to the chosen directory.
6. Ensure the React UI updates in real-time with progress from the backend.
