import React from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TimeInput } from "@/components/ui/time-picker"

export default function EditorTab({
  validationError,
  inputVideo, setInputVideo, handleSelectFile, handleDragOver, handleDrop,
  inputMode, setInputMode,
  csvPath, setCsvPath,
  manualClips, updateManualClip, removeManualClip, addManualClip,
  outroVideo, setOutroVideo,
  outputDir, setOutputDir, handleSelectDir,
  isProcessing, handleStart
}) {
  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <h2>Asset Import</h2>
          <p className="subtext">Configure sources for clip generation.</p>
      
          {validationError && (
            <div style={{ padding: 16, backgroundColor: 'rgba(255, 180, 171, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius)', border: '1px solid var(--error)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined">warning</span>
              {validationError}
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Source Video <span style={{ color: 'var(--error)' }}>*</span></label>
              <span style={{ fontSize: '10px', backgroundColor: 'var(--surface-highest)', padding: '2px 6px', borderRadius: '4px', color: 'var(--on-surface-variant)' }}>MP4, MOV</span>
            </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ marginBottom: 0 }}>Trimming CSV <span style={{ color: 'var(--error)' }}>*</span></label>
              <span style={{ fontSize: '10px', backgroundColor: 'var(--surface-highest)', padding: '2px 6px', borderRadius: '4px', color: 'var(--on-surface-variant)' }}>CSV</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, backgroundColor: 'transparent', padding: 0 }}>
                <div 
                  onClick={() => setInputMode('csv')}
                  style={{ padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 14, backgroundColor: inputMode === 'csv' ? 'var(--primary)' : 'transparent', color: inputMode === 'csv' ? '#fff' : 'var(--on-surface-variant)', userSelect: 'none' }}
                >
                  CSV Upload
                </div>
                <div 
                  onClick={() => setInputMode('manual')}
                  style={{ padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 14, backgroundColor: inputMode === 'manual' ? 'var(--primary)' : 'transparent', color: inputMode === 'manual' ? '#fff' : 'var(--on-surface-variant)', userSelect: 'none' }}
                >
                  Manual Input
                </div>
              </div>
            </div>

            {inputMode === 'csv' ? (
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
            ) : (
              <div style={{ backgroundColor: 'var(--primary-container)', borderRadius: 8, padding: 16, border: '1px solid var(--outline)' }}>
                <div style={{ display: 'flex', fontWeight: 600, fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--outline)' }}>
                  <div style={{ flex: 2 }}>FINAL TITLE</div>
                  <div style={{ flex: 2 }}>SOURCE TIME (START - END)</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>HEADING</div>
                  <div style={{ width: 40, textAlign: 'center' }}></div>
                </div>
                
                {manualClips.map((clip) => (
                  <div key={clip.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ flex: 2 }}>
                      <input 
                        type="text" 
                        className="input-text" 
                        placeholder="e.g. Funny Moment"
                        value={clip.final_title} 
                        onChange={e => updateManualClip(clip.id, 'final_title', e.target.value)} 
                        style={{ margin: 0, width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
                      <TimeInput 
                        value={clip.startTime} 
                        onChange={val => updateManualClip(clip.id, 'startTime', val)} 
                      />
                      <span style={{ color: 'var(--on-surface-variant)' }}>-</span>
                      <TimeInput 
                        value={clip.endTime} 
                        onChange={val => updateManualClip(clip.id, 'endTime', val)} 
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                      <Checkbox 
                        id={`show_heading_${clip.id}`}
                        checked={clip.show_heading} 
                        onCheckedChange={val => updateManualClip(clip.id, 'show_heading', val)} 
                      />
                    </div>
                    <div style={{ width: 40, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                      <span 
                        className="material-symbols-outlined action-icon" 
                        style={{ color: 'var(--error)', cursor: 'pointer', opacity: 0.8 }}
                        onClick={() => removeManualClip(clip.id)}
                        title="Remove clip"
                      >
                        delete
                      </span>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" onClick={addManualClip} style={{ marginTop: 8, width: '100%', borderStyle: 'dashed', backgroundColor: 'transparent', borderColor: 'var(--outline)' }}>
                  <span className="material-symbols-outlined" style={{ marginRight: 8 }}>add</span> Add Clip
                </Button>
              </div>
            )}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Outro Video (Optional)</label>
              <span style={{ fontSize: '10px', backgroundColor: 'var(--surface-highest)', padding: '2px 6px', borderRadius: '4px', color: 'var(--on-surface-variant)' }}>MP4</span>
            </div>
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
      </div>
      
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', marginBottom: 0, maxWidth: '800px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--outline)', backgroundColor: inputVideo ? 'var(--primary)' : 'transparent' }}></div>
            <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>Source: {inputVideo ? 'Ready' : 'Pending'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--outline)', backgroundColor: ((inputMode === 'csv' && csvPath) || (inputMode === 'manual' && manualClips.length > 0)) ? 'var(--primary)' : 'transparent' }}></div>
            <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>CSV: {((inputMode === 'csv' && csvPath) || (inputMode === 'manual' && manualClips.length > 0)) ? 'Ready' : 'Pending'}</span>
          </div>
        </div>
        <Button onClick={handleStart} disabled={isProcessing} style={{ backgroundColor: 'var(--surface-high)', color: '#fff', border: '1px solid var(--outline)' }}>
          <span className="material-symbols-outlined" style={{ marginRight: '8px', fontSize: '16px' }}>auto_awesome</span>
          Generate Clips
        </Button>
      </div>
    </div>
  )
}
