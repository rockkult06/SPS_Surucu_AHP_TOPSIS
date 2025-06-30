export type CriterionId =
  | "admin"
  | "technical"
  | "attendance"
  | "overtime"
  | "accident"
  | "discipline"
  | "acceleration"
  | "speed"
  | "engine"
  | "idle"
  | "normal_overtime"
  | "weekend_overtime"
  | "holiday_overtime"
  | "fatal_accident"
  | "injury_accident"
  | "material_damage_accident"
  | "first_degree_dismissal"
  | "second_degree_dismissal"
  | "third_degree_dismissal"
  | "fourth_degree_dismissal"

export interface Criterion {
  id: CriterionId
  name: string
  level: number
  parentId: CriterionId | null
  children?: CriterionId[]
  isLeaf: boolean
  isBenefit?: boolean // true for benefit, false for cost
  description?: string
}

export const criteriaHierarchy: Record<CriterionId, Criterion> = {
  // Level 1: Main Criteria
  admin: {
    id: "admin",
    name: "İdari Değerlendirme",
    level: 1,
    parentId: null,
    children: ["attendance", "overtime", "accident", "discipline"],
    isLeaf: false,
    description: "Sürücünün idari kayıtlarına dayalı genel değerlendirme.",
  },
  technical: {
    id: "technical",
    name: "Teknik Değerlendirme",
    level: 1,
    parentId: null,
    children: ["acceleration", "speed", "engine", "idle"],
    isLeaf: false,
    description: "Sürücünün araç kullanımına ve teknik performansına dayalı değerlendirme.",
  },

  // Level 2: Sub-Criteria
  attendance: {
    id: "attendance",
    name: "Sağlık Sebebiyle Devamsızlık Durumu",
    level: 2,
    parentId: "admin",
    isLeaf: true,
    isBenefit: false, // Higher absence is worse
    description: "Sürücünün sağlık nedeniyle işe devamsızlık durumu. Yüksek değerler olumsuz etki eder.",
  },
  overtime: {
    id: "overtime",
    name: "Fazla Mesai",
    level: 2,
    parentId: "admin",
    children: ["normal_overtime", "weekend_overtime", "holiday_overtime"],
    isLeaf: false,
    description: "Sürücünün yaptığı fazla mesai miktarı. Yüksek değerler olumlu etki eder.",
  },
  accident: {
    id: "accident",
    name: "Kaza Durumu",
    level: 2,
    parentId: "admin",
    children: ["fatal_accident", "injury_accident", "material_damage_accident"],
    isLeaf: false,
    description: "Sürücünün karıştığı kaza türleri ve sayıları. Yüksek değerler olumsuz etki eder.",
  },
  discipline: {
    id: "discipline",
    name: "Disiplin İhlalleri",
    level: 2,
    parentId: "admin",
    children: [
      "first_degree_dismissal",
      "second_degree_dismissal",
      "third_degree_dismissal",
      "fourth_degree_dismissal",
    ],
    isLeaf: false,
    description: "Sürücünün disiplin ihlalleri ve aldığı cezalar. Yüksek değerler olumsuz etki eder.",
  },
  acceleration: {
    id: "acceleration",
    name: "Hatalı Hızlanma Sayısı",
    level: 2,
    parentId: "technical",
    isLeaf: true,
    isBenefit: false, // Higher acceleration is worse
    description: "Ani ve hatalı hızlanma sayısı. Yüksek değerler olumsuz etki eder.",
  },
  speed: {
    id: "speed",
    name: "Hız İhlal Sayısı",
    level: 2,
    parentId: "technical",
    isLeaf: true,
    isBenefit: false, // Higher speed violations are worse
    description: "Hız limitlerini aşma sayısı. Yüksek değerler olumsuz etki eder.",
  },
  engine: {
    id: "engine",
    name: "Motor (Kırmızı Lamba) Uyarısı",
    level: 2,
    parentId: "technical",
    isLeaf: true,
    isBenefit: false, // Higher engine warnings are worse
    description: "Motor kırmızı lamba uyarılarının sayısı. Yüksek değerler olumsuz etki eder.",
  },
  idle: {
    id: "idle",
    name: "Rölanti İhlal Sayısı",
    level: 2,
    parentId: "technical",
    isLeaf: true,
    isBenefit: false, // Higher idle violations are worse
    description: "Rölantide bekleme ihlal sayısı. Yüksek değerler olumsuz etki eder.",
  },

  // Level 3: Sub-Sub-Criteria (under Overtime)
  normal_overtime: {
    id: "normal_overtime",
    name: "Normal Fazla Mesai",
    level: 3,
    parentId: "overtime",
    isLeaf: true,
    isBenefit: true, // Higher normal overtime is better (more work done)
    description: "Normal çalışma günlerinde yapılan fazla mesai. Yüksek değerler olumlu etki eder.",
  },
  weekend_overtime: {
    id: "weekend_overtime",
    name: "Hafta Tatili Mesaisi",
    level: 3,
    parentId: "overtime",
    isLeaf: true,
    isBenefit: true, // Higher weekend overtime is better
    description: "Hafta sonu tatillerinde yapılan fazla mesai. Yüksek değerler olumlu etki eder.",
  },
  holiday_overtime: {
    id: "holiday_overtime",
    name: "Resmi Tatil Mesaisi",
    level: 3,
    parentId: "overtime",
    isLeaf: true,
    isBenefit: true, // Higher holiday overtime is better
    description: "Resmi tatillerde yapılan fazla mesai. Yüksek değerler olumlu etki eder.",
  },

  // Level 3: Sub-Sub-Criteria (under Accident)
  fatal_accident: {
    id: "fatal_accident",
    name: "Ölümle Sonuçlanan Kaza",
    level: 3,
    parentId: "accident",
    isLeaf: true,
    isBenefit: false, // Higher fatal accidents are worse
    description: "Ölümle sonuçlanan kaza sayısı. En ciddi olumsuz etki.",
  },
  injury_accident: {
    id: "injury_accident",
    name: "Yaralanmalı Kaza",
    level: 3,
    parentId: "accident",
    isLeaf: true,
    isBenefit: false, // Higher injury accidents are worse
    description: "Yaralanmalı kaza sayısı. Ciddi olumsuz etki.",
  },
  material_damage_accident: {
    id: "material_damage_accident",
    name: "Maddi Hasarlı Kaza",
    level: 3,
    parentId: "accident",
    isLeaf: true,
    isBenefit: false, // Higher material damage accidents are worse
    description: "Maddi hasarlı kaza sayısı. Olumsuz etki.",
  },

  // Level 3: Sub-Sub-Criteria (under Discipline - Sevk Sayısı Kilometreye Oranı)
  first_degree_dismissal: {
    id: "first_degree_dismissal",
    name: "1'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
    level: 3,
    parentId: "discipline",
    isLeaf: true,
    isBenefit: false, // Higher violations are worse
    description: "1. derece disiplin ihlallerinden sevk sayısı. Yüksek değerler olumsuz etki eder.",
  },
  second_degree_dismissal: {
    id: "second_degree_dismissal",
    name: "2'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
    level: 3,
    parentId: "discipline",
    isLeaf: true,
    isBenefit: false, // Higher violations are worse
    description: "2. derece disiplin ihlallerinden sevk sayısı. Yüksek değerler olumsuz etki eder.",
  },
  third_degree_dismissal: {
    id: "third_degree_dismissal",
    name: "3'ncü Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
    level: 3,
    parentId: "discipline",
    isLeaf: true,
    isBenefit: false, // Higher violations are worse
    description: "3. derece disiplin ihlallerinden sevk sayısı. Yüksek değerler olumsuz etki eder.",
  },
  fourth_degree_dismissal: {
    id: "fourth_degree_dismissal",
    name: "4'ncü Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
    level: 3,
    parentId: "discipline",
    isLeaf: true,
    isBenefit: false, // Higher violations are worse
    description: "4. derece disiplin ihlallerinden sevk sayısı. Yüksek değerler olumsuz etki eder.",
  },
}

