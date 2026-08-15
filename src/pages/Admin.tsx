import {
  BarChartOutlined,
  CloudServerOutlined,
  LogoutOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminStatistics,
  getAdminSystemStatus,
  getAdminTaskDetail,
  getAdminTasks,
  getAdminUsers,
  type AdminStatistics,
  type AdminSystemStatus,
  type AdminTask,
  type AdminTaskDetail,
  type AdminUser,
} from '@/api/admin'
import { useAuth } from '@/context/AuthContext'

const { Paragraph, Text, Title } = Typography

const riskColor = {
  high: 'red',
  medium: 'orange',
  low: 'green',
  '': 'default',
} as const

const statusText = {
  pending: '等待中',
  processing: '审查中',
  done: '已完成',
  error: '失败',
} as const

function Admin() {
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const { user, logout } = useAuth()
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null)
  const [tasks, setTasks] = useState<AdminTask[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [systemStatus, setSystemStatus] = useState<AdminSystemStatus | null>(null)
  const [detail, setDetail] = useState<AdminTaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [nextStatistics, nextTasks, nextUsers, nextSystemStatus] = await Promise.all([
        getAdminStatistics(),
        getAdminTasks(),
        getAdminUsers(),
        getAdminSystemStatus(),
      ])
      setStatistics(nextStatistics)
      setTasks(nextTasks)
      setUsers(nextUsers)
      setSystemStatus(nextSystemStatus)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '后台数据加载失败'
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openDetail = async (taskId: string) => {
    setDetailLoading(true)
    try {
      setDetail(await getAdminTaskDetail(taskId))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '任务详情加载失败'
      message.error(errorMsg)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const columns: TableColumnsType<AdminTask> = [
    {
      title: '品牌',
      dataIndex: 'brandName',
      key: 'brandName',
      render: (value: string, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{value || '未命名品牌'}</Text>
          <Text type="secondary">{record.niceClass || '未选择类别'}</Text>
        </Space>
      ),
    },
    {
      title: '目标国家',
      dataIndex: 'targetCountries',
      key: 'targetCountries',
      render: (countries: string[]) => (
        <Space size={[4, 4]} wrap>
          {(countries || []).map((country, index) => <Tag key={`${country}-${index}`}>{country}</Tag>)}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: AdminTask['status']) => <Tag color={value === 'done' ? 'green' : value === 'error' ? 'red' : 'blue'}>{statusText[value]}</Tag>,
    },
    {
      title: '风险',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (value: AdminTask['riskLevel'], record) => (
        <Space direction="vertical" size={2}>
          <Tag color={riskColor[value]}>{value ? value.toUpperCase() : 'N/A'}</Tag>
          <Progress percent={record.riskScore || 0} size="small" />
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button onClick={() => openDetail(record.taskId)} size="small">
            详情
          </Button>
          <Button onClick={() => navigate(`/report/${record.taskId}`)} size="small" type="link">
            报告
          </Button>
        </Space>
      ),
    },
  ]

  const userColumns: TableColumnsType<AdminUser> = [
    { title: '账号', dataIndex: 'username', key: 'username', render: (value: string) => <Text strong>{value}</Text> },
    { title: '角色', dataIndex: 'role', key: 'role', render: (value: AdminUser['role']) => <Tag color={value === 'superadmin' ? 'gold' : 'blue'}>{value === 'superadmin' ? '超级管理员' : '普通用户'}</Tag> },
    { title: '企业/团队', dataIndex: 'company', key: 'company' },
    { title: '活跃会话', dataIndex: 'activeSessions', key: 'activeSessions', align: 'center' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (value: string) => new Date(value).toLocaleString() },
  ]

  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <Title level={2}>超级管理员控制台</Title>
          <Paragraph type="secondary">
            超级管理员 {user?.username} 正在查看审查任务、风险分布、用户与系统运行状态。
          </Paragraph>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>
            刷新
          </Button>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="总任务" value={statistics?.totalTasks ?? 0} prefix={<BarChartOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="高风险拦截" value={statistics?.highRiskBlocked ?? 0} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="审查完成" value={statistics?.auditedBrands ?? 0} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="注册用户" value={statistics?.registeredUsers ?? 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        title="系统运行状态"
        style={{ marginTop: 24 }}
        extra={<Tag color={systemStatus?.database === 'online' ? 'green' : 'default'}>{systemStatus?.database === 'online' ? '数据库在线' : '检查中'}</Tag>}
      >
        <Descriptions
          column={{ xs: 1, sm: 2, lg: 4 }}
          items={[
            { key: 'database', label: '数据服务', children: <Space><CloudServerOutlined />SQLite 在线</Space> },
            { key: 'sessions', label: '活跃会话', children: systemStatus?.activeSessions ?? 0 },
            { key: 'processing', label: '待处理任务', children: systemStatus?.taskStatus.processing ?? 0 },
            { key: 'checked', label: '最近巡检', children: systemStatus ? new Date(systemStatus.checkedAt).toLocaleString() : '—' },
          ]}
        />
      </Card>

      <Card
        title="审查任务管理"
        style={{ marginTop: 24 }}
        extra={<Text type="secondary">共 {tasks.length} 条</Text>}
      >
        {tasks.length ? (
          <Table<AdminTask>
            columns={columns}
            dataSource={tasks}
            loading={loading}
            pagination={{ pageSize: 8 }}
            rowKey="taskId"
            scroll={{ x: 960 }}
          />
        ) : (
          <Empty description="暂无审查任务" />
        )}
      </Card>

      <Card
        title="用户与权限"
        style={{ marginTop: 24 }}
        extra={<Text type="secondary">仅超级管理员可访问</Text>}
      >
        <Table<AdminUser>
          columns={userColumns}
          dataSource={users}
          loading={loading}
          pagination={{ pageSize: 8 }}
          rowKey="userId"
          scroll={{ x: 860 }}
        />
      </Card>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="任务详情"
        width={620}
      >
        {detailLoading || !detail ? (
          <Empty description="正在加载任务详情" />
        ) : (
          <Space direction="vertical" size={18} style={{ display: 'flex' }}>
            <Descriptions
              column={1}
              bordered
              items={[
                { key: 'id', label: '任务 ID', children: detail.task_id },
                { key: 'status', label: '状态', children: detail.status },
                { key: 'progress', label: '进度', children: `${detail.progress}%` },
                { key: 'created', label: '创建时间', children: new Date(detail.created_at).toLocaleString() },
                { key: 'updated', label: '更新时间', children: new Date(detail.updated_at).toLocaleString() },
              ]}
            />
            <Card size="small" title="提交信息">
              <pre className="json-preview">{JSON.stringify(detail.request, null, 2)}</pre>
            </Card>
            <Card size="small" title="审查结果">
              {detail.result ? (
                <pre className="json-preview">{JSON.stringify(detail.result, null, 2)}</pre>
              ) : (
                <Empty description="暂无结果" />
              )}
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  )
}

export default Admin
