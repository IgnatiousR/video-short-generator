/* eslint-disable @typescript-eslint/no-explicit-any */
import PropTypes from 'prop-types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TimeInput } from '@/components/ui/time-picker'
import { 
  Film, FileSpreadsheet, FolderPlus, FolderOpen, 
  AlertCircle, Plus, Trash2, X, Wand2, MonitorPlay 
} from 'lucide-react'
import { useMemo } from 'react'

export default function EditorTab({
  validationError,
  inputVideo,
  setInputVideo,
  handleSelectFile,
  handleDragOver,
  handleDrop,
  inputMode,
  setInputMode,
  csvPath,
  setCsvPath,
  manualClips,
  updateManualClip,
  removeManualClip,
  addManualClip,
  outroVideo,
  setOutroVideo,
  outputDir,
  setOutputDir,
  handleSelectDir,
  isProcessing,
  handleStart
}: any) {

  const videoSrc = useMemo(() => {
    if (inputVideo instanceof File) {
      return URL.createObjectURL(inputVideo)
    }
    return null
  }, [inputVideo])

  return (
    <div className="flex gap-6 h-full animate-in fade-in duration-500">
      
      {/* LEFT COLUMN - FORMS */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Asset Import</h2>
            <p className="text-sm text-muted-foreground">Configure sources for clip generation.</p>
          </div>

          {validationError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{validationError}</p>
            </div>
          )}

          {/* SOURCE VIDEO */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Source Video <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-muted text-muted-foreground px-2 py-1 rounded">
                MP4, MOV
              </span>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer text-center
                ${inputVideo ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/30'}`}
              onClick={() => handleSelectFile('video')}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'video')}
            >
              <Film className={`w-8 h-8 ${inputVideo ? 'text-primary' : 'text-muted-foreground'}`} />
              {inputVideo ? (
                <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md shadow-sm">
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {inputVideo?.name || inputVideo}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setInputVideo(null) }}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click to browse or drag and drop source video</p>
              )}
            </div>
          </div>

          {/* TRIMMING DATA */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Trimming Data <span className="text-destructive">*</span>
              </label>
            </div>
            
            <div className="flex bg-muted p-1 rounded-lg w-fit">
              <button
                onClick={() => setInputMode('csv')}
                className={`text-sm font-medium px-4 py-1.5 rounded-md transition-all ${inputMode === 'csv' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                CSV Upload
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`text-sm font-medium px-4 py-1.5 rounded-md transition-all ${inputMode === 'manual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Manual Input
              </button>
            </div>

            {inputMode === 'csv' ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer text-center
                  ${csvPath ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/30'}`}
                onClick={() => handleSelectFile('csv')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'csv')}
              >
                <FileSpreadsheet className={`w-8 h-8 ${csvPath ? 'text-primary' : 'text-muted-foreground'}`} />
                {csvPath ? (
                  <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md shadow-sm">
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {csvPath?.name || csvPath}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCsvPath(null) }}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to browse or drag and drop CSV file</p>
                )}
              </div>
            ) : (
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                  <div className="flex-[2]">FINAL TITLE</div>
                  <div className="flex-[2]">SOURCE TIME (START - END)</div>
                  <div className="flex-1 text-center">HEADING</div>
                  <div className="w-10"></div>
                </div>

                <div className="space-y-3">
                  {manualClips.map((clip: any) => (
                    <div key={clip.id} className="flex gap-3 items-center group">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="e.g. Funny Moment"
                          value={clip.final_title}
                          onChange={(e) => updateManualClip(clip.id, 'final_title', e.target.value)}
                        />
                      </div>
                      <div className="flex-[2] flex gap-2 items-center">
                        <TimeInput
                          value={clip.startTime}
                          onChange={(val: any) => updateManualClip(clip.id, 'startTime', val)}
                        />
                        <span className="text-muted-foreground">-</span>
                        <TimeInput
                          value={clip.endTime}
                          onChange={(val: any) => updateManualClip(clip.id, 'endTime', val)}
                        />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <Checkbox
                          id={`show_heading_${clip.id}`}
                          checked={clip.show_heading}
                          onCheckedChange={(val) => updateManualClip(clip.id, 'show_heading', val)}
                        />
                      </div>
                      <div className="w-10 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          onClick={() => removeManualClip(clip.id)}
                          title="Remove clip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={addManualClip}
                  className="w-full mt-4 border-dashed border-border bg-transparent hover:bg-muted"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Clip
                </Button>
              </div>
            )}
          </div>

          {/* OUTRO VIDEO */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Outro Video <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-muted text-muted-foreground px-2 py-1 rounded">
                MP4
              </span>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer text-center
                ${outroVideo ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/30'}`}
              onClick={() => handleSelectFile('outro')}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'outro')}
            >
              <FolderPlus className={`w-6 h-6 ${outroVideo ? 'text-primary' : 'text-muted-foreground'}`} />
              {outroVideo ? (
                <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md shadow-sm">
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {outroVideo?.name || outroVideo}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOutroVideo(null) }}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click to browse or drag and drop outro video</p>
              )}
            </div>
          </div>

          {/* OUTPUT DIRECTORY */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Output Directory <span className="text-destructive">*</span>
              </label>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer text-center
                ${outputDir ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/30'}`}
              onClick={handleSelectDir}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'dir')}
            >
              <FolderOpen className={`w-6 h-6 ${outputDir ? 'text-primary' : 'text-muted-foreground'}`} />
              {outputDir ? (
                <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md shadow-sm">
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {outputDir?.name || outputDir}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOutputDir(null) }}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click to select or drag and drop output directory</p>
              )}
            </div>
          </div>
        </div>

        {/* STATUS & GENERATE BUTTON */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between sticky bottom-0 mt-auto">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${inputVideo ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-muted-foreground/30'}`} />
              <span className="text-sm font-medium text-muted-foreground">
                Video: <span className={inputVideo ? 'text-foreground' : ''}>{inputVideo ? 'Ready' : 'Pending'}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${(inputMode === 'csv' && csvPath) || (inputMode === 'manual' && manualClips.length > 0) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-muted-foreground/30'}`} />
              <span className="text-sm font-medium text-muted-foreground">
                Data: <span className={(inputMode === 'csv' && csvPath) || (inputMode === 'manual' && manualClips.length > 0) ? 'text-foreground' : ''}>
                  {(inputMode === 'csv' && csvPath) || (inputMode === 'manual' && manualClips.length > 0) ? 'Ready' : 'Pending'}
                </span>
              </span>
            </div>
          </div>

          <Button
            onClick={handleStart}
            disabled={isProcessing}
            className="gap-2 shadow-md shadow-primary/20"
          >
            <Wand2 className="w-4 h-4" />
            Generate Clips
          </Button>
        </div>
      </div>

      {/* RIGHT COLUMN - PREVIEW PLAYER */}
      <div className="w-[350px] lg:w-[450px] bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <MonitorPlay className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Video Preview</h3>
        </div>
        
        <div className="flex-1 bg-black relative flex flex-col items-center justify-center">
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              controlsList="nodownload"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
              <Film className="w-16 h-16 opacity-50" />
              <p className="text-sm font-medium">No video selected</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-muted/20 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {videoSrc ? 'Use the controls to preview clip timings before rendering.' : 'Import a source video to preview it here.'}
          </p>
        </div>
      </div>
      
    </div>
  )
}

EditorTab.propTypes = {
  validationError: PropTypes.string,
  inputVideo: PropTypes.any,
  setInputVideo: PropTypes.func,
  handleSelectFile: PropTypes.func,
  handleDragOver: PropTypes.func,
  handleDrop: PropTypes.func,
  inputMode: PropTypes.string,
  setInputMode: PropTypes.func,
  csvPath: PropTypes.any,
  setCsvPath: PropTypes.func,
  manualClips: PropTypes.array,
  updateManualClip: PropTypes.func,
  removeManualClip: PropTypes.func,
  addManualClip: PropTypes.func,
  outroVideo: PropTypes.any,
  setOutroVideo: PropTypes.func,
  outputDir: PropTypes.any,
  setOutputDir: PropTypes.func,
  handleSelectDir: PropTypes.func,
  isProcessing: PropTypes.bool,
  handleStart: PropTypes.func
}
