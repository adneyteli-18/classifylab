import { useMemo, useState } from 'react'
import { Check, Database, FileUp, RotateCcw, Scissors } from 'lucide-react'
import { useLab } from '../context/useLab.js'
import {
  createTrainTestSplit,
  fitStandardizer,
  getDatasetSummary,
  irisDataset,
  parseDatasetCsv,
  teachingDataset,
} from '../simulation/knn.js'

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

function DataPreparation({ onViewEvaluation }) {
  const {
    dataset,
    setDataset,
    selectedFeatures,
    setSelectedFeatures,
    split,
    setSplit,
    testRatio,
    setTestRatio,
    standardize,
    setStandardize,
    demonstrateLeakage,
    setDemonstrateLeakage,
    setLatestEvaluation,
  } = useLab()
  const [seed, setSeed] = useState('42')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isReadingFile, setIsReadingFile] = useState(false)

  const summary = useMemo(() => (dataset ? getDatasetSummary(dataset) : null), [dataset])
  const features = summary?.featureNames ?? []
  const activeFeatures =
    selectedFeatures.length > 0 && selectedFeatures.every((feature) => features.includes(feature))
      ? selectedFeatures
      : features
  const validSplit =
    split &&
    split.datasetName === dataset?.name &&
    split.datasetRows === dataset?.rows.length &&
    split.featureNames.join('|') === activeFeatures.join('|')
      ? split
      : null

  const scalerDetails = useMemo(() => {
    if (!dataset || !validSplit || !standardize) return null
    const trainingRows = validSplit.trainingIndexes.map((index) => dataset.rows[index])
    const stats = fitStandardizer(trainingRows, activeFeatures)
    const leakageStats = demonstrateLeakage
      ? fitStandardizer(
          [...validSplit.trainingIndexes, ...validSplit.testingIndexes].map(
            (index) => dataset.rows[index],
          ),
          activeFeatures,
        )
      : null
    return { stats, leakageStats }
  }, [dataset, validSplit, standardize, demonstrateLeakage, activeFeatures])

  function setNewDataset(nextDataset, message) {
    setDataset(nextDataset)
    setSelectedFeatures(nextDataset.featureNames.slice(0, 2))
    setSplit(null)
    setLatestEvaluation(null)
    setError('')
    setNotice(message)
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    setNotice('')
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
      const parsed = parseDatasetCsv(await file.text(), file.name)
      setNewDataset(parsed, `Loaded ${parsed.rows.length} rows from ${file.name}.`)
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setIsReadingFile(false)
    }
  }

  function toggleFeature(feature) {
    const nextFeatures = activeFeatures.includes(feature)
      ? activeFeatures.filter((item) => item !== feature)
      : [...activeFeatures, feature]
    setSelectedFeatures(nextFeatures)
    setSplit(null)
    setLatestEvaluation(null)
  }

  function prepareSplit() {
    setError('')
    setNotice('')
    try {
      if (!dataset) throw new Error('Choose a dataset before creating a split.')
      if (activeFeatures.length === 0) throw new Error('Select at least one feature.')
      const parsedSeed = Number(seed)
      const newSplit = createTrainTestSplit(dataset, testRatio, parsedSeed, activeFeatures)
      setSplit({
        ...newSplit,
        datasetName: dataset.name,
        datasetRows: dataset.rows.length,
      })
      setSelectedFeatures(activeFeatures)
      setLatestEvaluation(null)
      setNotice(
        `Created a reproducible split: ${newSplit.trainingIndexes.length} training rows and ${newSplit.testingIndexes.length} test rows.`,
      )
    } catch (splitError) {
      setError(splitError.message)
    }
  }

  function changeDataset(event) {
    if (event.target.value === 'teaching') {
      setNewDataset(teachingDataset, 'Loaded the built-in two-class teaching dataset.')
    } else if (event.target.value === 'iris') {
      setNewDataset(irisDataset, 'Loaded the local Iris dataset (150 labeled rows).')
    }
  }

  const missingRows = summary
    ? dataset.rows.filter(
        (row) =>
          typeof row.label !== 'string' ||
          !row.label.trim() ||
          features.some((feature) => {
            const value = row.values?.[feature] ?? row.features?.[feature] ?? row[feature]
            return !Number.isFinite(value)
          }),
      ).length
    : 0

  return (
    <div className="data-preparation-layout">
      <section className="vlab-card preparation-card">
        <div className="vlab-card-heading">
          <div>
            <p className="vlab-eyebrow">STEP 1 · INSPECT DATA</p>
            <h2>Dataset</h2>
          </div>
          {summary && (
            <span className="data-ready-badge">
              <Database aria-hidden="true" size={13} /> {summary.rowCount} rows
            </span>
          )}
        </div>
        <div className="dataset-picker-row">
          <label className="preparation-field">
            <span className="field-label">Choose a dataset</span>
            <select
              className="vlab-input"
              onChange={changeDataset}
              value={
                dataset?.name === irisDataset.name
                  ? 'iris'
                  : dataset?.name === teachingDataset.name
                    ? 'teaching'
                    : ''
              }
            >
              <option value="">Select built-in data…</option>
              <option value="teaching">Two-class teaching set (8 rows)</option>
              <option value="iris">Iris (150 rows, 4 features)</option>
            </select>
          </label>
          <label className={`vlab-button vlab-button-secondary preparation-upload${isReadingFile ? ' is-busy' : ''}`}>
            <FileUp aria-hidden="true" size={15} />
            {isReadingFile ? 'Reading…' : 'Upload CSV'}
            <input
              accept=".csv,text/csv"
              aria-label="Upload dataset CSV"
              disabled={isReadingFile}
              onChange={handleFileChange}
              type="file"
            />
          </label>
        </div>

        {error && <p className="vlab-message vlab-message-error" role="alert">{error}</p>}
        {notice && <p className="vlab-message vlab-message-success" role="status">{notice}</p>}

        {summary ? (
          <>
            <div className="dataset-summary-grid">
              <div><span>Rows</span><strong>{summary.rowCount}</strong></div>
              <div><span>Numeric features</span><strong>{summary.featureCount}</strong></div>
              <div><span>Classes</span><strong>{Object.keys(summary.classDistribution).length}</strong></div>
              <div className={summary.missingValueCount ? 'summary-warning' : 'summary-good'}>
                <span>Missing values</span><strong>{summary.missingValueCount}</strong>
              </div>
            </div>

            <div className="distribution-section">
              <h3>Class distribution</h3>
              <div className="distribution-list">
                {Object.entries(summary.classDistribution).map(([label, count]) => (
                  <div className="distribution-row" key={label}>
                    <span>{label}</span>
                    <span className="distribution-bar">
                      <i style={{ width: `${(count / summary.rowCount) * 100}%` }} />
                    </span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
              {missingRows > 0 && (
                <p className="field-help">
                  {missingRows} incomplete {missingRows === 1 ? 'row is' : 'rows are'} excluded from train/test splits.
                </p>
              )}
            </div>

            <fieldset className="feature-selector">
              <legend>Features used by KNN</legend>
              <div>
                {features.map((feature) => (
                  <label key={feature}>
                    <input
                      checked={activeFeatures.includes(feature)}
                      onChange={() => toggleFeature(feature)}
                      type="checkbox"
                    />
                    <span>{feature}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <div className="preparation-empty">
            <Database aria-hidden="true" size={21} />
            <strong>No dataset selected</strong>
            <span>Select the teaching set, Iris, or upload a labeled CSV.</span>
          </div>
        )}
      </section>

      <section className="vlab-card preparation-card split-card">
        <div className="vlab-card-heading">
          <div>
            <p className="vlab-eyebrow">STEP 2 · PREPARE DATA</p>
            <h2>Train / test split</h2>
          </div>
          <Scissors aria-hidden="true" className="preparation-heading-icon" size={18} />
        </div>
        <p className="preparation-copy">
          Rows are split reproducibly within each class. Incomplete feature or label rows are excluded.
        </p>
        <div className="split-controls">
          <label className="preparation-field">
            <span className="field-label">Test set (%)</span>
            <input
              className="vlab-input"
              max="50"
              min="10"
              onChange={(event) => {
                const percent = Number(event.target.value)
                if (Number.isFinite(percent) && percent >= 10 && percent <= 50) {
                  setTestRatio(percent / 100)
                  setSplit(null)
                }
              }}
              step="5"
              type="number"
              value={Math.round(testRatio * 100)}
            />
          </label>
          <label className="preparation-field">
            <span className="field-label">Random seed</span>
            <input
              className="vlab-input"
              max="2147483647"
              min="0"
              onChange={(event) => setSeed(event.target.value)}
              type="number"
              value={seed}
            />
          </label>
        </div>

        <label className="toggle-option">
          <input
            checked={standardize}
            onChange={(event) => setStandardize(event.target.checked)}
            type="checkbox"
          />
          <span><strong>Standardize features</strong><small>Use mean and standard deviation fitted on training rows only.</small></span>
        </label>
        {standardize && (
          <label className="toggle-option leakage-toggle">
            <input
              checked={demonstrateLeakage}
              onChange={(event) => setDemonstrateLeakage(event.target.checked)}
              type="checkbox"
            />
            <span><strong>Demonstrate data leakage</strong><small>Compare against the incorrect scaler fitted using training and test rows.</small></span>
          </label>
        )}

        <button
          className="vlab-button vlab-button-primary prepare-button"
          disabled={!dataset}
          onClick={prepareSplit}
          type="button"
        >
          <Scissors aria-hidden="true" size={15} /> Create train/test split
        </button>

        {validSplit && (
          <div className="split-result" role="status">
            <div className="split-result-heading">
              <Check aria-hidden="true" size={16} />
              <strong>Split ready</strong>
              <span>Seed {validSplit.seed}</span>
            </div>
            <div className="split-counts">
              <div><span>Training</span><strong>{validSplit.trainingIndexes.length} rows</strong></div>
              <div><span>Testing</span><strong>{validSplit.testingIndexes.length} rows</strong></div>
              <div><span>Excluded</span><strong>{validSplit.excludedRows} rows</strong></div>
            </div>
            {scalerDetails && (
              <>
                <p className="scaler-caption">Correct scaler · fitted on training data only</p>
                <div className="scaler-table-wrap">
                  <table className="scaler-table">
                    <thead><tr><th>Feature</th><th>Train mean</th><th>Train std</th>{demonstrateLeakage && <th>Leaky mean</th>}</tr></thead>
                    <tbody>
                      {activeFeatures.map((feature) => (
                        <tr key={feature}>
                          <td>{feature}</td>
                          <td>{scalerDetails.stats[feature].mean.toFixed(4)}</td>
                          <td>{scalerDetails.stats[feature].standardDeviation.toFixed(4)}</td>
                          {demonstrateLeakage && (
                            <td>{scalerDetails.leakageStats[feature].mean.toFixed(4)}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {demonstrateLeakage && standardize && (
              <div className="leakage-explanation">
                <p>
                  Leakage demo: the second scaler includes test features while fitting. The actual evaluation uses the correct train-only scaler; compare the results in Evaluation.
                </p>
                <button className="text-link" onClick={onViewEvaluation} type="button">
                  View evaluation
                </button>
              </div>
            )}
          </div>
        )}
        {!dataset && (
          <p className="field-help">Select a dataset to configure preprocessing and create a split.</p>
        )}
      </section>
      {dataset && (
        <p className="dataset-attribution">
          {dataset.name === irisDataset.name
            ? 'Iris data source: UCI Machine Learning Repository; included locally for offline and static-hosted use.'
            : `${dataset.source ?? 'Dataset'} · processed locally in this browser.`}
          <button
            className="quiet-button"
            onClick={() => {
              setDataset(null)
              setSelectedFeatures([])
              setSplit(null)
              setLatestEvaluation(null)
              setNotice('')
            }}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={12} /> Clear dataset
          </button>
        </p>
      )}
    </div>
  )
}

export default DataPreparation
