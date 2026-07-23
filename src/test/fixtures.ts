import type { AuditResult } from '@/types/audit'

export function createAuditResult(overrides: Partial<AuditResult> = {}): AuditResult {
  const base: AuditResult = {
    taskId: 'task-001',
    status: 'done',
    currentStep: 2,
    progress: 100,
    brandName: '墨兰奶白',
    niceClass: '第43类-餐饮服务',
    goodsServices: '茶饮及餐饮服务',
    riskLevel: 'high',
    riskScore: 88,
    overallResult: '检出高风险冲突，建议正式申请前人工复核。',
    manualReviewRequired: true,
    hitRules: [],
    references: [],
    summary: {
      brandName: '墨兰奶白',
      niceClass: '第43类-餐饮服务',
      riskLevel: 'high',
      riskScore: 88,
      overallResult: '检出高风险冲突，建议正式申请前人工复核。',
    },
    absolute: { hasRisk: true, rejectionProbability: 76, articles: [] },
    relative: { hasRisk: true, conflicts: [], precedents: [] },
    visual: { radarData: [], matchedBrands: [] },
    advice: {
      recommendations: [],
      documentPreview: '',
      applicationDocumentPreview: '',
      powerOfAttorneyPreview: '',
      documentDownloadUrl: '/api/audit/report/task-001/pdf',
    },
    registrationStrategy: {
      targetMarkets: ['越南'],
      hasChinaBase: false,
      recommendedPath: '单国申请',
      reason: '目标市场较少，优先采用单国申请路径。',
      costSaving: '以稳定性优先',
      costComparison: [],
      timeline: [],
      localizedGoodsServices: [],
      risks: [],
    },
  }

  return {
    ...base,
    ...overrides,
    registrationStrategy: overrides.registrationStrategy ?? base.registrationStrategy,
  }
}