export const getCriteriaDescriptions = (): Record<string, string> => {
  const descriptions: Record<string, string> = {}
  for (const id in criteriaHierarchy) {
    descriptions[id] = criteriaHierarchy[id as CriterionId].description || ""
  }
  return descriptions
}

export const getCriteriaAtLevel = (level: number): Criterion[] => {
  return Object.values(criteriaHierarchy).filter((criterion) => criterion.level === level)
}

export const getLeafCriteria = (): Criterion[] => {
  return Object.values(criteriaHierarchy).filter((criterion) => criterion.isLeaf)
}

export const getCriteriaByIds = (ids: string[]): Criterion[] => {
  return ids.map((id) => criteriaHierarchy[id as CriterionId]).filter(Boolean) as Criterion[]
}

export const getCriteriaNames = (ids: string[]): string[] => {
  return ids.map((id) => criteriaHierarchy[id as CriterionId]?.name || id)
}

export const getCriteriaBenefitType = (id: string): boolean | undefined => {
  return criteriaHierarchy[id as CriterionId]?.isBenefit
}

// Helper function to get all criteria names (for TOPSIS page)
export const getAllCriteriaNames = (): string[] => {
  return getLeafCriteria().map((c) => c.name)
}

// Helper function to get all criteria mapping (name to ID)
export const getAllCriteriaMapping = (): Record<string, string> => {
  const mapping: Record<string, string> = {}
  Object.values(criteriaHierarchy).forEach((criterion) => {
    mapping[criterion.name] = criterion.id
  })
  return mapping
}

