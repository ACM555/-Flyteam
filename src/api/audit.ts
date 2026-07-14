import request from './request'
import type {
  AuditRequest,
  AuditResponse,
  AuditResult,
  HitRule,
  LegalReference,
  StatisticsData,
  UnifiedResponse,
} from '@/types/audit'

export async function audit(data: AuditRequest): Promise<AuditResponse> {
  const serviceDescription = data.goodsServices || data.businessDescription || ''
  const payload = {
    ...data,
    goodsServices: serviceDescription,
    businessDescription: serviceDescription,
  }
  const res = await request.post('/audit', payload)
  return res as unknown as AuditResponse
}

export async function getAuditResult(taskId: string): Promise<AuditResult> {
  const res = (await request.get(`/audit/result/${taskId}`)) as UnifiedResponse<RawAuditResult>
  return normalizeAuditResult(res.data)
}

export async function getStatistics(): Promise<StatisticsData> {
  const res = (await request.get('/statistics')) as UnifiedResponse<StatisticsData>
  return res.data
}

type RawHitRule = Partial<HitRule>

type RawReference = Partial<LegalReference>

type RawSuggestion = {
  priority?: 'P0' | 'P1' | 'P2'
  title?: string
  description?: string
}

type RawAuditResult = Partial<AuditResult> & {
  brandName?: string
  niceClass?: string
  goodsServices?: string
  riskLevel?: 'high' | 'medium' | 'low'
  riskScore?: number
  overallResult?: string
  manualReviewRequired?: boolean
  errorMessage?: string
  hitRules?: RawHitRule[]
  references?: RawReference[]
  suggestions?: RawSuggestion[]
  radarData?: AuditResult['visual']['radarData']
  matchedBrands?: AuditResult['visual']['matchedBrands']
  documentPreview?: string
  registrationStrategy?: AuditResult['registrationStrategy']
}

function buildFallbackRegistrationStrategy(
  goodsServices: string,
  niceClass: string,
): AuditResult['registrationStrategy'] {
  const targetMarkets = ['越南']
  const hasBroadDescription = goodsServices.trim().length <= 12
  return {
    targetMarkets,
    hasChinaBase: false,
    recommendedPath: '单国申请',
    reason: '当前报告未包含跨域策略字段，系统按默认目标市场“越南”生成单国申请建议。目标市场不超过 2 国时，单国申请更直接，便于按当地审查口径快速处理。',
    costSaving: '成本节省不是当前主要目标，重点是越南本地检索、商品/服务描述细化和代理人复核。',
    costComparison: [
      {
        option: '单国申请',
        costLevel: '低-中',
        speed: '较快',
        suitableFor: '目标市场集中在越南或不超过 2 个国家',
        note: '流程直接，适合先完成越南市场落地。',
      },
      {
        option: '马德里体系',
        costLevel: '中',
        speed: '中等',
        suitableFor: '3 个以上目标市场，且已有中国基础商标/申请',
        note: '多国布局通常可节省约 40-60% 的重复申请成本。',
      },
      {
        option: '单国 + 马德里混合',
        costLevel: '中-高',
        speed: '核心市场较快，其余市场统一推进',
        suitableFor: '包含越南、泰国、印尼等核心市场，同时需要多国防御布局',
        note: '核心市场单国优先，其余市场用马德里体系补齐覆盖。',
      },
    ],
    timeline: [
      {
        stage: '提交前检索',
        duration: '1-2 周',
        action: '完成越南市场文字、图形和商品/服务近似检索。',
      },
      {
        stage: '本地化确认',
        duration: '1-2 周',
        action: '由越南代理人确认商品/服务描述和尼斯分类。',
      },
      {
        stage: '单国申请',
        duration: '2-4 周',
        action: '准备并提交越南单国申请材料。',
      },
      {
        stage: '审查跟踪',
        duration: '持续',
        action: '跟踪补正、异议和后续风险变化。',
      },
    ],
    localizedGoodsServices: [
      {
        market: '越南',
        original: goodsServices || '未填写商品/服务描述',
        localized: hasBroadDescription
          ? `${niceClass || '对应类别'}：请将“${goodsServices || '商品/服务'}”细化为具体服务场景、销售渠道、主要品类和目标消费对象。`
          : `${niceClass || '对应类别'}：${goodsServices}。建议补充越南语/英文对应描述，并拆分过宽泛项目。`,
        note: '越南不宜使用过宽泛商品/服务描述，建议按本地可接受注释细化。',
      },
    ],
    risks: ['正式提交前仍需由越南当地代理人复核商品/服务描述和在先权利检索结果。'],
  }
}

