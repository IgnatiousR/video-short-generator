/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Lock, FolderOpen, Smartphone, Square, Maximize } from 'lucide-react'

export default function SettingsTab({
  exportQuality,
  setExportQuality,
  aspectRatio,
  setAspectRatio,
  codecFormat,
  setCodecFormat,
  outputDir,
  handleSelectDir,
  autoProcess,
  setAutoProcess,
  shouldRemoveSilence,
  setShouldRemoveSilence,
  silencePreset,
  handlePresetChange,
  silenceThreshold,
  setSilenceThreshold,
  silenceDuration,
  setSilenceDuration
}: any) {
  const [isMac, setIsMac] = useState(false)
  const [hasNvidia, setHasNvidia] = useState(false)

  useEffect(() => {
    const detectHardware = async () => {
      setIsMac(navigator.userAgent.toLowerCase().includes('mac'))
      try {
        const canvas = document.createElement('canvas')
        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            if (renderer && renderer.toLowerCase().includes('nvidia')) {
              setHasNvidia(true)
            }
          }
        }
      } catch (e) {
        console.error('Failed to detect GPU', e)
      }
    }
    detectHardware()
  }, [])

  return (
    <div className="max-w-[800px] h-full animate-in fade-in duration-500 overflow-y-auto pr-4 pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50">
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        Export Configuration
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        Manage default rendering, codec, and output preferences for batch processing.
      </p>

      <div className="bg-card border border-border rounded-xl p-8 flex flex-col gap-8 shadow-sm">
        
        {/* Quality & Aspect Ratio */}
        <div className="flex gap-8">
          <div className="flex-1 space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Export Quality
            </label>
            <div className="flex border border-border rounded-lg overflow-hidden bg-muted/20">
              <button
                onClick={() => setExportQuality('1080p')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${exportQuality === '1080p' ? 'bg-primary/10 text-primary shadow-sm border-r border-border/50' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                1080p
              </button>
              <button
                onClick={() => setExportQuality('4K UHD')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${exportQuality === '4K UHD' ? 'bg-primary/10 text-primary shadow-sm border-l border-border/50' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                4K UHD
              </button>
            </div>
            {exportQuality === '4K UHD' && (
              <p className="text-xs text-muted-foreground/80 mt-2">
                4K rendering increases processing time by ~2.5x.
              </p>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Aspect Ratio
            </label>
            <div className="flex border border-border rounded-lg overflow-hidden bg-muted/20">
              <button
                onClick={() => setAspectRatio('Original')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-r border-border/20 ${aspectRatio === 'Original' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                <Maximize className="w-4 h-4" />
                Original
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-r border-border/20 ${aspectRatio === '9:16' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                <Smartphone className="w-4 h-4" />
                9:16
              </button>
              <button
                onClick={() => setAspectRatio('1:1')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${aspectRatio === '1:1' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                <Square className="w-4 h-4" />
                1:1
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-border w-full"></div>

        {/* Hardware & Output */}
        <div className="flex gap-8">
          <div className="flex-1 space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Hardware Encoder
            </label>
            <div className="flex border border-border rounded-lg overflow-hidden bg-muted/20">
              <button
                onClick={() => setCodecFormat('Software x264')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-r border-border/20 ${codecFormat === 'Software x264' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                Software (x264)
              </button>
              <button
                onClick={() => hasNvidia && setCodecFormat('NVIDIA NVENC')}
                disabled={!hasNvidia}
                title={hasNvidia ? '' : 'Requires NVIDIA GPU'}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-r border-border/20 disabled:opacity-40 disabled:cursor-not-allowed ${codecFormat === 'NVIDIA NVENC' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                NVENC
                {!hasNvidia && <Lock className="w-3 h-3" />}
              </button>
              <button
                onClick={() => isMac && setCodecFormat('Apple VideoToolbox')}
                disabled={!isMac}
                title={isMac ? '' : 'Mac Only'}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${codecFormat === 'Apple VideoToolbox' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                VideoToolbox
                {!isMac && <Lock className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Default Output Folder
            </label>
            <div className="flex items-center bg-background border border-border rounded-lg p-1 pr-1.5 focus-within:ring-1 focus-within:ring-ring transition-shadow">
              <div className="flex-1 flex items-center pl-3 gap-2 text-sm text-muted-foreground overflow-hidden">
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{outputDir?.name || outputDir || 'Select directory...'}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectDir}
                className="h-8"
              >
                Browse
              </Button>
            </div>
          </div>
        </div>

        <div className="h-px bg-border w-full"></div>

        {/* Auto Process Toggle */}
        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/10">
          <div>
            <div className="text-sm font-medium text-foreground mb-1">
              Auto-process after upload
            </div>
            <div className="text-xs text-muted-foreground">
              Automatically generate trims and apply color profiles immediately after source footage is uploaded.
            </div>
          </div>
          <button
            onClick={() => setAutoProcess(!autoProcess)}
            className={`relative w-11 h-6 rounded-full transition-colors ${autoProcess ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-all ${autoProcess ? 'left-[22px]' : 'left-1'}`}
            />
          </button>
        </div>

        <div className="h-px bg-border w-full"></div>

        {/* Legacy Settings */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="shouldRemoveSilence"
              checked={shouldRemoveSilence}
              onCheckedChange={setShouldRemoveSilence}
            />
            <Label
              htmlFor="shouldRemoveSilence"
              className="text-sm font-medium cursor-pointer"
            >
              Remove Dead Silence <span className="text-muted-foreground font-normal ml-1">(Advanced feature - coming to Wasm soon)</span>
            </Label>
          </div>

          {shouldRemoveSilence && (
            <div className="space-y-3 p-4 bg-muted/20 border border-border rounded-lg">
              <Label className="text-sm font-medium text-foreground block">
                Silence Removal Profile
              </Label>
              <Select value={silencePreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (Recommended) - -35dB / 0.6s</SelectItem>
                  <SelectItem value="conservative">Conservative - -40dB / 0.8s</SelectItem>
                  <SelectItem value="aggressive">Aggressive - -30dB / 0.4s</SelectItem>
                  <SelectItem value="custom">Custom (Advanced)</SelectItem>
                </SelectContent>
              </Select>
              
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                {silencePreset === 'standard' && 'Ideal for most podcasts. Removes standard pauses without making speech sound unnatural.'}
                {silencePreset === 'conservative' && 'Safest option. Only removes very obvious, long gaps. Preserves natural breathing.'}
                {silencePreset === 'aggressive' && 'Snappy pacing. Removes almost all dead air between words. Can sound choppy.'}
                {silencePreset === 'custom' && 'Manually tune FFmpeg silence detection filters.'}
              </p>

              {silencePreset === 'custom' && (
                <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Threshold (e.g. -35dB)</label>
                    <input
                      type="text"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={silenceThreshold}
                      onChange={(e) => setSilenceThreshold(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Duration (seconds)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={silenceDuration}
                      onChange={(e) => setSilenceDuration(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" className="bg-transparent">
          Reset Defaults
        </Button>
        <Button>
          Save Changes
        </Button>
      </div>
    </div>
  )
}

SettingsTab.propTypes = {
  exportQuality: PropTypes.string,
  setExportQuality: PropTypes.func,
  aspectRatio: PropTypes.string,
  setAspectRatio: PropTypes.func,
  codecFormat: PropTypes.string,
  setCodecFormat: PropTypes.func,
  outputDir: PropTypes.string,
  handleSelectDir: PropTypes.func,
  autoProcess: PropTypes.bool,
  setAutoProcess: PropTypes.func,
  shouldRemoveSilence: PropTypes.bool,
  setShouldRemoveSilence: PropTypes.func,
  silencePreset: PropTypes.string,
  handlePresetChange: PropTypes.func,
  silenceThreshold: PropTypes.string,
  setSilenceThreshold: PropTypes.func,
  silenceDuration: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSilenceDuration: PropTypes.func
}
