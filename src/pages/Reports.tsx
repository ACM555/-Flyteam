import { DownloadOutlined, EyeOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Card, Input, Progress, Select, Skeleton, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReports, type ReportRecord, type RiskLevel } from '@/api/saas'
import { PageHeader, RiskBadge } from '@/components/DesignSystem'
import ProductEmpty from '@/components/ProductEmpty'
import { usePresentation } from '@/context/PresentationContext'

function Reports() {
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const { isPresentationData } = usePresentation()
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [keyword, setKeyword] = useState('')
  const [risk, setRisk] = useState<RiskLevel | 'all'>('all')
  const [loading, setLoading] = useState(true)
  useEffect(() => { let mounted = true; getReports().then((data) => mounted && setReports(data)).finally(() => mounted && setLoading(false)); return () => { mounted = false } }, [])
  const filtered = useMemo(() => reports.filter((item) => [item.reportId, item.brandName, item.niceClass, item.summary].join(' ').toLowerCase().includes(keyword.toLowerCase()) && (risk === 'all' || item.riskLevel === risk)), [keyword, reports, risk])
  const featured = reports[0]
  const download = (record: ReportRecord) => { if (isPresentationData) { message.info('演示空间为只读模式，正式环境可导出带证据链的 PDF 报告。'); return } window.open(`/api/audit/report/${record.taskId}/pdf`, '_blank', 'noopener,noreferrer') }
  const columns: TableColumnsType<ReportRecord> = [
    { title: '报告与品牌', dataIndex: 'reportId', render: (_, record) => <div><strong className="table-primary">{record.reportId}</strong><span className="table-secondary">{record.brandName} · {record.niceClass}</span></div> },
    { title: '目标国家', dataIndex: 'targetCountries', render: (items: string[]) => <div className="tag-row">{items.map((item) => <Tag color="blue" key={item}>{item}</Tag>)}</div> },
    { title: '风险', dataIndex: 'riskLevel', width: 120, render: (level: RiskLevel, record) => <RiskBadge level={level} score={record.riskScore} /> },
    { title: '管理层摘要', dataIndex: 'summary' },
    { title: '归档时间', dataIndex: 'updatedAt', width: 160 },
    { title: '操作', width: 170, render: (_, record) => <div className="table-actions"><Button icon={<EyeOutlined />} onClick={() => navigate(`/report/${record.taskId}`)} size="small">查看</Button><Button icon={<DownloadOutlined />} onClick={() => download(record)} size="small">PDF</Button></div> },
  ]

  return <div className="page-stack reports-page">
    <PageHeader eyebrow="审查归档" title="报告中心" description="集中检索审查结论、证据来源和处置建议，为管理层决策与当地代理人复核提供统一材料。" />
    {featured ? <section className="reports-feature"><div><span className="page-eyebrow">重点报告</span><h2>{featured.brandName} · {featured.niceClass}</h2><p>{featured.summary}</p><div className="tag-row">{featured.targetCountries.map((country) => <Tag key={country}>{country}</Tag>)}<Tag>{featured.updatedAt}</Tag></div><div className="reports-feature-actions"><Button onClick={() => navigate(`/report/${featured.taskId}`)} type="primary">查看完整报告</Button><Button ghost icon={<DownloadOutlined />} onClick={() => download(featured)}>导出 PDF</Button></div></div><div className="reports-score"><div className="feature-score"><strong>{featured.riskScore}</strong><RiskBadge level={featured.riskLevel} /><span>需人工复核：{featured.manualReviewRequired ? '是' : '否'}</span></div></div></section> : null}
    <Card className="data-table-card" title="审查报告库" extra={<span className="section-meta">{filtered.length} 份报告</span>}>
      <div className="toolbar reports-toolbar"><div className="toolbar-filters"><Input allowClear className="toolbar-search" onChange={(event) => setKeyword(event.target.value)} placeholder="搜索品牌、编号或类别" prefix={<SearchOutlined />} value={keyword} /><Select value={risk} onChange={setRisk} options={[{ value: 'all', label: '全部风险' }, { value: 'high', label: '高风险' }, { value: 'medium', label: '中风险' }, { value: 'low', label: '低风险' }]} /></div><span className="status-chip"><FileTextOutlined />报告归档链路正常</span></div>
      {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : filtered.length ? <Table columns={columns} dataSource={filtered} pagination={{ pageSize: 8 }} rowKey="reportId" rowClassName={(record) => record.riskLevel === 'high' ? 'row-risk-high' : ''} scroll={{ x: 1100 }} /> : <ProductEmpty description="没有匹配的报告" detail="调整筛选条件，或先发起一项新的智能审查。" actionLabel="发起智能审查" onAction={() => navigate('/submit')} />}
    </Card>
  </div>
}

export default Reports