// Helper function to get default weights (for testing/fallback)
export const getDefaultWeights = (): Record<string, number> => {
  const defaultWeights: Record<string, number> = {}
  const leafCriteria = getLeafCriteria()
  const equalWeight = 1 / leafCriteria.length
  leafCriteria.forEach((criterion) => {
    defaultWeights[criterion.id] = equalWeight
  })
  return defaultWeights
}

// Helper function to get Excel column mappings (Excel header to criterion ID)
export const getExcelColumnMappings = (): Record<string, string> => {
  return {
    SicilNo: "driverId",
    "Sefer Sayısı": "tripCount",
    "Yapılan Kilometre": "distance",
    "Sağlık Sebebiyle Devamsızlık Durumu": "attendance",
    "Normal Fazla Mesai": "normal_overtime",
    "Hafta Tatili Mesaisi": "weekend_overtime",
    "Resmi Tatil Mesaisi": "holiday_overtime",
    "Ölümle Sonuçlanan Kaza": "fatal_accident",
    "Yaralanmalı Kaza": "injury_accident",
    "Maddi Hasarlı Kaza": "material_damage_accident",
    "1. Derece İhlal": "first_degree_dismissal", // Old name, keep for compatibility
    "2. Derece İhlal": "second_degree_dismissal", // Old name, keep for compatibility
    "3. Derece İhlal": "third_degree_dismissal", // Old name, keep for compatibility
    "4. Derece İhlal": "fourth_degree_dismissal", // Old name, keep for compatibility
    "1'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı": "first_degree_dismissal",
    "2'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı": "second_degree_dismissal",
    "3'ncü Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı": "third_degree_dismissal",
    "4'ncü Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı": "fourth_degree_dismissal",
    "Hatalı Hızlanma Sayısı": "acceleration",
    "Hız İhlal Sayısı": "speed",
    "Motor (KırmızıLamba) Uyarısı": "engine",
    "Rölanti İhlal Sayısı": "idle",
  }
}

