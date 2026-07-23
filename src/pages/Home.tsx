import { AlertOutlined, ArrowRightOutlined, DatabaseOutlined, FileTextOutlined, ReloadOutlined, SafetyCertificateOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Skeleton, Table, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getPlatformOverview, type PlatformOverview } from '@/api/platform'
import { getBrandAssets, getDataSourceStatus, getMonitoringAlerts, getReports, type BrandAsset, type DataSourceStatus, type MonitoringAlert, type ReportRecord } from '@/api/saas'
import { MetricCard, RiskBadge, SourceStatus } from '@/components/DesignSystem'
import { ChartReveal, MotionItem, StaggerGroup } from '@/components/MotionKit'
import RiskRadar from '@/components/RiskRadar'

const emptyOverview: PlatformOverview = { positioning: '', slogan: '', modules: [], dataSources: [], riskTrend: [], sla: [], businessModel: [] }

function Home() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<PlatformOverview>(emptyOverview)
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([])
  const [sources, setSources] = useState<DataSourceStatus[]>([])
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextOverview, nextAssets, nextAlerts, nextSources, nextReports] = await Promise.all([getPlatformOverview(), getBrandAssets(), getMonitoringAlerts(), getDataSourceStatus(), getReports()])
      setOverview(nextOverview); setAssets(nextAssets); setAlerts(nextAlerts); setSources(nextSources); setReports(nextReports); setFailed(false)
    } catch { setFailed(true) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const highRiskAssets = assets.filter((item) => item.riskLevel === 'high').length
  const highAlerts = alerts.filter((item) => item.severity === 'high').length
  const onlineSources = sources.filter((item) => item.status === 'online').length
  const alertColumns: TableColumnsType<MonitoringAlert> = [
    { title: '风险', dataIndex: 'severity', width: 110, render: (level) => <RiskBadge level={level} /> },
    { title: '预警事项', dataIndex: 'title', render: (value, record) => <div><strong className="table-primary">{value}</strong><span className="table-secondary">{record.brandName} · {record.country}</span></div> },
    { title: '处理窗口', dataIndex: 'window', width: 120 },
    { title: '负责人', dataIndex: 'owner', width: 120 },
  ]

  return (
    <div className="page-stack home-page">
      <section className="home-hero">
        <div className="home-hero-grid" aria-hidden="true" />
        <div className="home-hero-copy">
          <span className="home-hero-kicker">中国企业出海 · 东盟六国合规</span>
          <Typography.Title level={1}>东盟商标风险<br />企业法务驾驶舱</Typography.Title>
          <Typography.Paragraph>{overview.positioning || '将商标预检、注册导航、公告监控与证据报告集中到一个可追踪的决策空间。'}</Typography.Paragraph>
          <div className="home-hero-actions"><Button icon={<SendOutlined />} onClick={() => navigate('/submit')} size="large" type="primary">发起智能审查</Button><Button className="home-hero-secondary" onClick={() => navigate('/reports')} size="large">查看管理层报告</Button></div>
          <div className="hero-proof"><span><strong>6 国</strong>东盟核心市场</span><span><strong>4 类</strong>可信数据来源</span><span><strong>7×24</strong>公告期监控</span><span><strong>1 份</strong>证据链报告</span></div>
        </div>
        <div className="risk-radar-panel"><RiskRadar score={overview.healthScore ?? 92} subtitle="平台健康度与实时风险信号" /></div>
      </section>

      {failed ? <Alert action={<Button icon={<ReloadOutlined />} onClick={load}>重新加载</Button>} message="部分数据暂时不可用" description="系统已保留可演示的只读业务数据，不影响浏览产品主流程。" showIcon type="warning" /> : null}
      {loading ? <Card><Skeleton active paragraph={{ rows: 10 }} /></Card> : <>
        <StaggerGroup className="metric-grid">
          <MotionItem><MetricCard icon={<SafetyCertificateOutlined />} label="受管品牌资产" value={assets.length} unit="组" note="统一管理类别、国家与审查状态" /></MotionItem>
          <MotionItem><MetricCard icon={<AlertOutlined />} label="高风险待办" value={highRiskAssets + highAlerts} unit="项" note="需在异议窗口内完成人工处置" tone="danger" /></MotionItem>
          <MotionItem><MetricCard icon={<FileTextOutlined />} label="归档审查报告" value={reports.length} unit="份" note="包含法律依据与可追溯证据" tone="warning" /></MotionItem>
          <MotionItem><MetricCard icon={<DatabaseOutlined />} label="在线数据来源" value={onlineSources} unit={`/${sources.length || 4}`} note="NOIP、WIPO、TMview 持续同步" tone="success" /></MotionItem>
        </StaggerGroup>

        <div className="dashboard-grid">
          <Card className="chart-card" title="近七日风险趋势" extra={<span className="live-indicator"><span className="live-indicator-dot" />每 15 分钟更新</span>}>
            <ChartReveal className="chart-frame"><ResponsiveContainer width="100%" height={250}><AreaChart data={overview.riskTrend || []}><defs><linearGradient id="highFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#b42332" stopOpacity={0.28}/><stop offset="95%" stopColor="#b42332" stopOpacity={0}/></linearGradient><linearGradient id="mediumFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c69a44" stopOpacity={0.26}/><stop offset="95%" stopColor="#c69a44" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#e5ebf2" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tickLine={false}/><YAxis tickLine={false}/><Tooltip/><Area dataKey="high" fill="url(#highFill)" isAnimationActive={false} name="高风险" stroke="#b42332" strokeWidth={2}/><Area dataKey="medium" fill="url(#mediumFill)" isAnimationActive={false} name="中风险" stroke="#c69a44" strokeWidth={2}/></AreaChart></ResponsiveContainer></ChartReveal>
          </Card>
          <section className="coverage-board"><span className="page-eyebrow">区域合规覆盖</span><h3>东盟六国规则已接入</h3><p>按市场查看法律依据、审查周期、风险标签与推荐注册路径。</p><div className="country-cloud">{['越南', '泰国', '印度尼西亚', '马来西亚', '菲律宾', '新加坡'].map((country, index) => <button className="country-node" key={country} onClick={() => navigate('/rules')} type="button"><strong>{country}</strong><span>{index < 2 ? '重点市场 · 实时规则' : '规则库已同步'}</span></button>)}</div><Button className="coverage-action" onClick={() => navigate('/rules')}>打开规则对比<ArrowRightOutlined /></Button></section>
        </div>

        <Card className="data-table-card" title="待处理风险队列" extra={<Button type="link" onClick={() => navigate('/monitoring')}>进入监控中心<ArrowRightOutlined /></Button>}>
          <Table columns={alertColumns} dataSource={alerts} pagination={false} rowKey="alertId" scroll={{ x: 760 }} onRow={() => ({ onClick: () => navigate('/monitoring'), style: { cursor: 'pointer' } })} />
        </Card>
        <section><div className="section-titlebar"><div><h3>可信数据源健康度</h3><span className="section-meta">所有结论均标记来源与同步时间</span></div><Button icon={<ReloadOutlined />} onClick={load}>刷新状态</Button></div><div className="source-grid source-grid-spaced">{sources.map((source) => <SourceStatus key={source.name} source={source} />)}</div></section>
      </>}
    </div>
  )
}

export default Home
