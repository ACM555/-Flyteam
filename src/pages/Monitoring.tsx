import { CheckOutlined, ClockCircleOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Card, Input, Select, Skeleton, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMonitoringAlerts, type MonitoringAlert, type RiskLevel } from '@/api/saas'
import { LiveIndicator, PageHeader, RiskBadge } from '@/components/DesignSystem'
import ProductEmpty from '@/components/ProductEmpty'

function Monitoring() {
  const { message } = AntdApp.useApp()
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<RiskLevel | 'all'>('all')
  const load = useCallback(async () => { setLoading(true); try { setAlerts(await getMonitoringAlerts()) } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => alerts.filter((item) => `${item.title}${item.brandName}${item.country}${item.owner}`.toLowerCase().includes(query.toLowerCase()) && (severity === 'all' || item.severity === severity)), [alerts, query, severity])
  const count = (level: RiskLevel) => alerts.filter((item) => item.severity === level).length
  const handleAction = (alertId: string) => { setAlerts((items) => items.map((item) => item.alertId === alertId ? { ...item, status: '跟进中', owner: item.owner === '系统自动' ? '法务负责人' : item.owner } : item)); message.success('已更新为跟进中，仅保存于当前会话') }

  const columns: TableColumnsType<MonitoringAlert> = [
    { title: '级别', dataIndex: 'severity', width: 110, render: (value) => <RiskBadge level={value} /> },
    { title: '风险事项', dataIndex: 'title', render: (value, record) => <div><strong className="table-primary">{value}</strong><span className="table-secondary">{record.alertId} · {record.country} · {record.source}</span><span className="table-recommendation">建议：{record.recommendation}</span></div> },
    { title: '影响品牌', dataIndex: 'brandName', width: 130 },
    { title: '处理窗口', dataIndex: 'window', width: 130, render: (value) => <span className="deadline-cell"><ClockCircleOutlined />{value}</span> },
    { title: '责任人', dataIndex: 'owner', width: 120 },
    { title: '状态', dataIndex: 'status', width: 100, render: (value) => <Tag color={value === '需处理' ? 'red' : value === '跟进中' ? 'gold' : 'blue'}>{value}</Tag> },
    { title: '操作', width: 120, render: (_, record) => <Button disabled={record.status === '跟进中'} icon={<CheckOutlined />} onClick={() => handleAction(record.alertId)} size="small">{record.status === '跟进中' ? '跟进中' : '接收处理'}</Button> },
  ]

  return <div className="page-stack monitoring-page">
    <PageHeader eyebrow="持续监控" title="监控预警中心" description="从公告期近似申请、异议窗口、法规更新到品牌状态变化，统一进入可分派、可追踪的处置队列。" actions={<><LiveIndicator label="监控链路在线" /><Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button></>} />
    <div className="alert-summary-grid"><div className="alert-summary high"><strong>{count('high')}</strong><span>高风险 · 需要立即处理</span></div><div className="alert-summary medium"><strong>{count('medium')}</strong><span>中风险 · 等待人工复核</span></div><div className="alert-summary low"><strong>{count('low')}</strong><span>低风险 · 持续观察</span></div></div>
    <Card className="data-table-card" title="预警处置队列" extra={<span className="section-meta">{filtered.length} 条待跟踪事项</span>}>
      <div className="toolbar monitoring-toolbar"><div className="toolbar-filters"><Input allowClear className="toolbar-search" onChange={(event) => setQuery(event.target.value)} placeholder="搜索品牌、国家或责任人" prefix={<SearchOutlined />} /><Select value={severity} onChange={setSeverity} options={[{ value: 'all', label: '全部级别' }, { value: 'high', label: '高风险' }, { value: 'medium', label: '中风险' }, { value: 'low', label: '低风险' }]} /></div><LiveIndicator label="最近同步 2 分钟前" /></div>
      {loading ? <Skeleton active paragraph={{ rows: 9 }} /> : filtered.length ? <Table columns={columns} dataSource={filtered} pagination={{ pageSize: 8 }} rowKey="alertId" scroll={{ x: 1100 }} rowClassName={(record) => record.severity === 'high' ? 'row-risk-high' : ''} /> : <ProductEmpty description="当前筛选下没有预警" detail="调整风险级别或搜索条件查看其他监控事项。" />}
    </Card>
  </div>
}

export default Monitoring
