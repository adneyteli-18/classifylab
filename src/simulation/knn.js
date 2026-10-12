import irisCsv from '../data/iris.csv?raw'

export const teachingDataset = {
  name: 'Two-class teaching set',
  source: 'Built-in teaching data',
  labelName: 'label',
  featureNames: ['x', 'y'],
  rows: [
    { x: 1.0, y: 1.1, label: 'Orchid' },
    { x: 1.4, y: 1.3, label: 'Orchid' },
    { x: 1.1, y: 1.7, label: 'Orchid' },
    { x: 1.7, y: 1.0, label: 'Orchid' },
    { x: 4.2, y: 4.1, label: 'Teal' },
    { x: 4.5, y: 4.4, label: 'Teal' },
    { x: 4.0, y: 4.7, label: 'Teal' },
    { x: 4.8, y: 4.0, label: 'Teal' },
  ],
}

export const irisDataset = parseDatasetCsv(irisCsv, 'Iris dataset')
irisDataset.source = 'Fisher Iris dataset · UCI Machine Learning Repository'

function readFeatureValue(row, feature) {
  const value = row.values?.[feature] ?? row.features?.[feature] ?? row[feature]
  return value === '' || value === undefined ? null : value
}

export function getFeatureNames(dataset) {
  if (Array.isArray(dataset?.featureNames) && dataset.featureNames.length > 0) {
    return dataset.featureNames
  }
  return ['x', 'y']
}

function parseCsvRows(text) {
  const rows = []
  let fields = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (character === ',' && !inQuotes) {
      fields.push(field.trim())
      field = ''
    } else if ((character === '\n' || character === '\r') && !inQuotes) {
      fields.push(field.trim())
      field = ''
      if (fields.some((value) => value !== '')) rows.push(fields)
      fields = []
      if (character === '\r' && text[index + 1] === '\n') index += 1
    } else {
      field += character
    }
  }

  if (inQuotes) throw new Error('The CSV has an unclosed quoted value.')
  fields.push(field.trim())
  if (fields.some((value) => value !== '')) rows.push(fields)
  return rows
}

export function parseDatasetCsv(text, fileName = 'Uploaded CSV') {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error('The selected CSV file is empty.')
  }

  const table = parseCsvRows(text)
  if (table.length < 2) {
    throw new Error('Include a header row and at least one data row.')
  }

  const headers = table[0].map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, '') : header).trim(),
  )
  const normalizedHeaders = headers.map((header) => header.toLowerCase())
  if (headers.some((header) => !header)) {
    throw new Error('Every CSV column needs a header.')
  }
  if (new Set(normalizedHeaders).size !== headers.length) {
    throw new Error('CSV column names must be unique.')
  }

  const commonLabelNames = ['label', 'class', 'target', 'species']
  let labelIndex = normalizedHeaders.findIndex((header) =>
    commonLabelNames.includes(header),
  )
  if (labelIndex < 0) labelIndex = headers.length - 1

  const featureIndexes = headers
    .map((_, index) => index)
    .filter((index) => index !== labelIndex)
  if (featureIndexes.length === 0) {
    throw new Error('Include at least one numeric feature column and one class column.')
  }

  const dataRows = table.slice(1)
  if (dataRows.length > 10000) {
    throw new Error('CSV is limited to 10,000 data rows for this local lab.')
  }

  const rows = dataRows.map((cells, rowIndex) => {
    if (cells.length !== headers.length) {
      throw new Error(
        `Row ${rowIndex + 2} has ${cells.length} columns; expected ${headers.length}.`,
      )
    }

    const values = {}
    for (const featureIndex of featureIndexes) {
      const rawValue = cells[featureIndex]
      if (rawValue === '') {
        values[headers[featureIndex]] = null
        continue
      }
      const numericValue = Number(rawValue)
      if (!Number.isFinite(numericValue)) {
        throw new Error(
          `Row ${rowIndex + 2}, "${headers[featureIndex]}" must be numeric or blank.`,
        )
      }
      values[headers[featureIndex]] = numericValue
    }

    return {
      ...values,
      values,
      label: cells[labelIndex] || null,
    }
  })

  return {
    name: fileName,
    source: 'Uploaded CSV',
    labelName: headers[labelIndex],
    featureNames: featureIndexes.map((index) => headers[index]),
    rows,
  }
}

