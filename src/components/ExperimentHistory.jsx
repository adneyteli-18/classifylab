import { ArrowRight, Clock3, History, Trash2 } from 'lucide-react'

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatMetric(metric) {
  switch (metric) {
    case 'euclidean':
      return 'Euclidean'
    case 'manhattan':
      return 'Manhattan'
    case 'chebyshev':
      return 'Chebyshev'
    default:
      return 'Metric unavailable'
  }
}

function formatQueryPoint(point) {
  const values = Object.entries(point ?? {}).filter(([, value]) =>
    Number.isFinite(value),
  )
  if (values.length === 0) return null
  return `Query ${values.map(([feature, value]) => `${feature} ${value}`).join(', ')}`
}

function ExperimentHistory({ runs, onDeleteRun, onClearHistory, onOpenSimulation }) {
  return (
    <section className="vlab-card history-card">
      <div className="history-heading">
        <div>
          <p className="vlab-eyebrow">SAVED ON THIS DEVICE</p>
          <h2>Experiment History</h2>
          <p className="history-description">
            Review predictions and settings from simulations you saved in this browser.
          </p>
        </div>
        {runs.length > 0 && (
          <button
            className="vlab-button history-clear-button"
            onClick={onClearHistory}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
            Clear history
          </button>
        )}
      </div>

      {runs.length === 0 ? (
        <div className="history-empty">
          <span><History aria-hidden="true" size={22} /></span>
          <strong>No saved experiments yet</strong>
          <p>Run a classification in Simulation and save it to build your history.</p>
          <button
            className="vlab-button vlab-button-primary"
            onClick={onOpenSimulation}
            type="button"
          >
            Open Simulation <ArrowRight aria-hidden="true" size={15} />
          </button>
        </div>
      ) : (
        <div className="history-list">
          {runs.slice().reverse().map((run, index) => (
            <article
              className="history-run"
              key={run.id ?? `${run.createdAt ?? 'saved'}-${index}`}
            >
              <div className="history-run-icon">
                <History aria-hidden="true" size={17} />
              </div>
              <div className="history-run-main">
                <div className="history-run-title-row">
                  <strong>{run.name ?? 'KNN experiment'}</strong>
                  <span className="history-prediction">{run.prediction ?? 'Prediction unavailable'}</span>
                </div>
                <div className="history-run-meta">
                  <span>{run.datasetName ?? 'Dataset unavailable'}</span>
                  <span>k = {run.parameters?.k ?? '—'}</span>
                  <span>{formatMetric(run.parameters?.metric)}</span>
                  {Number.isFinite(run.evaluation?.metrics?.accuracy) && (
                    <span>
                      Holdout accuracy {(run.evaluation.metrics.accuracy * 100).toFixed(1)}%
                    </span>
                  )}
                  {run.parameters?.standardize && <span>Standardized</span>}
                  {formatQueryPoint(run.parameters?.point) && (
                    <span>{formatQueryPoint(run.parameters.point)}</span>
                  )}
                </div>
                <span className="history-run-date">
                  <Clock3 aria-hidden="true" size={12} />
                  {formatDate(run.createdAt)}
                </span>
              </div>
              <button
                aria-label={`Delete ${run.name ?? 'saved experiment'}`}
                className="history-delete-button"
                onClick={() => onDeleteRun(run.id)}
                title="Delete experiment"
                type="button"
              >
                <Trash2 aria-hidden="true" size={15} />
              </button>
            </article>
          ))}
          <button
            className="vlab-button vlab-button-secondary history-simulation-link"
            onClick={onOpenSimulation}
            type="button"
          >
            Run another simulation <ArrowRight aria-hidden="true" size={15} />
          </button>
        </div>
      )}
    </section>
  )
}

export default ExperimentHistory
