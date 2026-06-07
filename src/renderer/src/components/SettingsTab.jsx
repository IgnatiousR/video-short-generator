import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsTab({
  exportQuality, setExportQuality,
  aspectRatio, setAspectRatio,
  codecFormat, setCodecFormat,
  outputDir, handleSelectDir,
  autoProcess, setAutoProcess,
  shouldRemoveSilence, setShouldRemoveSilence,
  silencePreset, handlePresetChange,
  silenceThreshold, setSilenceThreshold,
  silenceDuration, setSilenceDuration
}) {
  const [isMac, setIsMac] = useState(false);
  const [hasNvidia, setHasNvidia] = useState(false);

  useEffect(() => {
    // Detect OS
    setIsMac(navigator.userAgent.toLowerCase().includes('mac'));
    
    // Detect GPU
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer && renderer.toLowerCase().includes('nvidia')) {
            setHasNvidia(true);
          }
        }
      }
    } catch (e) {
      console.error("Failed to detect GPU", e);
    }
  }, []);

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Export Configuration</h2>
      <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginBottom: '32px' }}>Manage default rendering, codec, and output preferences for batch processing.</p>
      
      <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', backgroundColor: 'transparent' }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--on-surface)', marginBottom: '12px' }}>Export Quality</label>
            <div style={{ display: 'flex', border: '1px solid var(--outline)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div 
                onClick={() => setExportQuality('1080p')}
                style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '13px', cursor: 'pointer', backgroundColor: exportQuality === '1080p' ? 'var(--surface-high)' : 'transparent', color: exportQuality === '1080p' ? '#fff' : 'var(--on-surface-variant)' }}
              >1080p</div>
              <div style={{ width: '1px', backgroundColor: 'var(--outline)' }}></div>
              <div 
                onClick={() => setExportQuality('4K UHD')}
                style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '13px', cursor: 'pointer', backgroundColor: exportQuality === '4K UHD' ? 'var(--surface-high)' : 'transparent', color: exportQuality === '4K UHD' ? '#fff' : 'var(--on-surface-variant)' }}
              >4K UHD</div>
            </div>
            {exportQuality === '4K UHD' && <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '8px' }}>4K rendering increases processing time by ~2.5x.</p>}
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--on-surface)', marginBottom: '12px' }}>Aspect Ratio</label>
            <div style={{ display: 'flex', border: '1px solid var(--outline)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div 
                onClick={() => setAspectRatio('Original')}
                style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '13px', cursor: 'pointer', backgroundColor: aspectRatio === 'Original' ? 'var(--surface-high)' : 'transparent', color: aspectRatio === 'Original' ? '#fff' : 'var(--on-surface-variant)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '6px' }}>aspect_ratio</span>
                Original
              </div>
              <div style={{ width: '1px', backgroundColor: 'var(--outline)' }}></div>
              <div 
                onClick={() => setAspectRatio('9:16')}
                style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '13px', cursor: 'pointer', backgroundColor: aspectRatio === '9:16' ? 'var(--surface-high)' : 'transparent', color: aspectRatio === '9:16' ? '#fff' : 'var(--on-surface-variant)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '6px' }}>smartphone</span>
                9:16
              </div>
              <div style={{ width: '1px', backgroundColor: 'var(--outline)' }}></div>
              <div 
                onClick={() => setAspectRatio('1:1')}
                style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '13px', cursor: 'pointer', backgroundColor: aspectRatio === '1:1' ? 'var(--surface-high)' : 'transparent', color: aspectRatio === '1:1' ? '#fff' : 'var(--on-surface-variant)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '6px' }}>crop_square</span>
                1:1
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ height: '1px', backgroundColor: 'var(--outline)' }}></div>
        
        <div style={{ display: 'flex', gap: '32px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--on-surface)', marginBottom: '12px' }}>Hardware Encoder</label>
            <div style={{ display: 'flex', border: '1px solid var(--outline)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div 
                onClick={() => setCodecFormat('Software x264')}
                style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '13px', cursor: 'pointer', backgroundColor: codecFormat === 'Software x264' ? 'var(--surface-high)' : 'transparent', color: codecFormat === 'Software x264' ? '#fff' : 'var(--on-surface-variant)' }}
              >Software (x264)</div>
              <div style={{ width: '1px', backgroundColor: 'var(--outline)' }}></div>
              <div 
                onClick={() => { if (hasNvidia) setCodecFormat('NVIDIA NVENC') }}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  textAlign: 'center', 
                  fontSize: '13px', 
                  cursor: hasNvidia ? 'pointer' : 'not-allowed', 
                  backgroundColor: codecFormat === 'NVIDIA NVENC' ? 'var(--surface-high)' : 'transparent', 
                  color: codecFormat === 'NVIDIA NVENC' ? '#fff' : 'var(--on-surface-variant)',
                  opacity: hasNvidia ? 1 : 0.4
                }}
                title={hasNvidia ? "" : "Requires NVIDIA GPU"}
              >NVENC (NVIDIA) {!hasNvidia && <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: 'middle', marginLeft: 4 }}>lock</span>}</div>
              <div style={{ width: '1px', backgroundColor: 'var(--outline)' }}></div>
              <div 
                onClick={() => { if (isMac) setCodecFormat('Apple VideoToolbox') }}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  textAlign: 'center', 
                  fontSize: '13px', 
                  cursor: isMac ? 'pointer' : 'not-allowed', 
                  backgroundColor: codecFormat === 'Apple VideoToolbox' ? 'var(--surface-high)' : 'transparent', 
                  color: codecFormat === 'Apple VideoToolbox' ? '#fff' : 'var(--on-surface-variant)',
                  opacity: isMac ? 1 : 0.4
                }}
                title={isMac ? "" : "Mac Only"}
              >VideoToolbox (Mac) {!isMac && <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: 'middle', marginLeft: 4 }}>lock</span>}</div>
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--on-surface)', marginBottom: '12px' }}>Default Output Folder</label>
            <div style={{ display: 'flex', backgroundColor: '#fff', borderRadius: 'var(--radius)', padding: '4px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: '8px', color: '#666', fontSize: '13px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>folder</span>
                {outputDir || '/Volumes/EditDrive/ShortGen_Renders'}
              </div>
              <Button onClick={handleSelectDir} style={{ backgroundColor: '#27272a', color: '#fff', height: '32px', borderRadius: '4px' }}>Browse</Button>
            </div>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--outline)' }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--outline)', borderRadius: 'var(--radius)' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#fff', marginBottom: '4px' }}>Auto-process after upload</div>
            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Automatically generate trims and apply color profiles immediately after source footage is uploaded to the pool.</div>
          </div>
          <div 
            onClick={() => setAutoProcess(!autoProcess)}
            style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: autoProcess ? '#c4b5fd' : 'var(--surface-highest)', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}
          >
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '2px', left: autoProcess ? '22px' : '2px', transition: 'left 0.2s' }}></div>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--outline)' }}></div>

        {/* Legacy Settings Kept per User Request */}
        <div style={{ marginTop: '8px' }}>
          <div className="form-group flex items-center space-x-2" style={{ marginBottom: 16 }}>
            <Checkbox id="shouldRemoveSilence" checked={shouldRemoveSilence} onCheckedChange={setShouldRemoveSilence} />
            <Label htmlFor="shouldRemoveSilence" style={{ margin: 0, cursor: 'pointer', color: '#fff' }}>Remove Dead Silence</Label>
          </div>

          {shouldRemoveSilence && (
            <div className="form-group" style={{ marginBottom: silencePreset === 'custom' ? 16 : 0 }}>
              <Label style={{ marginBottom: 8, display: 'block', color: 'var(--on-surface-variant)' }}>Silence Removal Profile</Label>
              <Select value={silencePreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-full bg-[#121212] border-[#27272a] focus:ring-[#a78bfa]">
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
          )}
          {shouldRemoveSilence && silencePreset === 'custom' && (
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Threshold (e.g. -35dB)</label>
                <input type="text" className="input-text" value={silenceThreshold} onChange={e => setSilenceThreshold(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Duration (seconds)</label>
                <input type="number" step="0.1" className="input-text" value={silenceDuration} onChange={e => setSilenceDuration(e.target.value)} />
              </div>
            </div>
          )}
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
        <Button variant="outline" style={{ backgroundColor: 'transparent', borderColor: 'var(--outline)', color: '#fff' }}>Reset Defaults</Button>
        <Button style={{ backgroundColor: '#c4b5fd', color: '#121212', fontWeight: 600 }}>Save Changes</Button>
      </div>
    </div>
  )
}
