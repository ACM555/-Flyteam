import type { AdminStatistics, AdminTask, AdminTaskDetail } from '@/api/admin'
import type { CountryRule, PlatformOverview } from '@/api/platform'
import type { BrandAsset, DataSourceStatus, MonitoringAlert, ReportRecord } from '@/api/saas'
import type { AuditResult } from '@/types/audit'

export const demoOverview: PlatformOverview = {
  positioning: '面向中国企业进入东盟市场的商标合规与品牌风险管理平台',
  slogan: '注册前预检、注册中导航、注册后持续监控',
  healthScore: 92,
  riskTrend: [
    { date: '07-14', high: 5, medium: 12, low: 28 }, { date: '07-15', high: 4, medium: 15, low: 31 },
    { date: '07-16', high: 7, medium: 13, low: 34 }, { date: '07-17', high: 6, medium: 17, low: 38 },
    { date: '07-18', high: 8, medium: 14, low: 42 }, { date: '07-19', high: 5, medium: 18, low: 47 },
    { date: '07-20', high: 4, medium: 16, low: 53 },
  ],
  modules: [
    { key: 'M1', name: '商标注册预检', status: 'online', coverage: 96, features: ['文字近似', '图形近似', '绝对理由'], output: '风险清单' },
    { key: 'M2', name: '跨类保护分析', status: 'online', coverage: 91, features: ['驰名商标', '关联类别', '混淆概率'], output: '保护策略' },
    { key: 'M3', name: '文化语义审查', status: 'online', coverage: 88, features: ['禁忌语义', '公共秩序', '本地表达'], output: '本地化建议' },
    { key: 'M4', name: '注册路径规划', status: 'online', coverage: 94, features: ['单国申请', '马德里体系', '成本周期'], output: '申请路线图' },
    { key: 'M5', name: '公告期监控', status: 'online', coverage: 93, features: ['异议窗口', '抢注信号', '责任分派'], output: '预警工单' },
    { key: 'M6', name: '证据报告生成', status: 'online', coverage: 98, features: ['证据链', '法律依据', 'PDF 归档'], output: '审查报告' },
  ],
  dataSources: ['越南国家知识产权局（NOIP）', '世界知识产权组织（WIPO）', '欧盟商标检索系统（TMview）', '东盟本地规则库'],
  sla: [
    { name: '文字检索', target: '3 分钟内', status: '达标' },
    { name: '图形分析', target: '5 分钟内', status: '达标' },
    { name: '报告生成', target: '8 分钟内', status: '达标' },
  ],
  businessModel: [],
}

export const demoAssets: BrandAsset[] = [
  { brandId: 'BR-2401', name: '墨兰奶白', englishName: 'Molan Milk White', owner: '广州墨兰餐饮管理有限公司', niceClasses: ['第 30 类', '第 43 类'], targetCountries: ['越南', '泰国'], portfolioStatus: '待改稿', riskLevel: 'high', riskScore: 87, lastAuditAt: '2026-07-20 16:42', nextAction: '移除四叶花饰并完成替代图样检索' },
  { brandId: 'BR-2402', name: '木兰茶序', englishName: 'Moc Lan', owner: '杭州木兰饮品有限公司', niceClasses: ['第 25 类', '第 35 类'], targetCountries: ['越南', '马来西亚'], portfolioStatus: '可提交', riskLevel: 'low', riskScore: 18, lastAuditAt: '2026-07-19 11:20', nextAction: '补充英文主体证明后进入申请' },
  { brandId: 'BR-2403', name: '蓝莲供应链', englishName: 'Blue Lotus Supply', owner: '深圳蓝莲供应链有限公司', niceClasses: ['第 39 类', '第 42 类'], targetCountries: ['泰国', '印度尼西亚', '菲律宾'], portfolioStatus: '人工复核', riskLevel: 'medium', riskScore: 56, lastAuditAt: '2026-07-18 09:15', nextAction: '确认莲花图形是否构成宗教敏感表达' },
  { brandId: 'BR-2404', name: '云杉出海', englishName: 'SpruceGo', owner: '上海云杉科技有限公司', niceClasses: ['第 9 类', '第 42 类'], targetCountries: ['新加坡', '越南'], portfolioStatus: '监控中', riskLevel: 'low', riskScore: 22, lastAuditAt: '2026-07-17 18:05', nextAction: '持续监控公告期近似申请' },
]

