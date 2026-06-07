import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

import EditorTab from './components/EditorTab'
import SettingsTab from './components/SettingsTab'
import DashboardTab from './components/DashboardTab'

function App() {
  const [activeTab, setActiveTab] = useState('import')

  // State for Import
  const [inputVideo, setInputVideo] = useState(null)
  const [csvPath, setCsvPath] = useState(null)
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
  const [outroVideo, setOutroVideo] = useState(null)
  const [outputDir, setOutputDir] = useState(null)

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
  const [logs, setLogs] = useState([])
  const logsEndRef = useRef(null)

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

  useEffect(() => {
    const handleProgress = (data) => {
      if (data.type === 'init_batch') {
        setClips(data.clips)
        setBatchStats({ total: data.totalClips, completed: 0, startTime: Date.now() })
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
        setLogs((prev) => [...prev, data.message])
      } else if (data.type === 'error') {
        setLogs((prev) => [...prev, `ERROR: ${data.message}`])
        setIsProcessing(false)
      } else if (data.type === 'done') {
        setIsProcessing(false)
      }
    }

    if (window.api) {
      window.api.onProgress(handleProgress)
    }

    return () => {
      if (window.api) {
        window.api.removeAllListeners('process-progress')
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

  const handleSelectFile = async (type) => {
    if (!window.api) return
    const filters =
      type === 'csv'
        ? [{ name: 'CSV', extensions: ['csv'] }]
        : [{ name: 'Videos', extensions: ['mp4', 'mov'] }]
    const file = await window.api.openFile({ filters })
    if (file) {
      if (type === 'video') setInputVideo(file)
      if (type === 'csv') setCsvPath(file)
      if (type === 'outro') setOutroVideo(file)
    }
  }

  const handleSelectDir = async () => {
    if (!window.api) return
    const dir = await window.api.openDirectory()
    if (dir) {
      setOutputDir(dir)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e, type) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filePath = e.dataTransfer.files[0].path
      if (filePath) {
        if (type === 'video') setInputVideo(filePath)
        if (type === 'csv') setCsvPath(filePath)
        if (type === 'outro') setOutroVideo(filePath)
        if (type === 'dir') setOutputDir(filePath)
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

    if (window.api) {
      let encoder = 'libx264'
      if (codecFormat === 'NVIDIA NVENC') encoder = 'h264_nvenc'
      if (codecFormat === 'Apple VideoToolbox') encoder = 'h264_videotoolbox'

      window.api.startProcessing({
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
    }
  }

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div>
          <h1>ShortGen</h1>
          <div className="sidebar-version">V 2.4.0</div>

          <div
            className={`nav-item ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <span className="material-symbols-outlined" style={{ marginRight: 12 }}>
              play_circle
            </span>
            Editor
          </div>
          <div className={`nav-item`} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <span className="material-symbols-outlined" style={{ marginRight: 12 }}>
              content_cut
            </span>
            Trim Preview
          </div>
          <div
            className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <span className="material-symbols-outlined" style={{ marginRight: 12 }}>
              grid_view
            </span>
            Dashboard
          </div>
          <div
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="material-symbols-outlined" style={{ marginRight: 12 }}>
              settings
            </span>
            Settings
          </div>
        </div>
      </nav>

      <main className="main-content">
        <header className="header">
          <div className="header-left">WORKSPACE &gt; NEW PROJECT</div>
          <div className="header-right">
            <Button
              variant="outline"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--outline)',
                color: '#fff'
              }}
            >
              Export
            </Button>
            <Button
              onClick={handleStart}
              disabled={isProcessing}
              style={{ backgroundColor: '#a78bfa', color: '#121212', fontWeight: 600 }}
            >
              {isProcessing ? 'Processing...' : 'Process All'}
            </Button>
          </div>
        </header>

        <div className="workspace">
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
      </main>
    </div>
  )
}

export default App
