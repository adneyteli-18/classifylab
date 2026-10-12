import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Check,
  CircleAlert,
  FlaskConical,
  Play,
  RotateCcw,
  Upload,
} from 'lucide-react'
import { useLab } from '../context/useLab.js'
import {
  evaluateKnnSplit,
  fitStandardizer,
  getFeatureNames,
  irisDataset,
  parseDatasetCsv,
  predictKnn,
  teachingDataset,
  transformRows,
} from '../simulation/knn.js'

const CLASS_COLORS = ['#5278e8', '#ed9d52', '#46a68b', '#9b72d0', '#e16c84']
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

function readValue(row, feature) {
  return row.values?.[feature] ?? row.features?.[feature] ?? row[feature]
}

function KnnSimulation({ onPrepareData, onViewEvaluation, onViewMonitoring }) {
  const {
    dataset,
    setDataset,
    selectedFeatures,
    setSelectedFeatures,
    k,
    setK,
    split,
    setSplit,
    standardize,
    demonstrateLeakage,
    testRatio,
    runs,
    setRuns,
    setLatestEvaluation,
  } = useLab()
  const [queryValues, setQueryValues] = useState({})
  const [metric, setMetric] = useState('euclidean')
  const [result, setResult] = useState(null)
  const [isCurrentResultSaved, setIsCurrentResultSaved] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isReadingFile, setIsReadingFile] = useState(false)

  const allFeatures = getFeatureNames(dataset)
  const features =
    selectedFeatures.length > 0 &&
    selectedFeatures.every((feature) => allFeatures.includes(feature))
      ? selectedFeatures
      : allFeatures
  const validSplit =
    split &&
    split.datasetName === dataset?.name &&
    split.datasetRows === dataset?.rows.length &&
    split.featureNames.join('|') === features.join('|')
      ? split
      : null
  const plotFeatures = features.slice(0, 2)
  const chartRows = useMemo(
    () =>
      (dataset?.rows ?? [])
        .map((row, index) => ({
          x: readValue(row, plotFeatures[0]),
          y: plotFeatures[1] ? readValue(row, plotFeatures[1]) : 0,
          label: row.label,
          rowNumber: index + 1,
        }))
        .filter((row) => Number.isFinite(row.x) && Number.isFinite(row.y)),
    [dataset, plotFeatures],
  )
  const classes = useMemo(
    () => [...new Set(chartRows.map((row) => row.label).filter(Boolean))],
    [chartRows],
  )
  const colorsByClass = Object.fromEntries(
    classes.map((label, index) => [label, CLASS_COLORS[index % CLASS_COLORS.length]]),
  )

  function loadDataset(nextDataset, message) {
    setDataset(nextDataset)
    setSelectedFeatures(nextDataset.featureNames.slice(0, 2))
    setK(Math.min(3, nextDataset.rows.length))
    setSplit(null)
    setQueryValues({})
    setResult(null)
    setLatestEvaluation(null)
    setError('')
    setNotice(message)
  }

  function handleDatasetChoice(event) {
    if (event.target.value === 'teaching') {
      loadDataset(teachingDataset, 'Loaded the two-class teaching dataset.')
    } else if (event.target.value === 'iris') {
      loadDataset(irisDataset, 'Loaded the local Iris dataset.')
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setNotice('')
    setResult(null)

    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Choose a CSV file smaller than 2 MB.')
      return
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Choose a .csv file.')
      return
    }

    setIsReadingFile(true)
    try {
      const uploadedDataset = parseDatasetCsv(await file.text(), file.name)
      loadDataset(
        uploadedDataset,
        `Loaded ${uploadedDataset.rows.length} rows from ${file.name}. Prepare a new split before classifying.`,
      )
    } catch (fileError) {
      setError(fileError.message)
    } finally {
      setIsReadingFile(false)
    }
  }

  function updateK(value) {
    const nextK = Number(value)
    setK(Number.isInteger(nextK) && nextK > 0 ? nextK : null)
    setResult(null)
    setIsCurrentResultSaved(false)
    setLatestEvaluation(null)
    setError('')
  }

  function runSimulation(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setResult(null)
    setIsCurrentResultSaved(false)
    try {
      if (!dataset) throw new Error('Choose a dataset in Data Preparation first.')
      if (!validSplit) {
        throw new Error('Create a train/test split in Data Preparation before running KNN.')
      }
      if (features.length === 0) throw new Error('Select at least one numeric feature.')

      const point = {}
      for (const feature of features) {
        const rawValue = queryValues[feature]
        if (rawValue === undefined || rawValue.trim() === '') {
          throw new Error(`Enter a query value for "${feature}".`)
        }
        point[feature] = Number(rawValue)
        if (!Number.isFinite(point[feature])) {
          throw new Error(`Enter a valid number for "${feature}".`)
        }
      }

      const trainingRows = validSplit.trainingIndexes.map((index) => ({
        ...dataset.rows[index],
        rowNumber: index + 1,
      }))
      const scaler = standardize
        ? fitStandardizer(trainingRows, features)
        : Object.fromEntries(features.map((feature) => [feature, null]))
      const modelTrainingRows = standardize
        ? transformRows(trainingRows, features, scaler)
        : trainingRows
      const modelPoint = { ...point }
      if (standardize) {
        for (const feature of features) {
          modelPoint[feature] =
            (point[feature] - scaler[feature].mean) / scaler[feature].scale
        }
      }

      const prediction = predictKnn({
        trainingRows: modelTrainingRows,
        point: modelPoint,
        features,
        k: Number(k),
        metric,
      })
      const evaluation = evaluateKnnSplit({
        dataset,
        split: validSplit,
        features,
        k: Number(k),
        metric,
        standardize,
        demonstrateLeakage,
      })
      const evaluationRecord = {
        metrics: evaluation.metrics,
        leakageComparison: evaluation.leakageComparison?.metrics ?? null,
        settings: {
          k: Number(k),
          metric,
          standardize,
          testRatio: validSplit.requestedTestRatio ?? testRatio,
          features,
          seed: validSplit.seed,
        },
        datasetName: dataset.name,
        createdAt: new Date().toISOString(),
        predictions: evaluation.predictions,
        actual: evaluation.actual,
      }

      setLatestEvaluation(evaluationRecord)
      setResult({ ...prediction, rawPoint: point, evaluation: evaluationRecord })
    } catch (simulationError) {
      setError(simulationError.message)
    }
  }

  function saveExperiment() {
    if (!result || !dataset || isCurrentResultSaved) return
    const run = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${runs.length}`,
      name: `KNN · k=${result.k}`,
      datasetName: dataset.name,
      createdAt: result.evaluation.createdAt,
      parameters: {
        k: result.k,
        metric: result.metric,
        point: result.rawPoint,
        features,
        standardize,
        split: validSplit,
      },
      prediction: result.predictedLabel,
      neighbors: result.neighbors,
      votes: result.votes,
      evaluation: result.evaluation,
    }
    setRuns([...runs, run])
    setIsCurrentResultSaved(true)
    setNotice('Prediction and holdout metrics saved on this device.')
  }

  function resetSimulation() {
    setResult(null)
    setIsCurrentResultSaved(false)
    setError('')
    setNotice('')
  }

  const isReadyToRun =
    dataset &&
    validSplit &&
    Number.isInteger(k) &&
    k > 0 &&
    k <= validSplit.trainingIndexes.length &&
    features.length > 0 &&
    features.every(
      (feature) =>
        queryValues[feature] !== undefined &&
        queryValues[feature].trim() !== '' &&
        Number.isFinite(Number(queryValues[feature])),
    )

  return (
    <div className="simulation-layout">
      <div className="simulation-main-column">
        <section className="vlab-card data-card">
          <div className="vlab-card-heading">
            <div>
              <p className="vlab-eyebrow">MODEL INPUT</p>
              <h2>Training dataset</h2>
            </div>
            {dataset && (
              <span className="data-ready-badge">
                <Check aria-hidden="true" size={13} /> {dataset.rows.length} rows
              </span>
            )}
          </div>
          <p className="vlab-muted-copy">
            Select built-in data or upload a labeled CSV. Configure selected
            features and the holdout split in Data Preparation.
          </p>
          <div className="dataset-actions">
            <select
              aria-label="Choose built-in dataset"
              className="vlab-input dataset-choice"
              onChange={handleDatasetChoice}
              value={
                dataset?.name === irisDataset.name
                  ? 'iris'
                  : dataset?.name === teachingDataset.name
                    ? 'teaching'
                    : ''
              }
            >
              <option value="">Choose built-in data…</option>
              <option value="teaching">Two-class teaching set</option>
              <option value="iris">Iris dataset (150 rows)</option>
            </select>
            <label className={`vlab-button vlab-button-secondary upload-button${isReadingFile ? ' is-busy' : ''}`}>
              <Upload aria-hidden="true" size={15} />
              {isReadingFile ? 'Reading CSV…' : 'Upload CSV'}
              <input
                accept=".csv,text/csv"
                aria-label="Upload CSV dataset"
                disabled={isReadingFile}
                onChange={handleFileChange}
                type="file"
              />
            </label>
            <button
              className="vlab-button vlab-button-secondary"
              onClick={onPrepareData}
              type="button"
            >
              Configure preparation
            </button>
          </div>
          {dataset && (
            <div className="active-dataset">
              <span className="dataset-indicator" />
              <span><strong>{dataset.name}</strong> · {dataset.rows.length} rows · {features.length} selected features</span>
              <span className="dataset-source">{dataset.source}</span>
            </div>
          )}
          {validSplit && (
            <p className="field-help">
              {validSplit.trainingIndexes.length} training rows · {validSplit.testingIndexes.length} held-out test rows · {standardize ? 'train-only standardization' : 'raw feature scale'}
            </p>
          )}
          <div className="simulation-support-links">
            <button className="text-link" onClick={onViewEvaluation} type="button">
              View evaluation
            </button>
            <button className="text-link" onClick={onViewMonitoring} type="button">
              Data drift demonstration
            </button>
          </div>
        </section>

        <section className="vlab-card plot-card">
          <div className="vlab-card-heading">
            <div>
              <p className="vlab-eyebrow">ACTUAL FEATURE VALUES</p>
              <h2>Feature space</h2>
            </div>
            <span className="plot-hint">
              {plotFeatures.join(' vs ') || 'Select numeric features'}
            </span>
          </div>
          {chartRows.length > 0 && plotFeatures.length > 0 ? (
            <>
              <div aria-label="Scatter plot of actual dataset rows" className="scatter-chart">
                <ResponsiveContainer height="100%" width="100%">
                  <ScatterChart margin={{ top: 14, right: 18, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke="#edf0f5" strokeDasharray="4 4" />
                    <XAxis
                      dataKey="x"
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                      name={plotFeatures[0]}
                      tick={{ fill: '#8590a2', fontSize: 10 }}
                      type="number"
                    />
                    <YAxis
                      dataKey="y"
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                      name={plotFeatures[1] ?? 'value'}
                      tick={{ fill: '#8590a2', fontSize: 10 }}
                      type="number"
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => [Number(value).toFixed(3), name]}
                      labelFormatter={() => 'Dataset row'}
                    />
                    <Legend iconType="circle" />
                    {classes.map((label) => (
                      <Scatter
                        data={chartRows.filter((row) => row.label === label)}
                        fill={colorsByClass[label]}
                        key={label}
                        name={label}
                      />
                    ))}
                    {result && (
                      <ReferenceDot
                        fill="#202b44"
                        label={{ value: 'Query', fill: '#202b44', fontSize: 10, position: 'top' }}
                        r={7}
                        stroke="#fff"
                        strokeWidth={2}
                        x={result.rawPoint[plotFeatures[0]]}
                        y={plotFeatures[1] ? result.rawPoint[plotFeatures[1]] : 0}
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              {plotFeatures.length === 1 && (
                <p className="field-help">
                  One feature is selected; the chart places values on the x-axis and uses zero on y.
                </p>
              )}
              <div className="class-legend">
                {classes.map((label) => (
                  <span key={label}><i style={{ backgroundColor: colorsByClass[label] }} />{label}</span>
                ))}
                {result && <span><i className="query-legend-dot" />Query point</span>}
              </div>
            </>
          ) : (
            <div className="plot-empty">
              <FlaskConical aria-hidden="true" size={23} />
              <strong>Load a dataset to view the feature space</strong>
              <span>The plot uses actual feature values grouped by class.</span>
            </div>
          )}
        </section>
      </div>

      <div className="simulation-side-column">
        <section className="vlab-card control-card">
          <div className="vlab-card-heading">
            <div>
              <p className="vlab-eyebrow">CLASSIFICATION SETTINGS</p>
              <h2>KNN query point</h2>
            </div>
          </div>
          <form onSubmit={runSimulation}>
            <label className="field-label" htmlFor="neighbor-count">Neighbors (k)</label>
            <input
              className="vlab-input"
              id="neighbor-count"
              max={validSplit?.trainingIndexes.length ?? undefined}
              min="1"
              onChange={(event) => updateK(event.target.value)}
              type="number"
              value={k ?? ''}
            />
            <p className="field-help">
              {validSplit
                ? `Choose an integer from 1 to ${validSplit.trainingIndexes.length} training rows.`
                : 'Prepare a train/test split before choosing k.'}
            </p>

            <label className="field-label" htmlFor="distance-metric">Distance metric</label>
            <select
              className="vlab-input"
              id="distance-metric"
              onChange={(event) => {
                setMetric(event.target.value)
                setResult(null)
                setIsCurrentResultSaved(false)
                setLatestEvaluation(null)
              }}
              value={metric}
            >
              <option value="euclidean">Euclidean distance</option>
              <option value="manhattan">Manhattan distance</option>
              <option value="chebyshev">Chebyshev distance</option>
            </select>

            <div className="form-section-label">QUERY POINT · {features.length} FEATURES</div>
            <div className="query-feature-fields">
              {features.map((feature) => (
                <label key={feature}>
                  <span className="field-label">{feature}</span>
                  <input
                    className="vlab-input"
                    onChange={(event) => {
                      setQueryValues({ ...queryValues, [feature]: event.target.value })
                      setResult(null)
                      setIsCurrentResultSaved(false)
                      setLatestEvaluation(null)
                    }}
                    placeholder={`Enter ${feature}`}
                    step="any"
                    type="number"
                    value={queryValues[feature] ?? ''}
                  />
                </label>
              ))}
            </div>
            <button
              className="vlab-button vlab-button-primary run-button"
              disabled={!isReadyToRun}
              type="submit"
            >
              <Play aria-hidden="true" size={15} /> Classify & evaluate
            </button>
            {result && (
              <button className="vlab-button vlab-button-secondary reset-button" onClick={resetSimulation} type="button">
                <RotateCcw aria-hidden="true" size={14} /> Clear result
              </button>
            )}
          </form>
          {error && (
            <p className="vlab-message vlab-message-error" role="alert">
              <CircleAlert aria-hidden="true" size={16} /> {error}
            </p>
          )}
          {notice && (
            <p className="vlab-message vlab-message-success" role="status">
              <Check aria-hidden="true" size={15} /> {notice}
            </p>
          )}
          {!validSplit && dataset && (
            <button className="text-link" onClick={onPrepareData} type="button">
              Open Data Preparation <RotateCcw aria-hidden="true" size={13} />
            </button>
          )}
        </section>

        <section aria-live="polite" className={`vlab-card result-card${result ? ' has-result' : ''}`}>
          <p className="vlab-eyebrow">PREDICTION · CALCULATED</p>
          {result ? (
            <>
              <div className="prediction-label">Predicted class for query point</div>
              <div className="prediction-value">
                <span style={{ backgroundColor: colorsByClass[result.predictedLabel] }} />
                {result.predictedLabel}
              </div>
              <p className="result-summary">
                {result.k} nearest neighbors voted using {result.metric} distance.
                Holdout accuracy: {(result.evaluation.metrics.accuracy * 100).toFixed(1)}%.
              </p>
              <div className="vote-list">
                {result.votes.map((vote) => (
                  <div className="vote-row" key={vote.label}>
                    <span><i style={{ backgroundColor: colorsByClass[vote.label] }} />{vote.label}</span>
                    <strong>{vote.count} {vote.count === 1 ? 'vote' : 'votes'}</strong>
                  </div>
                ))}
              </div>
              <button
                className="vlab-button vlab-button-secondary save-run-button"
                disabled={isCurrentResultSaved}
                onClick={saveExperiment}
                type="button"
              >
                <Check aria-hidden="true" size={15} />
                {isCurrentResultSaved ? 'Experiment saved' : 'Save settings & metrics'}
              </button>
              <p className="result-disclaimer">
                Query prediction uses training rows only. Metrics use actual held-out test labels.
              </p>
            </>
          ) : (
            <div className="result-placeholder">
              <div className="result-placeholder-icon"><FlaskConical aria-hidden="true" size={19} /></div>
              <strong>No classification yet</strong>
              <span>
                Prepare the split, enter a query for every selected feature, and run the classifier.
              </span>
            </div>
          )}
        </section>
      </div>

      {result && (
        <section className="vlab-card neighbors-card">
          <div className="vlab-card-heading">
            <div>
              <p className="vlab-eyebrow">TRANSPARENT CALCULATION</p>
              <h2>Nearest training neighbors</h2>
            </div>
            <span className="neighbor-count-badge">Showing k = {result.k}</span>
          </div>
          <div className="table-scroll">
            <table className="neighbors-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Data row</th>
                  {features.map((feature) => <th key={feature}>{feature}</th>)}
                  <th>Distance</th>
                  <th>Class vote</th>
                </tr>
              </thead>
              <tbody>
                {result.neighbors.map((neighbor, index) => {
                  const rawRow = dataset.rows[neighbor.rowNumber - 1]
                  return (
                    <tr key={`${neighbor.rowNumber}-${index}`}>
                      <td>{index + 1}</td>
                      <td>Row {neighbor.rowNumber}</td>
                      {features.map((feature) => (
                        <td key={feature}>{Number(readValue(rawRow, feature)).toFixed(4)}</td>
                      ))}
                      <td>{neighbor.distance.toFixed(4)}</td>
                      <td>
                        <span className="table-class-label">
                          <i style={{ backgroundColor: colorsByClass[neighbor.label] }} />
                          {neighbor.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="tie-note">
            Distance ties follow original data row order. Class vote ties are
            resolved by the smallest total neighbor distance, then alphabetically.
          </p>
        </section>
      )}
    </div>
  )
}

export default KnnSimulation
