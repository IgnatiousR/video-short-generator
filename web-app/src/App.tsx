import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { PlayCircle, Scissors, LayoutGrid, Settings, Sparkles } from 'lucide-react'

import EditorTab from './components/EditorTab'
import SettingsTab from './components/SettingsTab'
import DashboardTab from './components/DashboardTab'
import { processVideo } from './lib/processor'

interface MyWindow extends Window {
  api?: {
    onProgress: (cb: (data: Record<string, unknown>) => void) => void;
    removeAllListeners: (event: string) => void;
    startProcessing: (opts: Record<string, unknown>) => void;
  };
  showDirectoryPicker?: (options?: Record<string, unknown>) => Promise<FileSystemDirectoryHandle>;
}

function App() {
  const [activeTab, setActiveTab] = useState('import')

  // State for Import
  const [inputVideo, setInputVideo] = useState<File | null>(null)
  const [csvPath, setCsvPath] = useState<File | null>(null)
  const [inputMode, setInputMode] = useState('csv')
  const [manualClips, setManualClips] = useState(() => [
    {
      id: Date.now(),
      final_title: '',
      startTime: '00:00:00',
      endTime: '00:00:00',
      show_heading: true
    }
  ])
  const [outroVideo, setOutroVideo] = useState<File | null>(null)
  const [outputDir, setOutputDir] = useState<FileSystemDirectoryHandle | null>(null)

  // State for Settings
  const [shouldRemoveSilence, setShouldRemoveSilence] = useState(true)
  const [disableHeading] = useState(false)
  const [silencePreset, setSilencePreset] = useState('standard')
  const [silenceThreshold, setSilenceThreshold] = useState('-35dB')
  const [silenceDuration, setSilenceDuration] = useState(0.6)
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [headingFont] = useState('Inter')
  const [exportQuality, setExportQuality] = useState('1080p')
  const [codecFormat, setCodecFormat] = useState('Software x264')
  const [autoProcess, setAutoProcess] = useState(false)

  const handlePresetChange = (preset) => {
    setSilencePreset(preset)
    if (preset === 'aggressive') {
      setSilenceThreshold('-30dB')
      setSilenceDuration(0.4)
    } else if (preset === 'standard') {
      setSilenceThreshold('-35dB')
      setSilenceDuration(0.6)
    } else if (preset === 'conservative') {
      setSilenceThreshold('-40dB')
      setSilenceDuration(0.8)
    }
  }

  // State for Processing
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [clips, setClips] = useState([])
  const [batchStats, setBatchStats] = useState({ total: 0, completed: 0, startTime: null })
  const [timePassed, setTimePassed] = useState('00m 00s')
  const [logs, setLogs] = useState<string[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval
    if (isProcessing && batchStats.startTime) {
      interval = setInterval(() => {
        const elapsed = Date.now() - batchStats.startTime
        const mins = Math.floor(elapsed / 60000)
        const secs = Math.floor((elapsed % 60000) / 1000)
        setTimePassed(`${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isProcessing, batchStats.startTime])

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const handleProgress = (data: Record<string, unknown>) => {
    if (data.type === 'init_batch') {
      setClips(data.clips as never[])
      setBatchStats({ total: data.totalClips as number, completed: 0, startTime: Date.now() })
      setTimePassed('00m 00s')
      setLogs([])
      setIsProcessing(true)
    } else if (data.type === 'clip_progress') {
      setClips((prev) => {
        const newClips = [...prev]
        const index = newClips.findIndex((c) => c.id === data.id)
        if (index !== -1) {
          newClips[index] = { ...newClips[index], status: data.status, progress: data.progress }
        }
        return newClips
      })

      if (data.status === 'Done') {
        setBatchStats((prev) => ({ ...prev, completed: prev.completed + 1 }))
      }
    } else if (data.type === 'info') {
      setLogs((prev) => [...prev, data.message as string])
    } else if (data.type === 'error') {
      setLogs((prev) => [...prev, `ERROR: ${data.message}`])
      setIsProcessing(false)
    } else if (data.type === 'done') {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    const win = window as unknown as MyWindow;
    if (win.api) {
      win.api.onProgress(handleProgress)
    }

    return () => {
      if (win.api) {
        win.api.removeAllListeners('process-progress')
      }
    }
  }, [])

  const addManualClip = () => {
    setManualClips((prev) => [
      ...prev,
      {
        id: Date.now(),
        final_title: '',
        startTime: '00:00:00',
        endTime: '00:00:00',
        show_heading: true
      }
    ])
  }

  const removeManualClip = (id) => {
    setManualClips((prev) => prev.filter((c) => c.id !== id))
  }

  const updateManualClip = (id, field, value) => {
    setManualClips((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const handleSelectFile = async (type: string) => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      if (type === 'csv') input.accept = '.csv'
      else input.accept = 'video/mp4,video/quicktime'
      
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0]
        if (file) {
          if (type === 'video') setInputVideo(file)
          if (type === 'csv') setCsvPath(file)
          if (type === 'outro') setOutroVideo(file)
          resolve(file)
        } else {
          resolve(null)
        }
      }
      input.click()
    })
  }

  const handleSelectDir = async () => {
    try {
      const win = window as unknown as MyWindow;
      if (win.showDirectoryPicker) {
        const dirHandle = await win.showDirectoryPicker({ mode: 'readwrite' })
        if (dirHandle) {
          setOutputDir(dirHandle)
        }
      }
    } catch (err) {
      console.log('Directory selection cancelled or failed:', err)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent, type: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]
      if (type === 'dir' && item.kind === 'file') {
        try {
          const handle = await (item as unknown as { getAsFileSystemHandle: () => Promise<FileSystemDirectoryHandle | null> }).getAsFileSystemHandle()
          if (handle && handle.kind === 'directory') {
            setOutputDir(handle)
          }
        } catch (err) {
          console.log('Failed to get directory handle from drop', err)
        }
      } else if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          if (type === 'video') setInputVideo(file)
          if (type === 'csv') setCsvPath(file)
          if (type === 'outro') setOutroVideo(file)
        }
      }
    }
  }

  const handleStart = () => {
    if (!inputVideo || !outputDir) {
      setValidationError('Please select your Source Video and Output Directory.')
      return
    }

    if (inputMode === 'csv' && !csvPath) {
      setValidationError('Please select your Trimming CSV.')
      return
    }

    if (inputMode === 'manual') {
      if (manualClips.length === 0) {
        setValidationError('Please add at least one clip.')
        return
      }
      const invalid = manualClips.some((c) => !c.final_title.trim() || !c.startTime || !c.endTime)
      if (invalid) {
        setValidationError('Please fill out all titles and times for manual clips.')
        return
      }

      const timeToSeconds = (t) => {
        const p = (t || '00:00:00').split(':').map(Number)
        return (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0)
      }

      const invalidTime = manualClips.some(
        (c) => timeToSeconds(c.endTime) <= timeToSeconds(c.startTime)
      )
      if (invalidTime) {
        setValidationError('End time must be greater than start time for all clips.')
        return
      }
    }

    setValidationError('')
    setIsProcessing(true)
    setClips([])
    setBatchStats({ total: 0, completed: 0, startTime: null })
    setTimePassed('00m 00s')
    setLogs([])
    setActiveTab('progress')

    const win = window as unknown as MyWindow;
    if (win.api) {
      let encoder = 'libx264'
      if (codecFormat === 'NVIDIA NVENC') encoder = 'h264_nvenc'
      if (codecFormat === 'Apple VideoToolbox') encoder = 'h264_videotoolbox'

      win.api.startProcessing({
        inputVideo,
        csvPath: inputMode === 'csv' ? csvPath : null,
        manualClips: inputMode === 'manual' ? manualClips : null,
        outputDir,
        outroVideo,
        shouldRemoveSilence,
        disableHeading,
        silenceThreshold,
        silenceDuration: Number(silenceDuration),
        aspectRatio,
        headingFont,
        encoder
      })
    } else {
      processVideo({
        inputVideo,
        csvPath: inputMode === 'csv' ? csvPath : null,
        manualClips: inputMode === 'manual' ? manualClips : null,
        outputDir,
        outroVideo,
        shouldRemoveSilence,
        disableHeading,
        silenceThreshold,
        silenceDuration: Number(silenceDuration),
        aspectRatio,
        headingFont
      }, handleProgress)
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground dark overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <nav className="w-64 border-r border-border bg-card flex flex-col justify-between shadow-sm z-10">
        <div>
          <div className="p-6 pb-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              ShortGen
            </h1>
            <div className="text-xs font-semibold text-muted-foreground tracking-widest mt-1">V 2.4.0</div>
          </div>

          <div className="mt-8 flex flex-col gap-1 px-3">
            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${activeTab === 'import' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <PlayCircle className="w-5 h-5" />
              Editor
            </button>
            <button
              disabled
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed text-muted-foreground"
            >
              <Scissors className="w-5 h-5" />
              Trim Preview
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${activeTab === 'progress' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <LayoutGrid className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative z-0">
        
        {/* HEADER */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
            Workspace <span className="mx-2 text-border">&gt;</span> <span className="text-foreground">New Project</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="text-muted-foreground hover:text-foreground">
              Export
            </Button>
            <Button
              onClick={handleStart}
              disabled={isProcessing}
              className="shadow-md shadow-primary/20 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isProcessing ? 'Processing...' : 'Process All'}
            </Button>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div className="flex-1 overflow-hidden p-8">
          <div className="h-full w-full max-w-[1400px] mx-auto">
            {activeTab === 'import' && (
              <EditorTab
                validationError={validationError}
                inputVideo={inputVideo}
                setInputVideo={setInputVideo}
                handleSelectFile={handleSelectFile}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                inputMode={inputMode}
                setInputMode={setInputMode}
                csvPath={csvPath}
                setCsvPath={setCsvPath}
                manualClips={manualClips}
                updateManualClip={updateManualClip}
                removeManualClip={removeManualClip}
                addManualClip={addManualClip}
                outroVideo={outroVideo}
                setOutroVideo={setOutroVideo}
                outputDir={outputDir}
                setOutputDir={setOutputDir}
                handleSelectDir={handleSelectDir}
                isProcessing={isProcessing}
                handleStart={handleStart}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                exportQuality={exportQuality}
                setExportQuality={setExportQuality}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                codecFormat={codecFormat}
                setCodecFormat={setCodecFormat}
                outputDir={outputDir}
                handleSelectDir={handleSelectDir}
                autoProcess={autoProcess}
                setAutoProcess={setAutoProcess}
                shouldRemoveSilence={shouldRemoveSilence}
                setShouldRemoveSilence={setShouldRemoveSilence}
                silencePreset={silencePreset}
                handlePresetChange={handlePresetChange}
                silenceThreshold={silenceThreshold}
                setSilenceThreshold={setSilenceThreshold}
                silenceDuration={silenceDuration}
                setSilenceDuration={setSilenceDuration}
              />
            )}

            {activeTab === 'progress' && (
              <DashboardTab
                batchStats={batchStats}
                timePassed={timePassed}
                clips={clips}
                isProcessing={isProcessing}
                outputDir={outputDir}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