export function getDatasetSummary(dataset) {
  const featureNames = getFeatureNames(dataset)
  const classDistribution = {}
  let missingValueCount = 0

  for (const row of dataset?.rows ?? []) {
    if (typeof row.label !== 'string' || row.label.trim() === '') {
      missingValueCount += 1
    } else {
      classDistribution[row.label] = (classDistribution[row.label] ?? 0) + 1
    }

    for (const feature of featureNames) {
      const value = readFeatureValue(row, feature)
      if (value === null || value === undefined || !Number.isFinite(value)) {
        missingValueCount += 1
      }
    }
  }

  return {
    rowCount: dataset?.rows?.length ?? 0,
    featureCount: featureNames.length,
    featureNames,
    classDistribution,
    missingValueCount,
  }
}

function seededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function createTrainTestSplit(dataset, testRatio = 0.2, seed = 42, features) {
  if (!Number.isFinite(testRatio) || testRatio <= 0 || testRatio >= 1) {
    throw new Error('Test ratio must be greater than 0 and less than 1.')
  }
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) {
    throw new Error('Random seed must be an integer from 0 to 2,147,483,647.')
  }

  const activeFeatures = features?.length ? features : getFeatureNames(dataset)
  const eligible = (dataset?.rows ?? [])
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => {
      if (typeof row.label !== 'string' || row.label.trim() === '') return false
      return activeFeatures.every((feature) => {
        const value = readFeatureValue(row, feature)
        return Number.isFinite(value)
      })
    })

  if (eligible.length < 2) {
    throw new Error('At least two complete labeled rows are required for splitting.')
  }

  const byClass = new Map()
  for (const item of eligible) {
    const classRows = byClass.get(item.row.label) ?? []
    classRows.push(item)
    byClass.set(item.row.label, classRows)
  }

  const random = seededRandom(seed)
  const trainingIndexes = []
  const testingIndexes = []
  for (const classRows of byClass.values()) {
    for (let index = classRows.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1))
      ;[classRows[index], classRows[swapIndex]] = [
        classRows[swapIndex],
        classRows[index],
      ]
    }

    let testCount =
      classRows.length > 1 ? Math.round(classRows.length * testRatio) : 0
    if (classRows.length > 1) {
      testCount = Math.min(classRows.length - 1, Math.max(1, testCount))
    }
    testingIndexes.push(...classRows.slice(0, testCount).map(({ index }) => index))
    trainingIndexes.push(...classRows.slice(testCount).map(({ index }) => index))
  }

  if (testingIndexes.length === 0) {
    throw new Error('The split has no test rows. Add more labeled data.')
  }

  return {
    trainingIndexes: trainingIndexes.sort((a, b) => a - b),
    testingIndexes: testingIndexes.sort((a, b) => a - b),
    requestedTestRatio: testRatio,
    seed,
    featureNames: activeFeatures,
    excludedRows: (dataset?.rows?.length ?? 0) - eligible.length,
  }
}

export function fitStandardizer(rows, features) {
  if (rows.length === 0 || features.length === 0) {
    throw new Error('Training rows and features are required to fit a standardizer.')
  }

  const stats = {}
  for (const feature of features) {
    const values = rows.map((row) => readFeatureValue(row, feature))
    if (!values.every(Number.isFinite)) {
      throw new Error(`Feature "${feature}" contains a missing or invalid value.`)
    }
    const mean = values.reduce((total, value) => total + value, 0) / values.length
    const variance =
      values.reduce((total, value) => total + (value - mean) ** 2, 0) /
      values.length
    const standardDeviation = Math.sqrt(variance)
    stats[feature] = {
      mean,
      standardDeviation,
      scale: standardDeviation === 0 ? 1 : standardDeviation,
    }
  }
  return stats
}

export function transformRows(rows, features, stats) {
  return rows.map((row) => {
    const values = {}
    for (const feature of features) {
      const value = readFeatureValue(row, feature)
      if (!Number.isFinite(value)) {
        throw new Error(`Feature "${feature}" contains a missing or invalid value.`)
      }
      const stat = stats[feature]
      values[feature] = stat ? (value - stat.mean) / stat.scale : value
    }
    return { ...row, values }
  })
}