export const demoAlerts: MonitoringAlert[] = [
  { alertId: 'AL-7001', title: '越南公告期发现近似“MO LAN”餐饮服务申请', severity: 'high', country: '越南', brandName: '墨兰奶白', source: 'NOIP 公告', window: '剩余 23 天', status: '需处理', owner: '法务负责人', createdAt: '2026-07-20 09:30', recommendation: '准备异议材料，重点说明在先使用及消费者混淆可能。' },
  { alertId: 'AL-7002', title: '印度尼西亚食品饮料规则新增宗教敏感词提示', severity: 'medium', country: '印度尼西亚', brandName: '蓝莲供应链', source: '本地法规', window: '规则更新', status: '跟进中', owner: '区域代理人', createdAt: '2026-07-18 14:05', recommendation: '涉及食品类别延伸申请时增加人工语境复核。' },
  { alertId: 'AL-7003', title: '新加坡第 42 类近似英文组合进入低风险观察', severity: 'low', country: '新加坡', brandName: '云杉出海', source: 'IPOS 检索', window: '持续监控', status: '观察', owner: '系统自动', createdAt: '2026-07-16 18:42', recommendation: '保持周报推送，当前无需立即发起异议。' },
]

export const demoSources: DataSourceStatus[] = [
  { name: '越南国家知识产权局', type: 'NOIP 公告与注册数据', status: 'online', coverage: 96, freshness: '15 分钟前', lastSync: '2026-07-20 10:15', note: '注册、公告、异议窗口同步正常' },
  { name: '世界知识产权组织', type: 'WIPO 马德里体系', status: 'online', coverage: 99, freshness: '8 分钟前', lastSync: '2026-07-20 10:22', note: '国际注册数据同步正常' },
  { name: '欧盟商标检索系统', type: 'TMview 图文检索', status: 'online', coverage: 93, freshness: '32 分钟前', lastSync: '2026-07-20 09:58', note: '跨库图形索引正常' },
  { name: '东盟本地规则库', type: '六国法规与实务', status: 'scheduled', coverage: 91, freshness: '每日更新', lastSync: '2026-07-20 02:00', note: '下一次更新为今日 22:00' },
]

export const demoReports: ReportRecord[] = [
  { reportId: 'RP-A74A94D5', taskId: 'demo-high-risk', brandName: '墨兰奶白', niceClass: '第 43 类餐饮服务', targetCountries: ['越南', '泰国'], riskLevel: 'high', riskScore: 87, manualReviewRequired: true, createdAt: '2026-07-20 16:35', updatedAt: '2026-07-20 16:42', owner: '法务负责人', status: '已归档', summary: '图形近似与跨类商誉攀附风险较高，建议改稿后重新检索。' },
  { reportId: 'RP-37226823', taskId: 'demo-low-risk', brandName: '木兰茶序', niceClass: '第 25 类服装鞋帽', targetCountries: ['越南', '马来西亚'], riskLevel: 'low', riskScore: 18, manualReviewRequired: false, createdAt: '2026-07-19 11:12', updatedAt: '2026-07-19 11:20', owner: '知识产权专员', status: '已归档', summary: '文字和图形区分度较好，可补充主体证明后推进申请。' },
  { reportId: 'RP-864D55E6', taskId: 'demo-medium-risk', brandName: '蓝莲供应链', niceClass: '第 39 类运输仓储', targetCountries: ['泰国', '印度尼西亚'], riskLevel: 'medium', riskScore: 56, manualReviewRequired: true, createdAt: '2026-07-18 09:08', updatedAt: '2026-07-18 09:15', owner: '东盟项目组', status: '已归档', summary: '图形具备识别性，但需要进一步核验宗教文化语境。' },
]

