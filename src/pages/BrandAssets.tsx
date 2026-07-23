import { AppstoreOutlined, ArrowRightOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SearchOutlined, SafetyCertificateOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Button, Card, Input, Progress, Segmented, Select, Skeleton, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBrandAssets, type BrandAsset, type RiskLevel } from '@/api/saas'
import { MetricCard, PageHeader, RiskBadge } from '@/components/DesignSystem'
import { MotionItem, StaggerGroup } from '@/components/MotionKit'
import ProductEmpty from '@/components/ProductEmpty'

type ViewMode = 'card' | 'table'

function BrandAssets() {
  const navigate = useNavigate()
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState<RiskLevel | 'all'>('all')
  const [view, setView] = useState<ViewMode>('card')
  useEffect(() => { let mounted = true; getBrandAssets().then((data) => mounted && setAssets(data)).finally(() => mounted && setLoading(false)); return () => { mounted = false } }, [])

  const filtered = useMemo(() => assets.filter((item) => {
    const textMatch = `${item.name}${item.englishName}${item.owner}${item.targetCountries.join('')}`.toLowerCase().includes(query.toLowerCase())
    return textMatch && (risk === 'all' || item.riskLevel === risk)
  }), [assets, query, risk])
  const pendingCount = assets.filter((item) => item.riskLevel !== 'low').length
  const readyCount = assets.filter((item) => item.portfolioStatus === '可提交').length

  const columns: TableColumnsType<BrandAsset> = [
    { title: '品牌组合', dataIndex: 'name', render: (_, record) => <div><strong className="table-primary">{record.name}</strong><span className="table-secondary">{record.englishName} · {record.owner}</span></div> },
    { title: '类别', dataIndex: 'niceClasses', render: (items: string[]) => <div className="tag-row">{items.map((item) => <Tag key={item}>{item}</Tag>)}</div> },
    { title: '目标国家', dataIndex: 'targetCountries', render: (items: string[]) => <div className="tag-row">{items.map((item) => <Tag color="blue" key={item}>{item}</Tag>)}</div> },
    { title: '风险', dataIndex: 'riskLevel', sorter: (a, b) => a.riskScore - b.riskScore, render: (level: RiskLevel, record) => <RiskBadge level={level} score={record.riskScore} /> },
    { title: '状态', dataIndex: 'portfolioStatus', render: (value) => <Tag color={value === '可提交' ? 'green' : value === '待改稿' ? 'red' : 'gold'}>{value}</Tag> },
    { title: '下一步行动', dataIndex: 'nextAction' },
  ]

  return <div className="page-stack">
    <PageHeader eyebrow="品牌资产组合" title="品牌资产库" description="用统一视图管理商标类别、目标市场、风险状态和下一步行动，把一次审查沉淀为持续可运营的品牌资产。" actions={<Button icon={<ArrowRightOutlined />} onClick={() => navigate('/submit')} type="primary">新增智能审查</Button>} />
    <StaggerGroup className="metric-grid metric-grid-three">
      <MotionItem><MetricCard icon={<SafetyCertificateOutlined />} label="资产总数" value={assets.length} unit="组" note="覆盖多个类别和东盟市场" /></MotionItem>
      <MotionItem><MetricCard icon={<ExclamationCircleOutlined />} label="待改稿或复核" value={pendingCount} unit="组" note="需要法务或当地代理人参与" tone="danger" /></MotionItem>
      <MotionItem><MetricCard icon={<CheckCircleOutlined />} label="可直接推进" value={readyCount} unit="组" note="已通过当前规则和近似检索" tone="success" /></MotionItem>
    </StaggerGroup>
    <Card className="content-panel" title="资产明细" extra={<span className="section-meta">共 {filtered.length} 组</span>}>
      <div className="toolbar asset-toolbar"><div className="toolbar-filters"><Input allowClear className="toolbar-search" onChange={(event) => setQuery(event.target.value)} placeholder="搜索品牌、企业或国家" prefix={<SearchOutlined />} /><Select value={risk} onChange={setRisk} options={[{ value: 'all', label: '全部风险' }, { value: 'high', label: '高风险' }, { value: 'medium', label: '中风险' }, { value: 'low', label: '低风险' }]} /></div><Segmented value={view} onChange={(value) => setView(value as ViewMode)} options={[{ value: 'card', label: '卡片视图', icon: <AppstoreOutlined /> }, { value: 'table', label: '表格视图', icon: <UnorderedListOutlined /> }]} /></div>
      {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : filtered.length ? view === 'table' ? <Table columns={columns} dataSource={filtered} pagination={{ pageSize: 8 }} rowKey="brandId" scroll={{ x: 1050 }} rowClassName={(record) => record.riskLevel === 'high' ? 'row-risk-high' : ''} /> : <div className="asset-grid">{filtered.map((asset) => <article className="asset-card" key={asset.brandId}><div className="asset-card-head"><div><span className="asset-id">{asset.brandId}</span><h3>{asset.name}</h3><p>{asset.englishName}</p></div><RiskBadge level={asset.riskLevel} score={asset.riskScore} /></div><div className="asset-owner">{asset.owner}</div><Progress percent={asset.riskScore} showInfo={false} strokeColor={asset.riskLevel === 'high' ? '#b42332' : asset.riskLevel === 'medium' ? '#b86b13' : '#17805a'} /><div className="tag-row">{asset.niceClasses.map((item) => <Tag key={item}>{item}</Tag>)}{asset.targetCountries.map((item) => <Tag color="blue" key={item}>{item}</Tag>)}</div><div className="asset-next"><span>下一步行动</span><strong>{asset.nextAction}</strong></div><Button onClick={() => navigate('/submit')} type="link">继续处理<ArrowRightOutlined /></Button></article>)}</div> : <ProductEmpty description="没有符合条件的品牌资产" detail="调整筛选条件，或发起一次新的智能审查。" actionLabel="发起审查" onAction={() => navigate('/submit')} />}
    </Card>
  </div>
}

export default BrandAssets