function calculateDistance(first, second, features, metric) {
  const differences = features.map(
    (feature) => readFeatureValue(first, feature) - readFeatureValue(second, feature),
  )
  if (metric === 'euclidean') {
    return Math.sqrt(differences.reduce((sum, value) => sum + value ** 2, 0))
  }
  if (metric === 'manhattan') {
    return differences.reduce((sum, value) => sum + Math.abs(value), 0)
  }
  if (metric === 'chebyshev') {
    return Math.max(...differences.map(Math.abs))
  }
  throw new Error('Choose Euclidean, Manhattan, or Chebyshev distance.')
}

export function predictKnn({
  trainingRows,
  point,
  features,
  k,
  metric = 'euclidean',
}) {
  if (!Array.isArray(trainingRows) || trainingRows.length === 0) {
    throw new Error('Training rows are required to classify a point.')
  }
  if (!Array.isArray(features) || features.length === 0) {
    throw new Error('Select at least one numeric feature.')
  }
  if (!Number.isInteger(k) || k < 1 || k > trainingRows.length) {
    throw new Error(`Choose a k value from 1 to ${trainingRows.length}.`)
  }
  if (!['euclidean', 'manhattan', 'chebyshev'].includes(metric)) {
    throw new Error('Choose Euclidean, Manhattan, or Chebyshev distance.')
  }

  for (const feature of features) {
    if (!Number.isFinite(readFeatureValue(point, feature))) {
      throw new Error(`Enter a valid numeric value for "${feature}".`)
    }
  }

  const neighbors = trainingRows
    .map((row, index) => ({
      ...row,
      rowNumber: row.rowNumber ?? index + 1,
      distance: calculateDistance(row, point, features, metric),
    }))
    .sort(
      (first, second) =>
        first.distance - second.distance || first.rowNumber - second.rowNumber,
    )
    .slice(0, k)

  const votes = new Map()
  for (const neighbor of neighbors) {
    const vote = votes.get(neighbor.label) ?? {
      label: neighbor.label,
      count: 0,
      totalDistance: 0,
    }
    vote.count += 1
    vote.totalDistance += neighbor.distance
    votes.set(neighbor.label, vote)
  }

  const rankedVotes = [...votes.values()].sort(
    (first, second) =>
      second.count - first.count ||
      first.totalDistance - second.totalDistance ||
      first.label.localeCompare(second.label),
  )

  return {
    predictedLabel: rankedVotes[0].label,
    neighbors,
    votes: rankedVotes,
    metric,
    k,
    point,
    features,
  }
}

export function calculateMetrics(actual, predicted, classLabels) {
  if (actual.length !== predicted.length || actual.length === 0) {
    throw new Error('Actual and predicted labels must have equal non-zero lengths.')
  }

  const labels = [...new Set(classLabels ?? [...actual, ...predicted])].sort()
  const matrix = Object.fromEntries(
    labels.map((label) => [label, Object.fromEntries(labels.map((item) => [item, 0]))]),
  )
  let correct = 0
  for (let index = 0; index < actual.length; index += 1) {
    if (!matrix[actual[index]] || matrix[actual[index]][predicted[index]] === undefined) {
      throw new Error('A true or predicted class is missing from the confusion matrix.')
    }
    matrix[actual[index]][predicted[index]] += 1
    if (actual[index] === predicted[index]) correct += 1
  }

  const perClass = labels.map((label) => {
    const truePositive = matrix[label][label]
    const falsePositive = labels.reduce(
      (sum, actualLabel) =>
        sum + (actualLabel === label ? 0 : matrix[actualLabel][label]),
      0,
    )
    const falseNegative = labels.reduce(
      (sum, predictedLabel) =>
        sum + (predictedLabel === label ? 0 : matrix[label][predictedLabel]),
      0,
    )
    const precision =
      truePositive + falsePositive === 0
        ? 0
        : truePositive / (truePositive + falsePositive)
    const recall =
      truePositive + falseNegative === 0
        ? 0
        : truePositive / (truePositive + falseNegative)
    const f1 =
      precision + recall === 0
        ? 0
        : (2 * precision * recall) / (precision + recall)
    const support = labels.reduce((sum, item) => sum + matrix[label][item], 0)
    return { label, precision, recall, f1, support }
  })

  const macroAverage = (key) =>
    perClass.reduce((sum, item) => sum + item[key], 0) / perClass.length

  return {
    sampleCount: actual.length,
    accuracy: correct / actual.length,
    precision: macroAverage('precision'),
    recall: macroAverage('recall'),
    f1: macroAverage('f1'),
    classLabels: labels,
    confusionMatrix: matrix,
    perClass,
  }
}

