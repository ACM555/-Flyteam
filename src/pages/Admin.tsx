import { ApiOutlined, BarChartOutlined, DatabaseOutlined, ReloadOutlined, SafetyCertificateOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Card, Descriptions, Drawer, Progress, Skeleton, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminStatistics, getAdminTaskDetail, getAdminTasks, type AdminStatistics, type AdminTask, type AdminTaskDetail } from '@/api/admin'
import { MetricCard, PageHeader, RiskBadge } from '@/components/DesignSystem'

const statusText: Record<AdminTask['status'], string> = { pending: '等待中', processing: '审查中', done: '已完成', error: '失败' }

function Admin() {
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null)
  const [tasks, setTasks] = useState<AdminTask[]>([])
  const [detail, setDetail] = useState<AdminTaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const load = useCallback(async () => { setLoading(true); try { const [nextStatistics, nextTasks] = await Promise.all([getAdminStatistics(), getAdminTasks()]); setStatistics(nextStatistics); setTasks(nextTasks) } catch (error) { message.error(error instanceof Error ? error.message : '后台数据加载失败') } finally { setLoading(false) } }, [message])
  useEffect(() => { void load() }, [load])
  const openDetail = async (taskId: string) => { setDetailLoading(true); try { setDetail(await getAdminTaskDetail(taskId)) } catch { message.error('任务详情加载失败') } finally { setDetailLoading(false) } }
  const columns: TableColumnsType<AdminTask> = [
    { title: '品牌与任务', dataIndex: 'brandName', render: (_, record) => <div><strong className="table-primary">{record.brandName || '未命名品牌'}</strong><span className="table-secondary">{record.taskId} · {record.niceClass || '类别待补充'}</span></div> },
    { title: '目标国家', dataIndex: 'targetCountries', render: (countries: string[]) => <div className="tag-row">{countries.map((country) => <Tag key={country}>{country}</Tag>)}</div> },
    { title: '状态', dataIndex: 'status', width: 100, render: (value: AdminTask['status']) => <Tag color={value === 'done' ? 'green' : value === 'error' ? 'red' : 'blue'}>{statusText[value]}</Tag> },
    { title: '风险', dataIndex: 'riskLevel', width: 125, render: (value: AdminTask['riskLevel'], record) => value ? <RiskBadge level={value} score={record.riskScore} /> : <Tag>待评估</Tag> },
    { title: '处理进度', dataIndex: 'progress', width: 150, render: (value) => <Progress percent={value} size="small" /> },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
    { title: '操作', width: 140, render: (_, record) => <div className="table-actions"><Button onClick={() => void openDetail(record.taskId)} size="small">详情</Button><Button onClick={() => navigate(`/report/${record.taskId}`)} size="small" type="link">报告</Button></div> },
  ]

  return <div className="page-stack admin-shell">
    <PageHeader eyebrow="企业运营管理" title="后台管理驾驶舱" description="查看审查任务、用户规模、风险拦截、接口链路和系统健康度，保障业务持续运行。" actions={<Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新运营数据</Button>} />
    <div className="metric-grid"><MetricCard icon={<BarChartOutlined />} label="累计审查任务" value={statistics?.totalTasks ?? 0} unit="项" note={`${statistics?.processingTasks ?? 0} 项正在处理`} /><MetricCard icon={<WarningOutlined />} label="高风险拦截" value={statistics?.highRiskBlocked ?? 0} unit="项" note="提交前识别并进入人工处置" tone="danger" /><MetricCard icon={<SafetyCertificateOutlined />} label="完成品牌审查" value={statistics?.auditedBrands ?? 0} unit="个" note="结论与证据均已归档" tone="success" /><MetricCard icon={<TeamOutlined />} label="企业用户" value={statistics?.registeredUsers ?? 0} unit="人" note="覆盖法务、品牌与区域团队" /></div>
    <div className="admin-health-grid"><Card className="content-panel" title="系统健康度"><div className="health-list"><div><span><ApiOutlined />业务接口</span><Tag color="green">运行正常</Tag></div><div><span><DatabaseOutlined />规则数据库</span><Tag color="green">已同步</Tag></div><div><span><SafetyCertificateOutlined />审查引擎</span><Tag color="green">可用</Tag></div></div></Card><Card className="content-panel" title="服务指标"><div className="service-kpis"><div><strong>99.96%</strong><span>接口可用率</span></div><div><strong>1.8 秒</strong><span>平均响应</span></div><div><strong>15 分钟</strong><span>数据新鲜度</span></div></div></Card></div>
    <Card className="data-table-card" title="审查任务管理" extra={<span className="section-meta">共 {tasks.length} 条任务</span>}>{loading ? <Skeleton active paragraph={{ rows: 8 }} /> : <Table columns={columns} dataSource={tasks} pagination={{ pageSize: 8 }} rowKey="taskId" scroll={{ x: 1080 }} />}</Card>
    <Drawer open={Boolean(detail)} onClose={() => setDetail(null)} title="任务详情" width={640}>{detailLoading || !detail ? <Skeleton active /> : <div className="drawer-stack"><Descriptions bordered column={1} items={[{ key: 'id', label: '任务编号', children: detail.task_id }, { key: 'status', label: '任务状态', children: detail.status === 'done' ? '已完成' : detail.status }, { key: 'progress', label: '处理进度', children: `${detail.progress}%` }, { key: 'created', label: '创建时间', children: detail.created_at }, { key: 'updated', label: '更新时间', children: detail.updated_at }]} /><Card size="small" title="提交信息"><pre className="json-preview">{JSON.stringify(detail.request, null, 2)}</pre></Card><Card size="small" title="审查结果"><pre className="json-preview">{JSON.stringify(detail.result, null, 2)}</pre></Card></div>}</Drawer>
  </div>
}

export default Admin
