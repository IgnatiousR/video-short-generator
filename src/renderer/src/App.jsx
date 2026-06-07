import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
function App() {
  const [activeTab, setActiveTab] = useState('import')
  
  // State for Import
  const [inputVideo, setInputVideo] = useState(null)
  const [csvPath, setCsvPath] = useState(null)
  const [outroVideo, setOutroVideo] = useState(null)
  const [outputDir, setOutputDir] = useState(null)

  // State for Settings
  const [shouldRemoveSilence, setShouldRemoveSilence] = useState(true)
  const [disableHeading, setDisableHeading] = useState(false)
  const [silencePreset, setSilencePreset] = useState('standard')
  const [silenceThreshold, setSilenceThreshold] = useState('-35dB')
  const [silenceDuration, setSilenceDuration] = useState(0.6)
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [headingFont, setHeadingFont] = useState('Inter')

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
  const [estimatedTime, setEstimatedTime] = useState('00m 00s')
  const [logs, setLogs] = useState([])
  const logsEndRef = useRef(null)

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
        setEstimatedTime('Calculating...')
        setLogs([])
        setIsProcessing(true)
      } else if (data.type === 'clip_progress') {
        setClips(prev => {
          const newClips = [...prev]
          const index = newClips.findIndex(c => c.id === data.id)
          if (index !== -1) {
            newClips[index] = { ...newClips[index], status: data.status, progress: data.progress }
          }
          return newClips
        })
        
        if (data.status === 'Done') {
          setBatchStats(prev => {
            const newCompleted = prev.completed + 1
            const elapsed = Date.now() - prev.startTime
            const timePerClip = elapsed / newCompleted
            const remaining = prev.total - newCompleted
            const msLeft = timePerClip * remaining
            
            let timeStr = ''
            if (newCompleted === prev.total) {
              timeStr = '00m 00s'
            } else {
              const mins = Math.floor(msLeft / 60000)
              const secs = Math.floor((msLeft % 60000) / 1000)
              timeStr = `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
            }
            
            setEstimatedTime(timeStr)
            return { ...prev, completed: newCompleted }
          })
        }
      } else if (data.type === 'info') {
        setLogs(prev => [...prev, data.message])
      } else if (data.type === 'error') {
        setLogs(prev => [...prev, `ERROR: ${data.message}`])
        setIsProcessing(false)
      } else if (data.type === 'done') {
        setIsProcessing(false)
        setEstimatedTime('00m 00s')
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

  const handleSelectFile = async (type) => {
    if (!window.api) return
    const filters = type === 'csv' ? [{ name: 'CSV', extensions: ['csv'] }] : [{ name: 'Videos', extensions: ['mp4', 'mov'] }]
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
    if (!inputVideo || !csvPath || !outputDir) {
      setValidationError("Please select your Source Video, Trimming CSV, and Output Directory.")
      return
    }
    setValidationError('')
    setIsProcessing(true)
    setClips([])
    setBatchStats({ total: 0, completed: 0, startTime: null })
    setEstimatedTime('Calculating...')
    setLogs([])
    setActiveTab('progress')

    if (window.api) {
      window.api.startProcessing({
        inputVideo,
        csvPath,
        outputDir,
        outroVideo,
        shouldRemoveSilence,
        disableHeading,
        silenceThreshold,
        silenceDuration: Number(silenceDuration),
        aspectRatio,
        headingFont
      })
    }
  }

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h1>ShortGen</h1>
        <div 
          className={`nav-item ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          <span className="material-symbols-outlined" style={{ marginRight: 12 }}>video_library</span>
          Editor - Import
        </div>
        <div 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="material-symbols-outlined" style={{ marginRight: 12 }}>settings</span>
          App Settings
        </div>
        <div 
          className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <span className="material-symbols-outlined" style={{ marginRight: 12 }}>analytics</span>
          Processing Status
        </div>
      </nav>

      <main className="main-content">
        <header className="header">
          <div>Workspace &gt; New Project</div>
          <div>
            <Button onClick={handleStart} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Generate Clips'}
            </Button>
          </div>
        </header>

        <div className="workspace">
          {activeTab === 'import' && (
            <div className="card">
              <h2>Asset Import</h2>
              <p style={{ color: 'var(--on-surface-variant)', marginBottom: 24 }}>Configure sources for clip generation.</p>
              
              {validationError && (
                <div style={{ padding: 16, backgroundColor: 'rgba(255, 180, 171, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius)', border: '1px solid var(--error)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined">warning</span>
                  {validationError}
                </div>
              )}

              <div className="form-group">
                <label>Source Video <span style={{ color: 'var(--error)' }}>*</span></label>
                <div 
                  className="dropzone" 
                  onClick={() => handleSelectFile('video')}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'video')}
                >
                  <div className="icon"><span className="material-symbols-outlined" style={{ fontSize: 32 }}>movie</span></div>
                  {inputVideo ? (
                    <div className="file-selected">
                      {inputVideo}
                      <span className="material-symbols-outlined clear-btn" onClick={(e) => { e.stopPropagation(); setInputVideo(null) }}>close</span>
                    </div>
                  ) : <div>Click to browse or drag and drop source video</div>}
                </div>
              </div>

              <div className="form-group">
                <label>Trimming CSV <span style={{ color: 'var(--error)' }}>*</span></label>
                <div 
                  className="dropzone" 
                  onClick={() => handleSelectFile('csv')}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'csv')}
                >
                  <div className="icon"><span className="material-symbols-outlined" style={{ fontSize: 32 }}>description</span></div>
                  {csvPath ? (
                    <div className="file-selected">
                      {csvPath}
                      <span className="material-symbols-outlined clear-btn" onClick={(e) => { e.stopPropagation(); setCsvPath(null) }}>close</span>
                    </div>
                  ) : <div>Click to browse or drag and drop CSV file</div>}
                </div>
              </div>

              <div className="form-group">
                <label>Outro Video (Optional)</label>
                <div 
                  className="dropzone" 
                  onClick={() => handleSelectFile('outro')}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'outro')}
                >
                  <div className="icon"><span className="material-symbols-outlined" style={{ fontSize: 32 }}>add_box</span></div>
                  {outroVideo ? (
                    <div className="file-selected">
                      {outroVideo}
                      <span className="material-symbols-outlined clear-btn" onClick={(e) => { e.stopPropagation(); setOutroVideo(null) }}>close</span>
                    </div>
                  ) : <div>Click to browse or drag and drop outro video</div>}
                </div>
              </div>

              <div className="form-group">
                <label>Output Directory <span style={{ color: 'var(--error)' }}>*</span></label>
                <div 
                  className="dropzone" 
                  onClick={handleSelectDir}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'dir')}
                >
                  <div className="icon"><span className="material-symbols-outlined" style={{ fontSize: 32 }}>folder_open</span></div>
                  {outputDir ? (
                    <div className="file-selected">
                      {outputDir}
                      <span className="material-symbols-outlined clear-btn" onClick={(e) => { e.stopPropagation(); setOutputDir(null) }}>close</span>
                    </div>
                  ) : <div>Click to select or drag and drop output directory</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card">
              <h2>Processing Settings</h2>
              
              <div className="form-group flex items-center space-x-2" style={{ marginBottom: 16 }}>
                <Checkbox 
                  id="shouldRemoveSilence"
                  checked={shouldRemoveSilence} 
                  onCheckedChange={setShouldRemoveSilence} 
                />
                <Label htmlFor="shouldRemoveSilence" style={{ margin: 0, cursor: 'pointer' }}>Remove Dead Silence</Label>
              </div>

              <div className="form-group flex items-center space-x-2">
                <Checkbox 
                  id="disableHeading"
                  checked={disableHeading} 
                  onCheckedChange={setDisableHeading} 
                />
                <Label htmlFor="disableHeading" style={{ margin: 0, cursor: 'pointer' }}>Disable Heading Text Rendering</Label>
              </div>

              <div className="form-group" style={{ marginTop: 24 }}>
                <Label style={{ marginBottom: 8, display: 'block' }}>Output Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="w-full bg-[#121212] border-[#27272a] focus:ring-[#8B5CF6]">
                    <SelectValue placeholder="Select Aspect Ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">Square (1:1)</SelectItem>
                    <SelectItem value="9:16">Vertical (9:16)</SelectItem>
                    <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!disableHeading && (
                <div className="form-group" style={{ marginTop: 24 }}>
                  <Label style={{ marginBottom: 8, display: 'block' }}>Heading Font Style</Label>
                  <Select value={headingFont} onValueChange={setHeadingFont}>
                    <SelectTrigger className="w-full bg-[#121212] border-[#27272a] focus:ring-[#8B5CF6]">
                      <SelectValue placeholder="Select Font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter (Modern & Clean)</SelectItem>
                      <SelectItem value="Poppins">Poppins (Geometric & Bold)</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display (Classic Serif)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {shouldRemoveSilence && (
                <div style={{ padding: '16px', background: 'var(--primary-container)', borderRadius: '8px', border: '1px solid var(--outline)' }}>
                  <div className="form-group" style={{ marginBottom: silencePreset === 'custom' ? 16 : 0 }}>
                    <Label style={{ marginBottom: 8, display: 'block' }}>Silence Removal Profile</Label>
                    <Select value={silencePreset} onValueChange={handlePresetChange}>
                      <SelectTrigger className="w-full bg-[#121212] border-[#27272a] focus:ring-[#8B5CF6]">
                        <SelectValue placeholder="Select Profile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (Recommended) - -35dB / 0.6s</SelectItem>
                        <SelectItem value="conservative">Conservative - -40dB / 0.8s (Only long pauses)</SelectItem>
                        <SelectItem value="aggressive">Aggressive - -30dB / 0.4s (Tight cuts)</SelectItem>
                        <SelectItem value="custom">Custom (Advanced)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 8, lineHeight: 1.4 }}>
                      {silencePreset === 'standard' && 'Ideal for most podcasts. Removes standard pauses without making speech sound unnatural.'}
                      {silencePreset === 'conservative' && 'Safest option. Only removes very obvious, long gaps. Preserves natural breathing.'}
                      {silencePreset === 'aggressive' && 'Snappy pacing. Removes almost all dead air between words. Can sound choppy.'}
                      {silencePreset === 'custom' && 'Manually tune FFmpeg silence detection filters.'}
                    </p>
                  </div>

                  {silencePreset === 'custom' && (
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Threshold (e.g. -35dB)</label>
                        <input 
                          type="text" 
                          className="input-text" 
                          value={silenceThreshold} 
                          onChange={e => setSilenceThreshold(e.target.value)} 
                        />
                      </div>
                      
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Duration (seconds)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          className="input-text" 
                          value={silenceDuration} 
                          onChange={e => setSilenceDuration(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div>
              <h2 style={{ fontSize: 20, marginBottom: 24, color: '#fff' }}>Batch Processing</h2>
              
              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <div className="card-label">TOTAL SHORTS</div>
                  <div className="card-value">{batchStats.total.toLocaleString()}</div>
                </div>
                <div className="dashboard-card">
                  <div className="card-label">COMPLETED</div>
                  <div className="card-value">{batchStats.completed.toLocaleString()}</div>
                </div>
                <div className="dashboard-card">
                  <div className="card-label">ESTIMATED TIME</div>
                  <div className="card-value">{estimatedTime}</div>
                </div>
              </div>

              <div className="clip-table">
                <div className="clip-header">
                  <div>OUTPUT FILENAME</div>
                  <div>STATUS</div>
                  <div>PROGRESS</div>
                  <div style={{ textAlign: 'right' }}>ACTIONS</div>
                </div>
                
                {clips.map(clip => (
                  <div key={clip.id} className="clip-row">
                    <div className="filename-cell" title={clip.filename}>{clip.filename}</div>
                    <div className={`status-cell status-${clip.status}`}>
                      <span className={`material-symbols-outlined ${clip.status === 'Processing' ? 'spin' : ''}`} style={{ fontSize: 18 }}>
                        {clip.status === 'Processing' ? 'sync' : (clip.status === 'Done' ? 'check_circle' : 'schedule')}
                      </span>
                      {clip.status}
                    </div>
                    <div className={`progress-cell status-${clip.status} flex items-center`}>
                      <div className="flex-1 mr-4">
                        <Progress value={clip.progress} className="h-2 bg-[#27272a] [&>div]:bg-[#8B5CF6]" />
                      </div>
                      <div style={{ width: 40, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {clip.progress}%
                      </div>
                    </div>
                    <div className="actions-cell">
                      <span 
                        className={`material-symbols-outlined action-icon ${clip.status !== 'Done' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={clip.status === 'Done' ? "Open folder" : "Wait for processing"}
                        onClick={() => {
                          if (clip.status === 'Done') {
                            window.api?.showItemInFolder(outputDir + '\\' + clip.filename)
                          }
                        }}
                      >
                        folder_open
                      </span>
                    </div>
                  </div>
                ))}

                {clips.length === 0 && !isProcessing && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    No batch currently processing.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
