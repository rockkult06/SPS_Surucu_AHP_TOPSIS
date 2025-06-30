// lib/topsis.ts

import { getLeafCriteria, getCriteriaBenefitType, type CriterionId, criteriaHierarchy } from "./criteria-hierarchy"

export interface DriverPerformance {
  driverId: string
  [criterionId: string]: number | string // Criterion values
}

export interface TOPSISResult {
  driverId: string
  normalizedPerformance: Record<string, number>
  weightedNormalizedPerformance: Record<string, number>
  idealPositive: Record<string, number>
  idealNegative: Record<string, number>
  distanceToPositive: number
  distanceToNegative: number
  closenessCoefficient: number
  rank: number
}

/**
 * Calculates the TOPSIS ranking for drivers based on their performance data and AHP weights.
 * @param driversData Array of driver performance objects.
 * @param ahpLeafWeights Object containing AHP calculated weights for each leaf criterion.
 * @returns An array of TOPSIS results, including ranks.
 */
export function calculateTOPSIS(
  driversData: DriverPerformance[],
  ahpLeafWeights: Record<string, number>,
): TOPSISResult[] {
  if (!driversData || driversData.length === 0) {
    return []
  }

  const leafCriteria = getLeafCriteria()
  const criterionIds = leafCriteria.map((c) => c.id)

  // 1. Normalize the decision matrix
  const normalizedMatrix: Record<string, Record<string, number>> = {}
  const columnSumsOfSquares: Record<string, number> = {}

  // Calculate sum of squares for each criterion column
  for (const criterionId of criterionIds) {
    columnSumsOfSquares[criterionId] = driversData.reduce((sum, driver) => {
      const value = typeof driver[criterionId] === "number" ? (driver[criterionId] as number) : 0
      return sum + value * value
    }, 0)
  }

  // Normalize each value
  for (const driver of driversData) {
    normalizedMatrix[driver.driverId] = {}
    for (const criterionId of criterionIds) {
      const value = typeof driver[criterionId] === "number" ? (driver[criterionId] as number) : 0
      const divisor = Math.sqrt(columnSumsOfSquares[criterionId])
      normalizedMatrix[driver.driverId][criterionId] = divisor === 0 ? 0 : value / divisor
    }
  }

  // 2. Calculate the weighted normalized decision matrix
  const weightedNormalizedMatrix: Record<string, Record<string, number>> = {}
  for (const driverId in normalizedMatrix) {
    weightedNormalizedMatrix[driverId] = {}
    for (const criterionId of criterionIds) {
      weightedNormalizedMatrix[driverId][criterionId] =
        normalizedMatrix[driverId][criterionId] * (ahpLeafWeights[criterionId] || 0)
    }
  }

  // 3. Determine the Ideal Positive (A+) and Ideal Negative (A-) solutions
  const idealPositive: Record<string, number> = {}
  const idealNegative: Record<string, number> = {}

  for (const criterionId of criterionIds) {
    const isBenefit = getCriteriaBenefitType(criterionId) // true for benefit, false for cost
    const values = driversData.map((driver) => weightedNormalizedMatrix[driver.driverId][criterionId])

    if (values.length > 0) {
      idealPositive[criterionId] = isBenefit ? Math.max(...values) : Math.min(...values)
      idealNegative[criterionId] = isBenefit ? Math.min(...values) : Math.max(...values)
    } else {
      idealPositive[criterionId] = 0
      idealNegative[criterionId] = 0
    }
  }

  // 4. Calculate the separation measures (distance to A+ and A-)
  const results: TOPSISResult[] = []

  for (const driver of driversData) {
    const driverId = driver.driverId
    let distanceToPositive = 0
    let distanceToNegative = 0

    for (const criterionId of criterionIds) {
      const weightedValue = weightedNormalizedMatrix[driverId][criterionId]
      distanceToPositive += Math.pow(weightedValue - idealPositive[criterionId], 2)
      distanceToNegative += Math.pow(weightedValue - idealNegative[criterionId], 2)
    }

    distanceToPositive = Math.sqrt(distanceToPositive)
    distanceToNegative = Math.sqrt(distanceToNegative)

    // 5. Calculate the relative closeness to the ideal solution (C*)
    const closenessCoefficient =
      distanceToPositive + distanceToNegative === 0 ? 0 : distanceToNegative / (distanceToPositive + distanceToNegative)

    results.push({
      driverId,
      normalizedPerformance: normalizedMatrix[driverId],
      weightedNormalizedPerformance: weightedNormalizedMatrix[driverId],
      idealPositive,
      idealNegative,
      distanceToPositive,
      distanceToNegative,
      closenessCoefficient,
      rank: 0, // Will be set after sorting
    })
  }

  // Sort results by closeness coefficient in descending order to determine rank
  results.sort((a, b) => b.closenessCoefficient - a.closenessCoefficient)

  // Assign ranks
  results.forEach((result, index) => {
    result.rank = index + 1
  })

  return results
}

