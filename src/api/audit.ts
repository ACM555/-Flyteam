import request from './request'
import type {
  AuditRequest,
  AuditResponse,
  AuditResult,
  EvidenceItem,
  HitRule,
  LegalReference,
  UnifiedResponse,
} from '@/types/audit'
import { demoAuditResult } from '@/demo/data'
import { getPresentationMode, resolvePresentationRead, resolvePresentationWrite } from '@/demo/runtime'

export async function audit(data: AuditRequest): Promise<AuditResponse> {
  const goodsServices = data.goodsServices || data.businessDescription || ''
  return resolvePresentationWrite(
    async () => (await request.post('/audit', { ...data, goodsServices, businessDescription: goodsServices })) as AuditResponse,
    { code: 0, message: '演示任务已创建', data: { taskId: 'demo-high-risk' } },
  )
}

export async function getAuditResult(taskId: string): Promise<AuditResult> {
  if (getPresentationMode() !== 'live') return structuredClone({ ...demoAuditResult, taskId })
  return resolvePresentationRead(async () => {
    const response = (await request.get(`/audit/result/${taskId}`)) as UnifiedResponse<RawAuditResult>
    return normalizeAuditResult(response.data)
  }, { ...demoAuditResult, taskId })
}

type RawAuditResult = Partial<AuditResult> & {
  suggestions?: AuditResult['advice']['recommendations']
  radarData?: AuditResult['visual']['radarData']
  matchedBrands?: AuditResult['visual']['matchedBrands']
  documentPreview?: string
}

const defaultIntelligence: AuditResult['intelligence'] = {
  crossClassShield: { triggered: false, score: 0, title: '跨类保护扫描', explanation: '等待审查结果。', protectedElements: [], suggestedAction: '完成审查后查看建议。' },
  refusalHistory: { triggered: false, title: '历史风险信号', explanation: '等待审查结果。', redFlags: [], evidence: [] },
  culturalReview: { triggered: false, title: '文化禁忌审查', country: '待确认', rules: [] },
  registrationStrategy: { route: '待生成', rationale: '审查完成后生成推荐路径。', marketCount: 0, timeline: [], costNotes: [] },
  monitoring: [],
}

function displayText(value: unknown, fallback: string) {
  const text = String(value ?? '').trim()
  return /[\p{L}\p{N}]/u.test(text) ? text : fallback
}

function normalizeRule(rule: Partial<HitRule>): HitRule {
  return {
    ruleType: rule.ruleType ?? 'absolute',
    article: displayText(rule.article, '未命名规则'),
    content: displayText(rule.content, '未提供规则说明。'),
    applicable: Boolean(rule.applicable),
    similarityType: rule.similarityType ?? '',
    similarityScore: rule.similarityScore ?? 0,
    note: displayText(rule.note, '暂无补充说明。'),
  }
}

function normalizeReference(reference: Partial<LegalReference>): LegalReference {
  return {
    refType: reference.refType ?? 'law',
    title: displayText(reference.title, '未命名依据'),
    source: displayText(reference.source, '公开数据源'),
    date: reference.date ?? '',
    registrationNo: reference.registrationNo ?? '',
    summary: displayText(reference.summary, '该来源用于支持本次风险判断。'),
    relevance: reference.relevance ?? '',
    sourceUrl: reference.sourceUrl,
    retrievedAt: reference.retrievedAt,
  }
}

function normalizeEvidence(item: Partial<EvidenceItem>): EvidenceItem {
  const basis = item.basis === 'rule' || item.basis === 'heuristic' ? item.basis : 'evidence'
  return {
    title: displayText(item.title, '审查依据'),
    summary: displayText(item.summary, '该依据用于支持本次风险判断。'),
    basis,
    source: displayText(item.source, '公开数据源'),
    retrievedAt: item.retrievedAt ?? '',
    sourceUrl: item.sourceUrl,
  }
}

function normalizeAuditResult(raw: RawAuditResult | null | undefined): AuditResult {
  const value = raw ?? {}
  const hitRules = (value.hitRules ?? []).map(normalizeRule)
  const references = (value.references ?? []).map(normalizeReference)
  const brandName = displayText(value.brandName ?? value.summary?.brandName, '品牌信息待补充')
  const niceClass = displayText(value.niceClass ?? value.summary?.niceClass, '类别待补充')
  const riskLevel = value.riskLevel ?? value.summary?.riskLevel ?? 'low'
  const riskScore = value.riskScore ?? value.summary?.riskScore ?? 0
  const overallResult = displayText(value.overallResult ?? value.summary?.overallResult, '审查结论待生成。')
  const absoluteRules = hitRules.filter((item) => item.ruleType === 'absolute')
  const relativeRules = hitRules.filter((item) => item.ruleType === 'relative')

  return {
    taskId: value.taskId ?? '', status: value.status ?? 'pending', currentStep: value.currentStep ?? 0, progress: value.progress ?? 0,
    errorMessage: value.errorMessage, brandName, niceClass, goodsServices: displayText(value.goodsServices, '商品或服务描述待补充'),
    riskLevel, riskScore, overallResult, manualReviewRequired: Boolean(value.manualReviewRequired), generatedAt: value.generatedAt ?? value.summary?.submitTime,
    hitRules, references, evidence: (value.evidence ?? []).map(normalizeEvidence),
    summary: { brandName, niceClass, riskLevel, riskScore, overallResult },
    absolute: value.absolute ?? { hasRisk: absoluteRules.some((item) => item.applicable), rejectionProbability: Math.round(riskScore * 0.35), articles: absoluteRules.map(({ article, content, applicable, note }) => ({ article, content, applicable, note })) },
    relative: value.relative ?? { hasRisk: relativeRules.some((item) => item.applicable), conflicts: [], precedents: [] },
    visual: value.visual ?? { radarData: value.radarData ?? [], matchedBrands: value.matchedBrands ?? [] },
    intelligence: value.intelligence ?? defaultIntelligence,
    advice: value.advice ?? { recommendations: value.suggestions ?? [], documentPreview: value.documentPreview ?? '' },
  }
}
