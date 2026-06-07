import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { safeFileName } from './utils'
import { csvToObjects } from './csv-parser'
import { parseTimeRange } from './time-utils'

export interface ProcessOptions {
  inputVideo: File;
  csvPath: File | null;
  manualClips: Record<string, unknown>[] | null;
  outputDir: FileSystemDirectoryHandle | null;
  shouldRemoveSilence?: boolean;
  disableHeading?: boolean;
  outroVideo?: File | null;
  silenceThreshold?: string;
  silenceDuration?: number;
  aspectRatio?: string;
  headingFont?: string;
}

let ffmpeg: FFmpeg | null = null

export async function processVideo(options: ProcessOptions, sendProgress: (data: Record<string, unknown>) => void) {
  const {
    inputVideo,
    csvPath,
    manualClips,
    outputDir,
    shouldRemoveSilence,
    disableHeading,
    outroVideo,
    silenceThreshold = '-35dB',
    silenceDuration = 0.6,
    aspectRatio,
  } = options

  // Log unused advanced options for future implementation
  console.log('Advanced options (to be implemented in Wasm):', {
    shouldRemoveSilence, disableHeading, silenceThreshold, silenceDuration
  })

  if (!ffmpeg) {
    sendProgress({ type: 'info', message: 'Loading FFmpeg.wasm...' })
    ffmpeg = new FFmpeg()
    
    ffmpeg.on('log', ({ message }) => {
      console.log(message)
    })

    await ffmpeg.load()
    sendProgress({ type: 'info', message: 'FFmpeg.wasm loaded successfully.' })
  }

  try {
    let rows: Record<string, string>[] = []
    
    if (manualClips && manualClips.length > 0) {
      rows = manualClips.map((clip: Record<string, unknown>, index: number) => ({
        ID: String(index + 1),
        'Final title': String(clip.final_title || ''),
        'Source time range': `${clip.startTime}-${clip.endTime}`,
        show_heading: clip.show_heading ? 'TRUE' : 'FALSE'
      }))
      sendProgress({ type: 'info', message: `Loaded ${rows.length} manual clips.` })
    } else if (csvPath) {
      const csvText = await csvPath.text()
      rows = csvToObjects(csvText)
      sendProgress({ type: 'info', message: `Found ${rows.length} rows in CSV.` })
    }

    const validRows = rows.filter((r) => r['ID'] && r['Final title'] && r['Source time range'])
    const totalRows = validRows.length

    sendProgress({
      type: 'init_batch',
      totalClips: totalRows,
      clips: validRows.map((r) => ({
        id: r['ID'],
        filename: `${safeFileName(r['Final title'])}.mp4`,
        status: 'Queued',
        progress: 0
      }))
    })

    // Write input video to MEMFS
    sendProgress({ type: 'info', message: 'Writing source video to memory...' })
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputVideo))

    if (outroVideo) {
      sendProgress({ type: 'info', message: 'Writing outro video to memory...' })
      await ffmpeg.writeFile('outro.mp4', await fetchFile(outroVideo))
    }

    // Process each clip
    for (const row of validRows) {
      const id = row['ID']
      const title = row['Final title']
      const range = row['Source time range']
      
      sendProgress({ type: 'clip_progress', id, status: 'Processing', progress: 5 })

      const { start, duration } = parseTimeRange(range)
      const outputName = `${safeFileName(title)}.mp4`

      // 1. Trim clip
      const args = ['-y', '-hide_banner', '-ss', start, '-i', 'input.mp4', '-t', String(duration)]
      
      // Setup scaling/padding based on aspect ratio
      let w = 1080
      let h = 1080
      let dar = '1:1'
      if (aspectRatio === '9:16') {
        w = 1080
        h = 1920
        dar = '9:16'
      } else if (aspectRatio === '16:9') {
        w = 1920
        h = 1080
        dar = '16:9'
      }
      
      const filterComplex = `[0:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1:1,setdar=${dar},fps=30,format=yuv420p[v]`
      args.push('-filter_complex', filterComplex)
      args.push('-map', '[v]')
      args.push('-map', '0:a?')

      // Fast encoding presets for WebAssembly
      args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28')
      args.push('-c:a', 'aac', '-b:a', '128k')
      args.push(outputName)

      sendProgress({ type: 'clip_progress', id, status: 'Processing', progress: 50 })
      
      await ffmpeg.exec(args)

      sendProgress({ type: 'clip_progress', id, status: 'Processing', progress: 90 })

      // Read output from MEMFS
      const outputData = await ffmpeg.readFile(outputName)
      
      // Save to Output Directory Handle
      if (outputDir) {
        const fileHandle = await outputDir.getFileHandle(outputName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(new Uint8Array(outputData as Uint8Array))
        await writable.close()
      } else {
        // Fallback: trigger download
        const blob = new Blob([new Uint8Array(outputData as Uint8Array)], { type: 'video/mp4' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = outputName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      sendProgress({ type: 'clip_progress', id, status: 'Done', progress: 100 })
      
      // Clean up MEMFS for this file
      await ffmpeg.deleteFile(outputName)
    }

    sendProgress({ type: 'info', message: '\nAll clips created successfully.' })
    sendProgress({ type: 'done' })

  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'An error occurred during processing.'
    sendProgress({ type: 'error', message })
  }
}
