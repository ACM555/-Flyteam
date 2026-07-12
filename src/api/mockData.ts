export interface ReportSummary {
  brandName: string
  niceClass: string
  submitTime: string
  riskLevel: 'high' | 'medium' | 'low'
  riskScore: number
  overallResult: string
}

export interface AbsoluteAnalysis {
  hasRisk: boolean
  articles: Array<{
    article: string
    content: string
    applicable: boolean
    note: string
  }>
  rejectionProbability: number
}

export interface RelativeAnalysis {
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

export interface VisualAnalysis {
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

export interface LegalAdvice {
  recommendations: Array<{
    priority: 'P0' | 'P1' | 'P2'
    title: string
    description: string
  }>
  documentPreview: string
}

export const mockReportData: {
  summary: ReportSummary
  absolute: AbsoluteAnalysis
  relative: RelativeAnalysis
  visual: VisualAnalysis
  advice: LegalAdvice
} = {
  summary: {
    brandName: '墨兰奶白',
    niceClass: '第43类-餐饮服务',
    submitTime: '2026-07-11 14:32',
    riskLevel: 'high',
    riskScore: 82,
    overallResult: '存在跨类目驰名商誉攀附风险，建议暂缓提交。',
  },
  absolute: {
    hasRisk: false,
    articles: [
      {
        article: '越南《工业产权法》第74.2(a)条',
        content: '非通用外语文字在越南因缺乏显著性特征，可能构成绝对驳回理由。',
        applicable: false,
        note: "品牌名含越南语“Mộc Lan”的语义联想，整体具备可识别性，此项不触发。",
      },
      {
        article: '越南《工业产权法》第73.5条',
        content: '与社会道德、公共秩序相冲突或可能造成公众误认的标志，不得注册为商标。',
        applicable: false,
        note: '未发现不当表述或可能导致商品服务来源误认的文字要素，此项不触发。',
      },
    ],
    rejectionProbability: 12,
  },
  relative: {
    hasRisk: true,
    conflicts: [
      {
        brandName: 'Louis Vuitton',
        registeredClass: '全类注册（含第43类）',
        registrationNo: '4VN-2019-00XXX',
        similarityType: '图形相似-四叶花卉几何结构',
        similarityScore: 87,
      },
    ],
    precedents: [
      {
        caseName: 'LV诉某茶饮品牌案（2026）苏中法知民初字第XX号',
        court: '苏州市中级人民法院',
        date: '2026-06-28',
        ruling: '被告跨类攀附驰名商标几何特征，判赔1,200万元。',
        relevance: '本案品牌“墨兰奶白”的四叶草图形与LV四叶花卉在几何构图上高度近似。',
      },
    ],
  },
  visual: {
    radarData: [
      { dimension: '几何轮廓', target: 91, benchmark: 94 },
      { dimension: '色彩构成', target: 72, benchmark: 78 },
      { dimension: '线条密度', target: 88, benchmark: 90 },
      { dimension: '对称性', target: 93, benchmark: 95 },
      { dimension: '视觉重心', target: 84, benchmark: 86 },
    ],
    matchedBrands: [
      {
        name: 'Louis Vuitton 四叶花卉',
        thumbnailUrl: '/lv-placeholder.svg',
        matchScore: 87,
      },
    ],
  },
  advice: {
    recommendations: [
      {
        priority: 'P0',
        title: '立即停止使用四叶花卉图形',
        description: '在越南市场投放、门店物料、社媒内容及线上店铺中暂停使用当前图形，避免持续扩大混淆风险。',
      },
      {
        priority: 'P1',
        title: '启动图形重构与检索',
        description: '保留“墨兰奶白”文字识别要素，重构为非中心对称、非四叶花卉的独立图形，并完成第43类近似检索。',
      },
      {
        priority: 'P2',
        title: '保全独立创作证据',
        description: '整理设计草图、委托协议、版本记录和首次使用证据，为后续答辩或沟通提供事实基础。',
      },
    ],
    documentPreview: `# 防御性合规规划书

## 一、风险结论
经初步审查，“墨兰奶白”文字部分具备一定识别性，但其四叶花卉图形与Louis Vuitton相关几何特征存在较高近似风险。

## 二、处置方案
建议立即停止当前图形在越南第43类餐饮服务中的使用和申请，并在完成替代图形检索后再行提交。

## 三、证据保全
请同步留存设计来源、创作过程及使用时间线，以便在潜在争议中证明独立创作与善意使用。

## 四、后续安排
完成新图形方案后，应开展越南数据库检索、法律复核及申请材料更新。`,
  },
}
