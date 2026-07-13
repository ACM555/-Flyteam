export interface AuditRequest {
  brandName: string
  englishName: string
  niceClass: string
  goodsServices: string
  businessDescription?: string
  logo: string
}

export type AuditFormData = AuditRequest

export interface AuditResponse {
  code: number
  message: string
  data: {
    taskId: string
  }
}

export interface HitRule {
  ruleType: 'absolute' | 'relative'
  article: string
  content: string
  applicable: boolean
  similarityType: string
  similarityScore: number
  note: string
}

export interface LegalReference {
  refType: 'law' | 'case' | 'trademark'
  title: string
  source: string
  date: string
  registrationNo: string
  summary: string
  relevance: string
}

export interface AuditResult {
  taskId: string
  status: 'pending' | 'processing' | 'done' | 'error'
  currentStep: number
  progress: number
  errorMessage?: string
  brandName: string
  niceClass: string
  goodsServices: string
  riskLevel: 'high' | 'medium' | 'low'
  riskScore: number
  overallResult: string
  manualReviewRequired: boolean
  hitRules: HitRule[]
  references: LegalReference[]
  summary: {
    brandName: string
    niceClass: string
    riskLevel: 'high' | 'medium' | 'low'
    riskScore: number
    overallResult: string
  }
  absolute: {
    hasRisk: boolean
    rejectionProbability: number
    articles: Array<{
      article: string
      content: string
      applicable: boolean
      note: string
    }>
  }
  relative: {
    hasRisk: boolean
    conflicts: Array<{
      brandName: string
      registeredClass: string
      registrationNo: string
      similarityType: string
      similarityScore: number
    }>
    precedents: Array<{
      caseName: string
      court: string
      date: string
      ruling: string
      relevance: string
    }>
  }
  visual: {
    radarData: Array<{
      dimension: string
      target: number
      benchmark: number
    }>
    matchedBrands: Array<{
      name: string
      thumbnailUrl: string
      matchScore: number
    }>
  }
  advice: {
    recommendations: Array<{
      priority: 'P0' | 'P1' | 'P2'
      title: string
      description: string
    }>
    documentPreview: string
    documentDownloadUrl?: string
  }
}

export interface UnifiedResponse<T> {
  code: number
  message: string
  data: T
}