export function evaluateKnnSplit({
  dataset,
  split,
  features,
  k,
  metric = 'euclidean',
  standardize = true,
  demonstrateLeakage = false,
}) {
  if (!split) throw new Error('Create a train/test split in Data Preparation first.')
  const rows = dataset.rows
  const trainingRows = split.trainingIndexes.map((index) => ({
    ...rows[index],
    rowNumber: index + 1,
  }))
  const testingRows = split.testingIndexes.map((index) => ({
    ...rows[index],
    rowNumber: index + 1,
  }))
  if (trainingRows.length === 0 || testingRows.length === 0) {
    throw new Error('The train/test split is empty. Create a new split.')
  }

  const scaler = standardize
    ? fitStandardizer(trainingRows, features)
    : Object.fromEntries(features.map((feature) => [feature, { mean: 0, standardDeviation: 1, scale: 1 }]))
  const scaledTrainingRows = transformRows(trainingRows, features, scaler)
  const scaledTestingRows = transformRows(testingRows, features, scaler)
  const predictions = scaledTestingRows.map((testRow) =>
    predictKnn({
      trainingRows: scaledTrainingRows,
      point: testRow,
      features,
      k,
      metric,
    }).predictedLabel,
  )
  const classLabels = [
    ...new Set(rows.map((row) => row.label).filter((label) => typeof label === 'string')),
  ]
  const metrics = calculateMetrics(
    scaledTestingRows.map((row) => row.label),
    predictions,
    classLabels,
  )

  let leakageComparison = null
  if (demonstrateLeakage && standardize) {
    const leakyScaler = fitStandardizer(
      [...trainingRows, ...testingRows],
      features,
    )
    const leakyTrainingRows = transformRows(trainingRows, features, leakyScaler)
    const leakyTestingRows = transformRows(testingRows, features, leakyScaler)
    const leakyPredictions = leakyTestingRows.map((testRow) =>
      predictKnn({
        trainingRows: leakyTrainingRows,
        point: testRow,
        features,
        k,
        metric,
      }).predictedLabel,
    )
    leakageComparison = {
      scaler: leakyScaler,
      metrics: calculateMetrics(
        leakyTestingRows.map((row) => row.label),
        leakyPredictions,
        classLabels,
      ),
    }
  }

  return {
    metrics,
    predictions,
    actual: scaledTestingRows.map((row) => row.label),
    trainingRows: scaledTrainingRows,
    testingRows: scaledTestingRows,
    scaler,
    leakageComparison,
    split,
    features,
    k,
    metric,
    standardize,
  }
}

export function calculateDrift(referenceRows, incomingRows, features) {
  if (referenceRows.length === 0 || incomingRows.length === 0) {
    throw new Error('Reference and incoming rows are both required to calculate drift.')
  }

  return features.map((feature) => {
    const referenceValues = referenceRows.map((row) => readFeatureValue(row, feature))
    const incomingValues = incomingRows.map((row) => readFeatureValue(row, feature))
    if (
      !referenceValues.every(Number.isFinite) ||
      !incomingValues.every(Number.isFinite)
    ) {
      throw new Error(`Feature "${feature}" contains missing data for drift analysis.`)
    }
    const referenceMean =
      referenceValues.reduce((sum, value) => sum + value, 0) / referenceValues.length
    const incomingMean =
      incomingValues.reduce((sum, value) => sum + value, 0) / incomingValues.length
    const referenceVariance =
      referenceValues.reduce((sum, value) => sum + (value - referenceMean) ** 2, 0) /
      referenceValues.length
    const referenceStd = Math.sqrt(referenceVariance)
    const standardizedMeanDifference =
      referenceStd === 0
        ? incomingMean === referenceMean
          ? 0
          : Number.POSITIVE_INFINITY
        : Math.abs(incomingMean - referenceMean) / referenceStd
    return {
      feature,
      referenceMean,
      incomingMean,
      referenceStd,
      standardizedMeanDifference,
    }
  })
}

export function calculateKnn({ rows, point, k, metric = 'euclidean' }) {
  return predictKnn({
    trainingRows: rows,
    point,
    features: ['x', 'y'],
    k,
    metric,
  })
}
