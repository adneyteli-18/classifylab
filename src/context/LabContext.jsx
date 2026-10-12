import { useEffect, useState } from 'react'
import LabContext from './labContextValue.js'
const RUNS_STORAGE_KEY = 'classifylab-runs'
const DATASET_STORAGE_KEY = 'classifylab-dataset'
const FEATURES_STORAGE_KEY = 'classifylab-selected-features'
const K_STORAGE_KEY = 'classifylab-k'
const SPLIT_STORAGE_KEY = 'classifylab-split'
const SPLIT_RATIO_STORAGE_KEY = 'classifylab-test-ratio'
const STANDARDIZE_STORAGE_KEY = 'classifylab-standardize'
const LEAKAGE_STORAGE_KEY = 'classifylab-demonstrate-leakage'

function loadStoredValue(key, fallback, isValid) {
  try {
    const value = window.localStorage.getItem(key)
    if (value === null) return fallback

    const parsedValue = JSON.parse(value)
    if (isValid(parsedValue)) return parsedValue

    console.error(`Saved ClassifyLab value "${key}" has an invalid format.`)
  } catch (error) {
    console.error(`Unable to load "${key}" from localStorage.`, error)
  }

  return fallback
}

function loadSavedRuns() {
  const parsedRuns = loadStoredValue(RUNS_STORAGE_KEY, [], Array.isArray)
  return parsedRuns.filter(
    (run) => run && typeof run === 'object' && !Array.isArray(run),
  )
}

function saveStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Unable to save "${key}" to localStorage.`, error)
  }
}

function isValidDataset(value) {
  if (value === null) return true
  if (
    !value ||
    typeof value.name !== 'string' ||
    !Array.isArray(value.featureNames) ||
    value.featureNames.length === 0 ||
    !Array.isArray(value.rows)
  ) {
    return false
  }
  return value.rows.every(
    (row) =>
      row &&
      (typeof row.label === 'string' || row.label === null) &&
      value.featureNames.every((feature) => {
        const featureValue =
          row.values?.[feature] ?? row.features?.[feature] ?? row[feature]
        return featureValue === null || Number.isFinite(featureValue)
      }),
  )
}

function isValidSplit(value) {
  return (
    value === null ||
    (value &&
      Array.isArray(value.trainingIndexes) &&
      Array.isArray(value.testingIndexes) &&
      value.trainingIndexes.every(Number.isInteger) &&
      value.testingIndexes.every(Number.isInteger) &&
      Array.isArray(value.featureNames))
  )
}

export function LabProvider({ children }) {
  const [dataset, setDataset] = useState(() =>
    loadStoredValue(DATASET_STORAGE_KEY, null, isValidDataset),
  )
  const [selectedFeatures, setSelectedFeatures] = useState(() =>
    loadStoredValue(
      FEATURES_STORAGE_KEY,
      [],
      (value) =>
        Array.isArray(value) &&
        value.every((feature) => typeof feature === 'string'),
    ),
  )
  const [k, setK] = useState(() =>
    loadStoredValue(
      K_STORAGE_KEY,
      null,
      (value) => value === null || (Number.isInteger(value) && value > 0),
    ),
  )
  const [split, setSplit] = useState(() =>
    loadStoredValue(SPLIT_STORAGE_KEY, null, isValidSplit),
  )
  const [testRatio, setTestRatio] = useState(() =>
    loadStoredValue(
      SPLIT_RATIO_STORAGE_KEY,
      0.2,
      (value) => Number.isFinite(value) && value > 0 && value < 1,
    ),
  )
  const [standardize, setStandardize] = useState(() =>
    loadStoredValue(STANDARDIZE_STORAGE_KEY, true, (value) => typeof value === 'boolean'),
  )
  const [demonstrateLeakage, setDemonstrateLeakage] = useState(() =>
    loadStoredValue(LEAKAGE_STORAGE_KEY, false, (value) => typeof value === 'boolean'),
  )
  const [latestEvaluation, setLatestEvaluation] = useState(null)
  const [runs, setRuns] = useState(loadSavedRuns)

  useEffect(() => {
    saveStoredValue(RUNS_STORAGE_KEY, runs)
  }, [runs])

  useEffect(() => {
    saveStoredValue(DATASET_STORAGE_KEY, dataset)
  }, [dataset])

  useEffect(() => {
    saveStoredValue(FEATURES_STORAGE_KEY, selectedFeatures)
  }, [selectedFeatures])

  useEffect(() => {
    saveStoredValue(K_STORAGE_KEY, k)
  }, [k])

  useEffect(() => {
    saveStoredValue(SPLIT_STORAGE_KEY, split)
  }, [split])

  useEffect(() => {
    saveStoredValue(SPLIT_RATIO_STORAGE_KEY, testRatio)
  }, [testRatio])

  useEffect(() => {
    saveStoredValue(STANDARDIZE_STORAGE_KEY, standardize)
  }, [standardize])

  useEffect(() => {
    saveStoredValue(LEAKAGE_STORAGE_KEY, demonstrateLeakage)
  }, [demonstrateLeakage])

  return (
    <LabContext.Provider
      value={{
        dataset,
        setDataset,
        selectedFeatures,
        setSelectedFeatures,
        k,
        setK,
        split,
        setSplit,
        testRatio,
        setTestRatio,
        standardize,
        setStandardize,
        demonstrateLeakage,
        setDemonstrateLeakage,
        latestEvaluation,
        setLatestEvaluation,
        runs,
        setRuns,
      }}
    >
      {children}
    </LabContext.Provider>
  )
}

export default LabProvider
