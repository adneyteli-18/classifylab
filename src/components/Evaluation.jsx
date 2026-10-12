import { Activity, BadgeCheck, ChartNoAxesCombined, TriangleAlert } from 'lucide-react'

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="evaluation-metric">
      <span>{label}</span>
      <strong>{formatPercent(value)}</strong>
      <small>{detail}</small>
    </article>
  )
}

function Evaluation({ evaluation }) {
  if (!evaluation) {
    return (
      <section className="vlab-card evaluation-empty">
        <span><ChartNoAxesCombined aria-hidden="true" size={22} /></span>
        <strong>No evaluation available yet</strong>
        <p>Prepare a train/test split, run the classifier, and this page will show metrics calculated from its test predictions.</p>
      </section>
    )
  }

  const { metrics, leakageComparison, settings, datasetName, createdAt } = evaluation
  return (
    <div className="evaluation-layout">
      <section className="evaluation-metrics-grid">
        <MetricCard detail="Correct test predictions / all test rows" label="Accuracy" value={metrics.accuracy} />
        <MetricCard detail="Macro average across classes" label="Precision" value={metrics.precision} />
        <MetricCard detail="Macro average across classes" label="Recall" value={metrics.recall} />
        <MetricCard detail="Macro average across classes" label="F1-score" value={metrics.f1} />
      </section>

      <section className="vlab-card confusion-card">
        <div className="vlab-card-heading">
          <div>
            <p className="vlab-eyebrow">TEST SET · {metrics.sampleCount} ROWS</p>
            <h2>Confusion matrix</h2>
          </div>
          <span className="confusion-axis-note">Rows: actual · Columns: predicted</span>
        </div>
        <div className="table-scroll">
          <table className="confusion-table">
            <thead>
              <tr>
                <th>Actual ↓ / Predicted →</th>
                {metrics.classLabels.map((label) => <th key={label}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {metrics.classLabels.map((actualLabel) => (
                <tr key={actualLabel}>
                  <th>{actualLabel}</th>
                  {metrics.classLabels.map((predictedLabel) => (
                    <td
                      className={actualLabel === predictedLabel ? 'matrix-diagonal' : ''}
                      key={predictedLabel}
                    >
                      {metrics.confusionMatrix[actualLabel][predictedLabel]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="per-class-results">
          {metrics.perClass.map((row) => (
            <div className="per-class-row" key={row.label}>
              <strong>{row.label}</strong>
              <span>Precision {formatPercent(row.precision)}</span>
              <span>Recall {formatPercent(row.recall)}</span>
              <span>F1 {formatPercent(row.f1)}</span>
              <span>Support {row.support}</span>
            </div>
          ))}
        </div>
      </section>

      {leakageComparison && (
        <section className="vlab-card leakage-results-card">
          <div className="vlab-card-heading">
            <div>
              <p className="vlab-eyebrow">PREPROCESSING COMPARISON</p>
              <h2>Why test-set leakage matters</h2>
            </div>
            <TriangleAlert aria-hidden="true" className="leakage-warning-icon" size={19} />
          </div>
          <p className="leakage-results-copy">
            Both scores are calculated on the same held-out test rows. The correct pipeline fits the scaler on training data only; the comparison scaler incorrectly includes test-feature values. The leaked score is educational only and is not a valid estimate of generalisation.
          </p>
          <div className="leakage-score-grid">
            <div className="leakage-score correct-score">
              <span><BadgeCheck aria-hidden="true" size={15} /> Correct · train-only scaler</span>
              <strong>{formatPercent(metrics.accuracy)} accuracy</strong>
              <small>Reported model evaluation</small>
            </div>
            <div className="leakage-score leaky-score">
              <span><Activity aria-hidden="true" size={15} /> Leaky · all rows fit scaler</span>
              <strong>{formatPercent(leakageComparison.accuracy)} accuracy</strong>
              <small>Demonstration only; not a valid test estimate</small>
            </div>
          </div>
        </section>
      )}

      <p className="evaluation-footnote">
        Calculated from {datasetName}; k = {settings.k}, {settings.metric}, {settings.standardize ? 'standardized features' : 'unscaled features'}; test ratio {Math.round(settings.testRatio * 100)}%; run {new Date(createdAt).toLocaleString()}.
      </p>
    </div>
  )
}

export default Evaluation
