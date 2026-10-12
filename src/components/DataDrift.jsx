import { useState } from 'react'
import { Activity, ArrowRightLeft, TriangleAlert } from 'lucide-react'
import { useLab } from '../context/useLab.js'
import { calculateDrift, getFeatureNames } from '../simulation/knn.js'

const DRIFT_THRESHOLD = 0.5

function DataDrift({ onPrepareData }) {
  const { dataset, split, selectedFeatures } = useLab()
  const [feature, setFeature] = useState('')
  const [hypotheticalShift, setHypotheticalShift] = useState('0')
  const features = dataset ? getFeatureNames(dataset) : []
  const activeFeatures = selectedFeatures.filter((item) => features.includes(item))
  const currentFeature = features.includes(feature) ? feature : activeFeatures[0] ?? features[0]

  const driftRows = (() => {
    if (!dataset || !split || !currentFeature) return []
    const referenceRows = split.trainingIndexes.map((index) => dataset.rows[index])
    const incomingRows = split.testingIndexes.map((index) => dataset.rows[index])
    const shift = Number(hypotheticalShift)
    const adjustedIncoming = incomingRows.map((row) => ({
      ...row,
      values: {
        ...row.values,
        [currentFeature]:
          (row.values?.[currentFeature] ?? row[currentFeature]) + shift,
      },
    }))
    return calculateDrift(referenceRows, adjustedIncoming, [currentFeature])
  })()

  if (!dataset || !split || split.datasetName !== dataset.name) {
    return (
      <section className="vlab-card drift-empty">
        <span><Activity aria-hidden="true" size={22} /></span>
        <strong>Prepare a reference and incoming split first</strong>
        <p>Data drift compares training features as the reference distribution with held-out test features as incoming data.</p>
        <button className="vlab-button vlab-button-primary" onClick={onPrepareData} type="button">
          Open Data Preparation <ArrowRightLeft aria-hidden="true" size={14} />
        </button>
      </section>
    )
  }

  const result = driftRows[0]
  const isDriftFlagged = result.standardizedMeanDifference >= DRIFT_THRESHOLD

  return (
    <div className="drift-layout">
      <section className="vlab-card drift-controls-card">
        <div className="vlab-card-heading">
          <div>
            <p className="vlab-eyebrow">REFERENCE VS INCOMING</p>
            <h2>Feature drift demonstration</h2>
          </div>
          <Activity aria-hidden="true" className="preparation-heading-icon" size={18} />
        </div>
        <p className="drift-description">
          Reference rows are the training split. Incoming rows are the held-out
          test split. This local lab has no live production stream.
        </p>
        <label className="preparation-field drift-field">
          <span className="field-label">Feature to inspect</span>
          <select
            className="vlab-input"
            onChange={(event) => setFeature(event.target.value)}
            value={currentFeature}
          >
            {features.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="preparation-field drift-field">
          <span className="field-label">Hypothetical incoming shift (feature units)</span>
          <input
            className="vlab-input"
            onChange={(event) => setHypotheticalShift(event.target.value)}
            step="any"
            type="number"
            value={hypotheticalShift}
          />
        </label>
        <p className="field-help">
          A non-zero shift is a synthetic what-if added to each incoming test value for this demonstration. It does not alter your saved dataset.
        </p>
      </section>

      <section className="vlab-card drift-result-card" aria-live="polite">
        <p className="vlab-eyebrow">STANDARDIZED MEAN DIFFERENCE</p>
        <div className={`drift-status${isDriftFlagged ? ' drift-detected' : ''}`}>
          {isDriftFlagged
            ? <TriangleAlert aria-hidden="true" size={18} />
            : <Activity aria-hidden="true" size={18} />}
          <strong>{isDriftFlagged ? 'Shift flagged by demo threshold' : 'No large shift flagged'}</strong>
        </div>
        <div className="drift-comparison">
          <div><span>Reference mean</span><strong>{result.referenceMean.toFixed(4)}</strong></div>
          <div><span>Incoming mean</span><strong>{result.incomingMean.toFixed(4)}</strong></div>
          <div><span>Reference std</span><strong>{result.referenceStd.toFixed(4)}</strong></div>
          <div><span>Standardized difference</span><strong>{Number.isFinite(result.standardizedMeanDifference) ? result.standardizedMeanDifference.toFixed(4) : '∞'}</strong></div>
        </div>
        <p className="drift-method-note">
          Difference = |incoming mean − reference mean| / reference standard deviation.
          The {DRIFT_THRESHOLD.toFixed(1)} threshold is a teaching heuristic, not a statistical test.
        </p>
      </section>
      <p className="drift-disclaimer">
        Drift here is a univariate feature-mean comparison using the training and test partitions; it is not a production monitoring system and does not test concept or label drift.
      </p>
    </div>
  )
}

export default DataDrift