export const demoRules: CountryRule[] = [
  { country: '越南', riskTags: ['纯文字', '图形近似', '先公告后实审', '5 个月异议窗口'], legalBasis: '越南《知识产权法》第 72 至 76 条', reviewFocus: '显著性、公共秩序、相对近似和公告异议', timeline: '形式审查约 1 个月，公告 2 个月，实质审查约 9 至 12 个月', strategy: '高风险标识先做本地文字可读性改稿，再提交单国申请。' },
  { country: '泰国', riskTags: ['王室符号', '佛像', '宗教敬意', '政府标识'], legalBasis: '泰国《商标法》及审查实务', reviewFocus: '王室、宗教和公共秩序相关风险', timeline: '审查通常 12 至 18 个月，公告后可异议', strategy: '含宗教或王室图形必须先完成人工复核。' },
  { country: '印度尼西亚', riskTags: ['宗教符号', '酒类', '猪元素', '欺骗性描述'], legalBasis: '印度尼西亚《商标与地理标志法》', reviewFocus: '宗教与清真语境、公共秩序和商品属性误导', timeline: '形式审查、公告及实质审查约 10 至 16 个月', strategy: '食品饮料和日化品牌优先检查宗教敏感语义。' },
  { country: '马来西亚', riskTags: ['伊斯兰符号', '酒类', '猪元素', '政府标识'], legalBasis: '马来西亚《商标法》及注册实务', reviewFocus: '宗教、公序良俗和政府机构标识', timeline: '通常 12 至 18 个月完成注册流程', strategy: '避免将清真语义与酒类、娱乐场景混用。' },
  { country: '菲律宾', riskTags: ['欺骗性描述', '暴力元素', '官方徽章'], legalBasis: '菲律宾《知识产权法典》及审查指南', reviewFocus: '欺骗性、冒犯性和官方标识风险', timeline: '约 8 至 14 个月，公告期可提出异议', strategy: '营销夸张词需核验是否构成商品功效误导。' },
  { country: '新加坡', riskTags: ['欺骗性', '官方标识', '公共利益'], legalBasis: '新加坡《商标法》', reviewFocus: '相对宽松，但仍需排除欺骗性和官方标识', timeline: '约 6 至 12 个月，适合作为区域布局首站', strategy: '低风险品牌优先完成英文与本地名称双轨保护。' },
]

