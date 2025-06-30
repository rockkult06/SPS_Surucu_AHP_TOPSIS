export interface AHPResult {
  weights: number[]
  cr: number
  isConsistent: boolean
}

export interface HierarchicalAHPResults {
  mainWeights: number[]
  mainCR: number
  mainConsistent: boolean
  subWeights: Record<string, number[]>
  subCRs: Record<string, number>
  subConsistent: Record<string, boolean>
  subSubWeights: Record<string, number[]>
  subSubCRs: Record<string, number>
  subSubConsistent: Record<string, boolean>
  globalWeights: Record<string, number>
  leafCriteria: string[]
  isOverallConsistent: boolean
}

// Random Index (RI) values for consistency ratio calculation
const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49]

/**
 * Calculates AHP weights and consistency ratio for a given comparison matrix.
 * @param matrix The pairwise comparison matrix.
 * @returns AHPResult containing weights, consistency ratio (CR), and consistency status.
 */
export function calculateAHP(matrix: number[][]): AHPResult {
  const n = matrix.length
  if (n === 0) {
    return { weights: [], cr: 0, isConsistent: true }
  }
  if (n === 1) {
    return { weights: [1], cr: 0, isConsistent: true }
  }

  // 1. Normalize the matrix (sum of columns to 1)
  const normalizedMatrix: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0))
  const columnSums: number[] = Array(n).fill(0)

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      columnSums[j] += matrix[i][j]
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      normalizedMatrix[i][j] = matrix[i][j] / columnSums[j]
    }
  }

  // 2. Calculate the weights (average of rows in the normalized matrix)
  const weights: number[] = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      weights[i] += normalizedMatrix[i][j]
    }
    weights[i] /= n
  }

  // 3. Calculate Consistency Index (CI)
  // Calculate A * w (matrix multiplied by weights vector)
  const Aw: number[] = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Aw[i] += matrix[i][j] * weights[j]
    }
  }

  // Calculate lambda_max (average of (Aw[i] / weights[i]))
  let lambdaMax = 0
  let validCount = 0
  for (let i = 0; i < n; i++) {
    if (weights[i] !== 0) {
      lambdaMax += Aw[i] / weights[i]
      validCount++
    }
  }
  lambdaMax = validCount > 0 ? lambdaMax / validCount : 0

  const CI = (lambdaMax - n) / (n - 1)

  // 4. Calculate Consistency Ratio (CR)
  const R_I = RI[n - 1] // RI for matrix size n
  const CR = R_I !== 0 ? CI / R_I : 0

  // Check consistency (CR < 0.10)
  const isConsistent = CR < 0.1

  return { weights, cr: CR, isConsistent }
}

/**
 * Calculates hierarchical AHP global weights and consistency for all levels.
 * @param hierarchyData The structured data containing main, sub, and sub-sub criteria matrices.
 * @returns HierarchicalAHPResults containing weights and consistency for all levels.
 */
export function calculateHierarchicalAHP(hierarchyData: any): HierarchicalAHPResults {
  // Calculate weights for main criteria
  const mainResult = calculateAHP(hierarchyData.mainCriteria.matrix)
  const mainWeights = mainResult.weights
  const mainCR = mainResult.cr
  const mainConsistent = mainResult.isConsistent

  // Calculate weights for sub-criteria
  const subWeights: Record<string, number[]> = {}
  const subCRs: Record<string, number> = {}
  const subConsistent: Record<string, boolean> = {}

  for (const parentId of Object.keys(hierarchyData.subCriteria)) {
    const subMatrix = hierarchyData.subCriteria[parentId].matrix
    const subIds = hierarchyData.subCriteria[parentId].ids

    if (subIds.length > 1) {
      const result = calculateAHP(subMatrix)
      subWeights[parentId] = result.weights
      subCRs[parentId] = result.cr
      subConsistent[parentId] = result.isConsistent
    } else if (subIds.length === 1) {
      // If there's only one sub-criterion, its weight is 1
      subWeights[parentId] = [1]
      subCRs[parentId] = 0
      subConsistent[parentId] = true
    } else {
      // No sub-criteria for this parent
      subWeights[parentId] = []
      subCRs[parentId] = 0
      subConsistent[parentId] = true
    }
  }

  // Calculate weights for sub-sub-criteria
  const subSubWeights: Record<string, number[]> = {}
  const subSubCRs: Record<string, number> = {}
  const subSubConsistent: Record<string, boolean> = {}

  for (const parentId of Object.keys(hierarchyData.subSubCriteria)) {
    const subSubMatrix = hierarchyData.subSubCriteria[parentId].matrix
    const subSubIds = hierarchyData.subSubCriteria[parentId].ids

    if (subSubIds.length > 1) {
      const result = calculateAHP(subSubMatrix)
      subSubWeights[parentId] = result.weights
      subSubCRs[parentId] = result.cr
      subSubConsistent[parentId] = result.isConsistent
    } else if (subSubIds.length === 1) {
      // If there's only one sub-sub-criterion, its weight is 1
      subSubWeights[parentId] = [1]
      subSubCRs[parentId] = 0
      subSubConsistent[parentId] = true
    } else {
      // No sub-sub-criteria for this parent
      subSubWeights[parentId] = []
      subSubCRs[parentId] = 0
      subSubConsistent[parentId] = true
    }
  }

  // Calculate global weights for leaf criteria
  const globalWeights: Record<string, number> = {}
  const leafCriteria: string[] = []

  // Iterate through main criteria to calculate global weights
  hierarchyData.mainCriteria.ids.forEach((mainId: string, mainIndex: number) => {
    const mainCriterion = hierarchyData.criteriaMap[mainId]
    const mainWeight = mainWeights[mainIndex]

    if (mainCriterion.isLeaf) {
      globalWeights[mainId] = mainWeight
      leafCriteria.push(mainId)
    } else if (mainCriterion.children && mainCriterion.children.length > 0) {
      // Process sub-criteria
      hierarchyData.subCriteria[mainId]?.ids.forEach((subId: string, subIndex: number) => {
        const subCriterion = hierarchyData.criteriaMap[subId]
        const subWeight = subWeights[mainId]?.[subIndex] || 0

        if (subCriterion.isLeaf) {
          globalWeights[subId] = mainWeight * subWeight
          leafCriteria.push(subId)
        } else if (subCriterion.children && subCriterion.children.length > 0) {
          // Process sub-sub-criteria
          hierarchyData.subSubCriteria[subId]?.ids.forEach((subSubId: string, subSubIndex: number) => {
            const subSubWeight = subSubWeights[subId]?.[subSubIndex] || 0
            globalWeights[subSubId] = mainWeight * subWeight * subSubWeight
            leafCriteria.push(subSubId)
          })
        }
      })
    }
  })

  // Normalize global weights to sum to 1 (important for TOPSIS)
  const totalGlobalWeight = Object.values(globalWeights).reduce((sum, weight) => sum + weight, 0)
  for (const id in globalWeights) {
    globalWeights[id] = globalWeights[id] / totalGlobalWeight
  }

  // Check overall consistency
  const isOverallConsistent =
    mainConsistent &&
    Object.values(subConsistent).every((value) => value) &&
    Object.values(subSubConsistent).every((value) => value)

  return {
    mainWeights,
    mainCR,
    mainConsistent,
    subWeights,
    subCRs,
    subConsistent,
    subSubWeights,
    subSubCRs,
    subSubConsistent,
    globalWeights,
    leafCriteria,
    isOverallConsistent,
  }
}
