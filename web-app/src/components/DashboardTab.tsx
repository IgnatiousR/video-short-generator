/* eslint-disable @typescript-eslint/no-explicit-any */
import PropTypes from 'prop-types'
import { FolderOpen, Filter, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export default function DashboardTab({ batchStats, timePassed, clips, isProcessing, outputDir }: any) {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        Batch Processing
      </h2>
      <p className="text-muted-foreground text-sm mb-8">
        Monitor and manage your active rendering jobs.
      </p>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider mb-2">TOTAL SHORTS</div>
          <div className="text-4xl font-bold text-foreground">{batchStats.total.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider mb-2">COMPLETED</div>
          <div className="text-4xl font-bold text-primary">{batchStats.completed.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider mb-2">TIME PASSED</div>
          <div className="text-4xl font-bold text-foreground">{timePassed}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Exports</h3>
        <Filter className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground tracking-wider">
          <div className="col-span-5">OUTPUT FILENAME</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-4">PROGRESS</div>
          <div className="col-span-1 text-right">ACTIONS</div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50">
          {clips.map((clip: any) => (
            <div key={clip.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="col-span-5 text-sm font-medium truncate pr-4 text-foreground" title={clip.filename}>
                {clip.filename}
              </div>
              <div className="col-span-2 flex items-center gap-2 text-sm">
                {clip.status === 'Processing' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                {clip.status === 'Done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {clip.status === 'Queued' && <Clock className="w-4 h-4 text-muted-foreground" />}
                <span className={`
                  ${clip.status === 'Processing' ? 'text-blue-500 font-medium' : ''}
                  ${clip.status === 'Done' ? 'text-green-500 font-medium' : ''}
                  ${clip.status === 'Queued' ? 'text-muted-foreground' : ''}
                `}>
                  {clip.status}
                </span>
              </div>
              <div className="col-span-4 flex items-center gap-4">
                <Progress 
                  value={clip.progress} 
                  className={`h-2 ${clip.status === 'Processing' ? '[&>div]:bg-blue-500' : ''} ${clip.status === 'Done' ? '[&>div]:bg-green-500' : ''}`}
                />
                <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                  {clip.progress}%
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  disabled={clip.status !== 'Done'}
                  className="p-2 rounded-md hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={clip.status === 'Done' ? 'Open folder' : 'Wait for processing'}
                  onClick={() => {
                    if (clip.status === 'Done') {
                      const win = window as any;
                      win.api?.showItemInFolder(outputDir + '\\' + clip.filename)
                    }
                  }}
                >
                  <FolderOpen className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </button>
              </div>
            </div>
          ))}

          {clips.length === 0 && !isProcessing && (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Clock className="w-8 h-8 opacity-20 mb-2" />
              <p>No batch currently processing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

DashboardTab.propTypes = {
  batchStats: PropTypes.shape({
    total: PropTypes.number,
    completed: PropTypes.number,
    startTime: PropTypes.number
  }),
  timePassed: PropTypes.string,
  clips: PropTypes.array,
  isProcessing: PropTypes.bool,
  outputDir: PropTypes.string
}