function normalizeAuditResult(raw: RawAuditResult | null | undefined): AuditResult {
  const safeRaw = raw ?? {}
  const hitRules = safeRaw.hitRules ?? []
  const references = safeRaw.references ?? []
  const suggestions = safeRaw.suggestions ?? []
  const absoluteRules = hitRules.filter((rule) => rule.ruleType === 'absolute')
  const relativeRules = hitRules.filter((rule) => rule.ruleType === 'relative')
  const trademarkReferences = references.filter((reference) => reference.refType === 'trademark')
  const caseReferences = references.filter((reference) => reference.refType === 'case')
  const brandName = safeRaw.brandName ?? safeRaw.summary?.brandName ?? ''
  const niceClass = safeRaw.niceClass ?? safeRaw.summary?.niceClass ?? ''
  const goodsServices = safeRaw.goodsServices ?? ''
  const riskLevel = safeRaw.riskLevel ?? safeRaw.summary?.riskLevel ?? 'low'
  const riskScore = safeRaw.riskScore ?? safeRaw.summary?.riskScore ?? 0
  const overallResult = safeRaw.overallResult ?? safeRaw.summary?.overallResult ?? ''
  const normalizedHitRules = hitRules.map((rule): HitRule => ({
    ruleId: rule.ruleId,
    ruleName: rule.ruleName,
    ruleType: rule.ruleType ?? 'absolute',
    article: rule.article ?? '未命名法条',
    content: rule.content ?? '',
    applicable: Boolean(rule.applicable),
    similarityType: rule.similarityType ?? '',
    similarityScore: rule.similarityScore ?? 0,
    note: rule.note ?? '',
  }))
  const normalizedReferences = references.map((reference): LegalReference => ({
    refType: reference.refType ?? 'law',
    title: reference.title ?? '未命名依据',
    source: reference.source ?? '',
    date: reference.date ?? '',
    registrationNo: reference.registrationNo ?? '',
    summary: reference.summary ?? '',
    relevance: reference.relevance ?? '',
  }))

  return {
    taskId: safeRaw.taskId ?? '',
    status: safeRaw.status ?? 'pending',
    currentStep: safeRaw.currentStep ?? 0,
    progress: safeRaw.progress ?? 0,
    errorMessage: safeRaw.errorMessage,
    brandName,
    niceClass,
    goodsServices,
    riskLevel,
    riskScore,
    overallResult,
    manualReviewRequired: Boolean(safeRaw.manualReviewRequired),
    hitRules: normalizedHitRules,
    references: normalizedReferences,
    summary: safeRaw.summary ?? {
      brandName,
      niceClass,
      riskLevel,
      riskScore,
      overallResult,
    },
    absolute: safeRaw.absolute ?? {
      hasRisk: absoluteRules.some((rule) => rule.applicable),
      rejectionProbability:
        absoluteRules.find((rule) => rule.applicable)?.similarityScore ??
        Math.max(0, Math.round((safeRaw.riskScore ?? 0) * 0.35)),
      articles: absoluteRules.map((rule) => ({
        article: rule.article ?? '未命名法条',
        content: rule.content ?? '',
        applicable: Boolean(rule.applicable),
        note: rule.note ?? '',
      })),
    },
    relative: safeRaw.relative ?? {
      hasRisk: relativeRules.some((rule) => rule.applicable),
      conflicts: trademarkReferences.map((reference, index) => ({
        brandName: reference.title ?? '未知冲突品牌',
        registeredClass: reference.summary ?? '',
        registrationNo: reference.registrationNo ?? `conflict-${index + 1}`,
        similarityType: relativeRules[index]?.similarityType ?? relativeRules[0]?.similarityType ?? '',
        similarityScore: relativeRules[index]?.similarityScore ?? relativeRules[0]?.similarityScore ?? 0,
      })),
      precedents: caseReferences.map((reference) => ({
        caseName: reference.title ?? '未命名判例',
        court: reference.source ?? '',
        date: reference.date ?? '',
        ruling: reference.summary ?? '',
        relevance: reference.relevance ?? '',
      })),
    },
    visual: safeRaw.visual ?? {
      radarData: safeRaw.radarData ?? [],
      matchedBrands: safeRaw.matchedBrands ?? [],
    },
    advice: safeRaw.advice ?? {
      recommendations: suggestions.map((suggestion) => ({
        priority: suggestion.priority ?? 'P2',
        title: suggestion.title ?? '未命名建议',
        description: suggestion.description ?? '',
      })),
      documentPreview: safeRaw.documentPreview ?? '',
    },
    registrationStrategy:
      safeRaw.registrationStrategy ?? buildFallbackRegistrationStrategy(goodsServices, niceClass),
  }
}