// Helper function to get criteria effect types (true for negative/cost, false for positive/benefit)
export const getCriteriaEffectTypes = (): Record<string, boolean> => {
  const effectTypes: Record<string, boolean> = {}
  getLeafCriteria().forEach((criterion) => {
    effectTypes[criterion.id] = criterion.isBenefit === false // If isBenefit is false, it's a cost (negative effect)
  })
  return effectTypes
}

export const getCriteriaPath = (criterionId: CriterionId): CriterionId[] => {
  const path: CriterionId[] = []
  let currentId: CriterionId | null = criterionId

  while (currentId) {
    path.unshift(currentId) // Add to the beginning of the array
    let foundParent = false
    for (const parentId in criteriaHierarchy) {
      const parent = criteriaHierarchy[parentId as CriterionId]
      if (parent.children && parent.children.includes(currentId)) {
        currentId = parent.id
        foundParent = true
        break
      }
    }
    if (!foundParent) {
      currentId = null // No parent found, stop
    }
  }
  return path
}

// Function to initialize hierarchy data for comparison page
export const initializeHierarchyData = () => {
  const mainCriteria = getCriteriaAtLevel(1)
  const subCriteria: Record<string, { ids: string[]; names: string[]; matrix: number[][] }> = {}
  const subSubCriteria: Record<string, { ids: string[]; names: string[]; matrix: number[][] }> = {}
  const subSubSubCriteria: Record<string, { ids: string[]; names: string[]; matrix: number[][] }> = {}

  mainCriteria.forEach((main) => {
    const children = main.children || []
    if (children.length > 0) {
      const childCriteria = children.map((id) => criteriaHierarchy[id]).filter(Boolean) as Criterion[]
      subCriteria[main.id] = {
        ids: childCriteria.map((c) => c.id),
        names: childCriteria.map((c) => c.name),
        matrix: Array(childCriteria.length)
          .fill(0)
          .map(() => Array(childCriteria.length).fill(0)),
      }
      for (let i = 0; i < childCriteria.length; i++) {
        subCriteria[main.id].matrix[i][i] = 1
      }

      childCriteria.forEach((sub) => {
        const grandChildren = sub.children || []
        if (grandChildren.length > 0) {
          const grandChildCriteria = grandChildren.map((id) => criteriaHierarchy[id]).filter(Boolean) as Criterion[]
          if (sub.level === 2) {
            subSubCriteria[sub.id] = {
              ids: grandChildCriteria.map((c) => c.id),
              names: grandChildCriteria.map((c) => c.name),
              matrix: Array(grandChildCriteria.length)
                .fill(0)
                .map(() => Array(grandChildCriteria.length).fill(0)),
            }
            for (let i = 0; i < grandChildCriteria.length; i++) {
              subSubCriteria[sub.id].matrix[i][i] = 1
            }
          } else if (sub.level === 3) {
            subSubSubCriteria[sub.id] = {
              ids: grandChildCriteria.map((c) => c.id),
              names: grandChildCriteria.map((c) => c.name),
              matrix: Array(grandChildCriteria.length)
                .fill(0)
                .map(() => Array(grandChildCriteria.length).fill(0)),
            }
            for (let i = 0; i < grandChildCriteria.length; i++) {
              subSubSubCriteria[sub.id].matrix[i][i] = 1
            }
          }
        }
      })
    }
  })

  const mainMatrixSize = mainCriteria.length
  const mainMatrix = Array(mainMatrixSize)
    .fill(0)
    .map(() => Array(mainMatrixSize).fill(0))
  for (let i = 0; i < mainMatrixSize; i++) {
    mainMatrix[i][i] = 1
  }

  return {
    mainCriteria: {
      ids: mainCriteria.map((c) => c.id),
      names: mainCriteria.map((c) => c.name),
      matrix: mainMatrix,
    },
    subCriteria,
    subSubCriteria,
    subSubSubCriteria,
    criteriaMap: criteriaHierarchy,
  }
}
