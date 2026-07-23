import { DownloadOutlined, FileSearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, Button, Card, Descriptions, List, Progress, Result, Skeleton, Space, Table, Tabs, Tag, Timeline, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { getAuditResult } from '@/api/audit'
import { RiskBadge } from '@/components/DesignSystem'
import ProductEmpty from '@/components/ProductEmpty'
import { usePresentation } from '@/context/PresentationContext'
import type { AuditResult, EvidenceItem } from '@/types/audit'

const { Paragraph, Text, Title } = Typography
type Conflict = AuditResult['relative']['conflicts'][number]
const conflictColumns: TableColumnsType<Conflict> = [
  { title: '冲突品牌', dataIndex: 'brandName' }, { title: '注册类别', dataIndex: 'registeredClass' }, { title: '注册号', dataIndex: 'registrationNo' },
  { title: '近似类型', dataIndex: 'similarityType' }, { title: '近似度', dataIndex: 'similarityScore', width: 170, render: (score: number) => <Progress percent={score} status={score >= 80 ? 'exception' : 'normal'} size="small" /> },
]
const basisLabels: Record<EvidenceItem['basis'], string> = { rule: '规则判断', evidence: '证据匹配', heuristic: '辅助判断' }

function Report() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ taskId?: string }>()
  const { message } = AntdApp.useApp()
  const { isPresentationData } = usePresentation()
  const taskId = params.taskId ?? (location.state as { taskId?: string } | null)?.taskId
  const [result, setResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!taskId) { setError('缺少审查任务编号，请从报告中心或提交页重新进入。'); setLoading(false); return }
    let cancelled = false
    const poll = async () => { try { const next = await getAuditResult(taskId); if (cancelled) return; setResult(next); if (next.status === 'done') setLoading(false); else if (next.status === 'error') { setError(next.errorMessage || '审查任务未能完成。'); setLoading(false) } else timerRef.current = window.setTimeout(poll, 1800) } catch { if (!cancelled) { setError('暂时无法读取审查结果，请稍后重试。'); setLoading(false) } } }
    void poll()
    return () => { cancelled = true; if (timerRef.current) window.clearTimeout(timerRef.current) }
  }, [taskId])

  if (error) return <Result status="error" title="无法打开审查报告" subTitle={error} extra={<Button type="primary" onClick={() => navigate('/submit')}>发起新审查</Button>} />
  if (loading && !result) return <div className="page-stack"><Title level={2}>正在准备审查报告</Title><Card><Skeleton active paragraph={{ rows: 12 }} /></Card></div>
  if (!result) return <ProductEmpty description="尚未取得审查结果" detail="重新发起审查后，系统会生成可追溯报告。" actionLabel="发起智能审查" onAction={() => navigate('/submit')} />
  if (result.status !== 'done') return <Card><Title level={2}>正在生成合规报告</Title><Progress percent={result.progress} /><Paragraph type="secondary">审查过程会自动刷新，请保持当前页面开启。</Paragraph></Card>

  const download = () => { if (isPresentationData || !result.advice.documentDownloadUrl) { message.info('演示空间为只读模式，正式环境可导出带签章与证据链的 PDF 报告。'); return } window.open(result.advice.documentDownloadUrl, '_blank', 'noopener,noreferrer') }
  const evidence = <Timeline className="evidence-timeline" items={result.evidence.map((item) => ({ color: item.basis === 'evidence' ? 'green' : item.basis === 'rule' ? 'blue' : 'gray', children: <div className="evidence-item"><div><Tag>{basisLabels[item.basis]}</Tag><strong>{item.title}</strong></div><p>{item.summary}</p><span>{item.source} · {item.retrievedAt}</span></div> }))} />
  const visual = result.visual.radarData.length ? <div className="report-visual-grid"><Card title="图形特征雷达"><ResponsiveContainer width="100%" height={320}><RadarChart data={result.visual.radarData} outerRadius="68%"><PolarGrid /><PolarAngleAxis dataKey="dimension" /><Radar dataKey="target" name="提交图样" stroke="#087f8c" fill="#087f8c" fillOpacity={0.25} /><Radar dataKey="benchmark" name="对标图样" stroke="#9e1731" fill="#9e1731" fillOpacity={0.18} /><Legend /></RadarChart></ResponsiveContainer></Card><Card title="图形分析结论"><p className="report-visual-summary">{result.visual.summary || '图形分析已完成。'}</p>{result.visual.matchedBrands.map((item) => <div className="matched-brand" key={item.name}><div><strong>{item.name}</strong><span>图形近似线索</span></div><RiskBadge level={item.matchScore >= 80 ? 'high' : item.matchScore >= 50 ? 'medium' : 'low'} score={item.matchScore} /></div>)}</Card></div> : <ProductEmpty description="暂无图形分析数据" detail="请确认审查任务已上传清晰品牌图样。" />
  const actions = <div className="recommendation-list">{result.advice.recommendations.map((item) => <article key={item.title}><Tag color={item.priority === 'P0' ? 'red' : item.priority === 'P1' ? 'orange' : 'blue'}>{item.priority}</Tag><div><strong>{item.title}</strong><p>{item.description}</p></div></article>)}</div>
  const tabs = [
    { key: 'evidence', label: '证据时间线', children: evidence },
    { key: 'conflicts', label: '冲突矩阵', children: result.relative.conflicts.length ? <Table columns={conflictColumns} dataSource={result.relative.conflicts} pagination={false} rowKey={(record) => record.registrationNo || record.brandName} scroll={{ x: 850 }} /> : <ProductEmpty description="未发现高置信度冲突商标" /> },
    { key: 'rules', label: '规则命中', children: <List dataSource={result.hitRules} renderItem={(item) => <List.Item><div className="hit-rule"><Tag color={item.applicable ? 'red' : 'green'}>{item.applicable ? '已命中' : '未命中'}</Tag><div><strong>{item.article}</strong><p>{item.content}</p><span>{item.note}</span></div></div></List.Item>} /> },
    { key: 'visual', label: '图形雷达', children: visual },
    { key: 'actions', label: '处置建议', children: actions },
  ]

  return <div className="page-stack report-page">
    <div className="report-page-heading"><div><span className="page-eyebrow">管理层审查报告</span><Title level={2}>{result.brandName} · 商标合规审查结论</Title><Text type="secondary">任务编号 {result.taskId} · 生成时间 {result.generatedAt || '已归档'}</Text></div><Space wrap><Button icon={<FileSearchOutlined />} onClick={() => navigate('/reports')}>返回报告中心</Button><Button icon={<DownloadOutlined />} onClick={download} type="primary">导出 PDF</Button></Space></div>
    <Card className="report-summary"><div className="report-summary-grid"><div><div className="report-summary-top"><RiskBadge level={result.riskLevel} score={result.riskScore} /><Tag color={result.manualReviewRequired ? 'orange' : 'green'}>{result.manualReviewRequired ? '需要人工复核' : '常规复核'}</Tag></div><h3>管理层结论</h3><p className="report-conclusion">{result.overallResult}</p><div className="report-next-step"><span className="rns-label">建议优先行动</span><div className="rns-title">{result.advice.recommendations[0]?.title || '结合当地代理意见推进'}</div><div className="rns-desc">{result.advice.recommendations[0]?.description}</div></div></div><div className="report-score-panel" style={{ borderColor: result.riskLevel === 'high' ? '#b42332' : result.riskLevel === 'medium' ? '#b86b13' : '#17805a' }}><span>综合风险指数</span><strong>{result.riskScore}</strong><Progress percent={result.riskScore} showInfo={false} status={result.riskLevel === 'high' ? 'exception' : 'normal'} /><small>满分 100，分值越高风险越集中</small></div></div></Card>
    <Card className="content-panel" title={<Space><SafetyCertificateOutlined />审查范围与使用边界</Space>}><Descriptions column={{ xs: 1, md: 3 }} items={[{ key: 'class', label: '尼斯类别', children: result.niceClass }, { key: 'goods', label: '商品或服务', children: result.goodsServices }, { key: 'evidence', label: '已记录依据', children: `${result.evidence.length + result.references.length} 项` }]} /><Alert className="report-disclaimer" message="本报告用于提交前风险辅助，不构成法律意见或注册结果承诺。" showIcon type="info" /></Card>
    <Card className="content-panel"><Tabs items={tabs} /></Card>
  </div>
}

export default Report
