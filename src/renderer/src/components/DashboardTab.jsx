import PropTypes from 'prop-types'

export default function DashboardTab({ batchStats, timePassed, clips, isProcessing, outputDir }) {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
        Batch Processing
      </h2>
      <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginBottom: '32px' }}>
        Monitor and manage your active rendering jobs.
      </p>

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
          <div className="card-label">TIME PASSED</div>
          <div className="card-value">{timePassed}</div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Recent Exports</h3>
        <span
          className="material-symbols-outlined"
          style={{ color: 'var(--on-surface-variant)', cursor: 'pointer' }}
        >
          filter_list
        </span>
      </div>

      <div className="clip-table">
        <div className="clip-header">
          <div>OUTPUT FILENAME</div>
          <div>STATUS</div>
          <div>PROGRESS</div>
          <div style={{ textAlign: 'right' }}>ACTIONS</div>
        </div>
        {clips.map((clip) => (
          <div key={clip.id} className="clip-row">
            <div className="filename-cell" title={clip.filename}>
              {clip.filename}
            </div>
            <div className={`status-cell status-${clip.status}`}>
              <span
                className={`material-symbols-outlined ${clip.status === 'Processing' ? 'spin' : ''}`}
                style={{ fontSize: 18 }}
              >
                {clip.status === 'Processing'
                  ? 'sync'
                  : clip.status === 'Done'
                    ? 'check_circle'
                    : 'schedule'}
              </span>
              {clip.status}
            </div>
            <div className={`progress-cell status-${clip.status}`}>
              <div className="mini-progress-bar-container">
                <div className="mini-progress-bar" style={{ width: `${clip.progress}%` }}></div>
              </div>
              <div
                style={{
                  width: 40,
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12
                }}
              >
                {clip.progress}%
              </div>
            </div>
            <div className="actions-cell">
              <span
                className={`material-symbols-outlined action-icon ${clip.status !== 'Done' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={clip.status === 'Done' ? 'Open folder' : 'Wait for processing'}
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