export interface HierarchicalTOPSISResult {
  driverId: string
  closenessCoefficient: number
  rank: number
  mainCriterionScores: Record<CriterionId, number> // Scores for each main criterion
  overallScore: number
}

/**
 * Calculates Hierarchical TOPSIS.
 * This function assumes that `ahpGlobalWeights` already contains the final, combined weights
 * for all leaf criteria, derived from the AHP hierarchy.
 *
 * @param driversData Array of driver performance objects.
 * @param ahpGlobalWeights Object containing the global AHP weights for all leaf criteria.
 * @returns An array of Hierarchical TOPSIS results, including ranks.
 */
export function calculateHierarchicalTOPSIS(
  driversData: DriverPerformance[],
  ahpGlobalWeights: Record<string, number>,
): HierarchicalTOPSISResult[] {
  if (!driversData || driversData.length === 0) {
    return []
  }

  const leafCriteria = getLeafCriteria()
  const leafCriterionIds = leafCriteria.map((c) => c.id)

  // Filter ahpGlobalWeights to only include leaf criteria that are present in the driversData
  const relevantAhpWeights: Record<string, number> = {}
  for (const id of leafCriterionIds) {
    if (ahpGlobalWeights[id] !== undefined) {
      relevantAhpWeights[id] = ahpGlobalWeights[id]
    }
  }

  // Ensure weights sum to 1 for relevant criteria, if not already normalized
  const sumRelevantWeights = Object.values(relevantAhpWeights).reduce((sum, w) => sum + w, 0)
  const normalizedRelevantWeights: Record<string, number> = {}
  if (sumRelevantWeights > 0) {
    for (const id in relevantAhpWeights) {
      normalizedRelevantWeights[id] = relevantAhpWeights[id] / sumRelevantWeights
    }
  } else {
    // Fallback to equal weights if no relevant weights or sum is zero
    const equalWeight = 1 / leafCriterionIds.length
    for (const id of leafCriterionIds) {
      normalizedRelevantWeights[id] = equalWeight
    }
  }

  // 1. Normalize the decision matrix (using vector normalization)
  const normalizedMatrix: Record<string, Record<string, number>> = {}
  const columnSumsOfSquares: Record<string, number> = {}

  for (const criterionId of leafCriterionIds) {
    columnSumsOfSquares[criterionId] = driversData.reduce((sum, driver) => {
      const value = typeof driver[criterionId] === "number" ? (driver[criterionId] as number) : 0
      return sum + value * value
    }, 0)
  }

  for (const driver of driversData) {
    normalizedMatrix[driver.driverId] = {}
    for (const criterionId of leafCriterionIds) {
      const value = typeof driver[criterionId] === "number" ? (driver[criterionId] as number) : 0
      const divisor = Math.sqrt(columnSumsOfSquares[criterionId])
      normalizedMatrix[driver.driverId][criterionId] = divisor === 0 ? 0 : value / divisor
    }
  }

  // 2. Calculate the weighted normalized decision matrix
  const weightedNormalizedMatrix: Record<string, Record<string, number>> = {}
  for (const driverId in normalizedMatrix) {
    weightedNormalizedMatrix[driverId] = {}
    for (const criterionId of leafCriterionIds) {
      weightedNormalizedMatrix[driverId][criterionId] =
        normalizedMatrix[driverId][criterionId] * (normalizedRelevantWeights[criterionId] || 0)
    }
  }

  // 3. Determine the Ideal Positive (A+) and Ideal Negative (A-) solutions
  const idealPositive: Record<string, number> = {}
  const idealNegative: Record<string, number> = {}

  for (const criterionId of leafCriterionIds) {
    const isBenefit = getCriteriaBenefitType(criterionId) // true for benefit, false for cost
    const values = driversData.map((driver) => weightedNormalizedMatrix[driver.driverId][criterionId])

    if (values.length > 0) {
      idealPositive[criterionId] = isBenefit ? Math.max(...values) : Math.min(...values)
      idealNegative[criterionId] = isBenefit ? Math.min(...values) : Math.max(...values)
    } else {
      idealPositive[criterionId] = 0
      idealNegative[criterionId] = 0
    }
  }

  // 4. Calculate the separation measures (distance to A+ and A-) and closeness coefficient
  const results: HierarchicalTOPSISResult[] = []

  for (const driver of driversData) {
    const driverId = driver.driverId
    let distanceToPositive = 0
    let distanceToNegative = 0
    const mainCriterionScores: Record<CriterionId, number> = {}

    // Calculate scores for each main criterion based on its leaf children
    const mainCriteria = Object.values(criteriaHierarchy).filter((c) => c.level === 1)
    for (const mainCriterion of mainCriteria) {
      let mainCriterionPositiveDistance = 0
      let mainCriterionNegativeDistance = 0
      const childrenLeafIds = mainCriterion.children?.filter((childId) => criteriaHierarchy[childId]?.isLeaf) || []

      for (const leafId of childrenLeafIds) {
        const weightedValue = weightedNormalizedMatrix[driverId][leafId]
        mainCriterionPositiveDistance += Math.pow(weightedValue - idealPositive[leafId], 2)
        mainCriterionNegativeDistance += Math.pow(weightedValue - idealNegative[leafId], 2)
      }

      mainCriterionPositiveDistance = Math.sqrt(mainCriterionPositiveDistance)
      mainCriterionNegativeDistance = Math.sqrt(mainCriterionNegativeDistance)

      const mainClosenessCoefficient =
        mainCriterionPositiveDistance + mainCriterionNegativeDistance === 0
          ? 0
          : mainCriterionNegativeDistance / (mainCriterionPositiveDistance + mainCriterionNegativeDistance)

      mainCriterionScores[mainCriterion.id] = mainClosenessCoefficient
    }

    // Calculate overall distances for the final closeness coefficient
    for (const criterionId of leafCriterionIds) {
      const weightedValue = weightedNormalizedMatrix[driverId][criterionId]
      distanceToPositive += Math.pow(weightedValue - idealPositive[criterionId], 2)
      distanceToNegative += Math.pow(weightedValue - idealNegative[criterionId], 2)
    }

    distanceToPositive = Math.sqrt(distanceToPositive)
    distanceToNegative = Math.sqrt(distanceToNegative)

    const closenessCoefficient =
      distanceToPositive + distanceToNegative === 0 ? 0 : distanceToNegative / (distanceToPositive + distanceToNegative)

    results.push({
      driverId,
      closenessCoefficient,
      rank: 0, // Will be set after sorting
      mainCriterionScores,
      overallScore: closenessCoefficient, // Use closenessCoefficient as overall score
    })
  }

  // Sort results by closeness coefficient in descending order to determine rank
  results.sort((a, b) => b.closenessCoefficient - a.closenessCoefficient)

  // Assign ranks
  results.forEach((result, index) => {
    result.rank = index + 1
  })

  return results
}