export const demoAuditResult: AuditResult = {
  taskId: 'demo-high-risk', status: 'done', currentStep: 5, progress: 100, brandName: '墨兰奶白', niceClass: '第 43 类餐饮服务', goodsServices: '茶饮店、咖啡馆、餐厅及外卖服务', riskLevel: 'high', riskScore: 87,
  overallResult: '当前四叶花饰与高知名度奢侈品牌图形要素存在较高近似风险，建议暂缓提交并完成图样重构。', manualReviewRequired: true, generatedAt: '2026-07-20 16:42',
  summary: { brandName: '墨兰奶白', niceClass: '第 43 类餐饮服务', submitTime: '2026-07-20 16:35', riskLevel: 'high', riskScore: 87, overallResult: '建议暂缓提交，完成图样重构后重新检索。' },
  hitRules: [
    { ruleType: 'absolute', article: '越南《知识产权法》第 73 条', content: '违反社会道德、公共秩序或造成公众误认的标识不得注册。', applicable: false, similarityType: '', similarityScore: 12, note: '文字部分未发现明显禁用情形。' },
    { ruleType: 'relative', article: '越南《知识产权法》第 74 条', content: '与在先商标相同或近似并可能造成混淆的标识不得注册。', applicable: true, similarityType: '图形近似', similarityScore: 87, note: '四叶花饰在轮廓、对称结构和视觉重心上高度接近。' },
  ],
  references: [{ refType: 'law', title: '越南知识产权法商标审查条款', source: '越南国家知识产权局（NOIP）', date: '2026-07-20', registrationNo: '', summary: '用于判断绝对禁用、显著性及在先权利冲突。', relevance: '高', retrievedAt: '2026-07-20 16:36' }],
  evidence: [
    { title: '图形轮廓相似度 87 分', summary: '提交图样与对标图样均采用中心对称四叶结构，主要视觉要素高度接近。', basis: 'evidence', source: 'TMview 图形检索', retrievedAt: '2026-07-20 16:38' },
    { title: '第 43 类服务存在交叉保护风险', summary: '餐饮服务场景可能强化消费者对品牌授权或商业关联的误认。', basis: 'rule', source: '东盟本地规则库', retrievedAt: '2026-07-20 16:39' },
  ],
  absolute: { hasRisk: false, rejectionProbability: 12, articles: [{ article: '第 73 条', content: '公共秩序与误认禁止条款', applicable: false, note: '文字要素暂不触发。' }] },
  relative: {
    hasRisk: true,
    conflicts: [{ brandName: '国际奢侈品牌四叶花饰', registeredClass: '多类别保护', registrationNo: '4VN-2019-00XXX', similarityType: '四叶几何结构', similarityScore: 87 }],
    precedents: [{ caseName: '某茶饮品牌图形近似争议案', court: '知识产权法院', date: '2026-06-28', ruling: '认定跨类攀附高知名度图形商誉。', relevance: '图形构成和使用场景与本案具有参考性。' }],
  },
  visual: {
    radarData: [{ dimension: '几何轮廓', target: 91, benchmark: 94 }, { dimension: '色彩构成', target: 72, benchmark: 78 }, { dimension: '线条密度', target: 88, benchmark: 90 }, { dimension: '对称结构', target: 93, benchmark: 95 }, { dimension: '视觉重心', target: 84, benchmark: 86 }],
    matchedBrands: [{ name: '四叶花饰对标图样', thumbnailUrl: '/lv-placeholder.svg', matchScore: 87 }], analysisMode: '图形特征与语义联合分析', summary: '高风险主要来自中心对称四叶结构，不建议仅通过颜色调整规避。',
  },
  intelligence: {
    crossClassShield: { triggered: true, score: 87, title: '跨类保护触发', explanation: '图形要素与高知名度商标关联度较高。', protectedElements: ['四叶轮廓', '中心对称结构'], suggestedAction: '重构图样后重新检索。' },
    refusalHistory: { triggered: true, title: '历史风险信号', explanation: '同类图形在餐饮场景曾出现跨类争议。', redFlags: ['高知名度图形', '跨类使用'], evidence: ['公开裁判案例'] },
    culturalReview: { triggered: false, title: '文化语义审查', country: '越南', rules: [] },
    registrationStrategy: {
      route: '越南单国申请', rationale: '改稿后先验证重点市场，再扩展至马德里体系。', marketCount: 2,
      timeline: [
        { stage: '图样重构', duration: '3 至 5 个工作日', output: '替代图样与设计说明' },
        { stage: '本地检索', duration: '1 个工作日', output: '近似检索清单' },
        { stage: '人工复核', duration: '2 个工作日', output: '当地代理人意见' },
        { stage: '提交申请', duration: '1 个工作日', output: '申请回执' },
      ],
      costNotes: ['先完成高风险要素改稿，可减少无效申请成本。'],
    },
    monitoring: [{ name: '越南商标公告监控', cadence: '每日', source: 'NOIP 公告', actionWindow: '发现近似后 24 小时内分派' }],
  },
  advice: {
    recommendations: [
      { priority: 'P0', title: '立即停止使用当前四叶花饰', description: '暂停在越南市场物料和线上渠道使用当前图形。' },
      { priority: 'P1', title: '启动图样重构与替代检索', description: '保留中文文字识别要素，改为非中心对称图形。' },
      { priority: 'P2', title: '保全独立创作证据', description: '整理草图、委托合同、版本记录和首次使用时间线。' },
    ],
    documentPreview: '本报告基于公开数据库、东盟本地规则和图形特征分析形成。建议企业在正式提交前，由当地执业代理人完成最终检索与复核。',
    documentDownloadUrl: '',
  },
}

export const demoAdminStatistics: AdminStatistics = { auditedBrands: 128, highRiskBlocked: 31, totalTasks: 156, processingTasks: 4, registeredUsers: 24, mediumRisk: 47 }

export const demoAdminTasks: AdminTask[] = demoReports.map((report, index) => ({
  taskId: report.taskId, status: index === 2 ? 'processing' : 'done', currentStep: index === 2 ? 3 : 5, progress: index === 2 ? 64 : 100,
  brandName: report.brandName, niceClass: report.niceClass, targetCountries: report.targetCountries, riskLevel: report.riskLevel, riskScore: report.riskScore,
  manualReviewRequired: report.manualReviewRequired, createdAt: report.createdAt, updatedAt: report.updatedAt, errorMessage: '',
}))

export const demoAdminTaskDetail: AdminTaskDetail = {
  task_id: 'demo-high-risk', status: 'done', current_step: 5, progress: 100, error_message: '', created_at: '2026-07-20 16:35', updated_at: '2026-07-20 16:42',
  request: { brandName: '墨兰奶白', niceClass: '第 43 类', targetCountries: ['越南', '泰国'] }, result: { riskLevel: 'high', riskScore: 87, manualReviewRequired: true },
}
