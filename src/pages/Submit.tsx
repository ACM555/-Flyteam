import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  List,
  Popconfirm,
  Row,
  Select,
  Space,
  Steps,
  Tag,
  Typography,
} from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { audit } from '@/api'
import LogoUpload from '@/components/LogoUpload'
import type { AuditFormData } from '@/types/audit'
import {
  getAuditHistory,
  removeAuditTask,
  saveAuditTask,
  setCurrentTaskId,
  type AuditHistoryItem,
} from '@/utils/auditHistory'

const { Paragraph, Title } = Typography

const initialForm: AuditFormData = {
  brandName: '',
  englishName: '',
  niceClass: '',
  goodsServices: '',
  targetMarkets: ['越南'],
  hasChinaBase: false,
  logo: '',
}

const COMMON_NICE_CLASSES = [
  '第43类-餐饮服务',
  '第25类-服装鞋帽',
  '第30类-方便食品',
  '第32类-啤酒饮料',
]

const NICE_CLASS_NAMES = [
  '化学原料',
  '颜料油漆',
  '日化用品',
  '燃料油脂',
  '医药用品',
  '金属材料',
  '机械设备',
  '手工器械',
  '科学仪器',
  '医疗器械',
  '灯具空调',
  '运输工具',
  '军火烟火',
  '珠宝钟表',
  '乐器',
  '办公用品',
  '橡胶制品',
  '皮革皮具',
  '建筑材料',
  '家具',
  '厨房洁具',
  '绳网袋篷',
  '纱线丝',
  '布料床单',
  '服装鞋帽',
  '钮扣拉链',
  '地毯席垫',
  '健身器材',
  '食品',
  '方便食品',
  '饲料种籽',
  '啤酒饮料',
  '酒',
  '烟草烟具',
  '广告销售',
  '金融物管',
  '建筑修理',
  '通讯服务',
  '运输贮藏',
  '材料加工',
  '教育娱乐',
  '网站服务',
  '餐饮服务',
  '医疗园艺',
  '法律服务',
]

const TARGET_MARKET_OPTIONS = [
  '越南',
  '泰国',
  '印尼',
  '马来西亚',
  '菲律宾',
  '新加坡',
  '柬埔寨',
  '老挝',
  '缅甸',
  '文莱',
].map((value) => ({ value, label: value }))

export const NICE_CLASS_OPTIONS = NICE_CLASS_NAMES.map(
  (name, index) => `第${index + 1}类-${name}`,
)
  .sort((a, b) => {
    const aIndex = COMMON_NICE_CLASSES.indexOf(a)
    const bIndex = COMMON_NICE_CLASSES.indexOf(b)

    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex
    if (aIndex >= 0) return -1
    if (bIndex >= 0) return 1

    return Number(a.match(/第(\d+)类/)?.[1] ?? 0) - Number(b.match(/第(\d+)类/)?.[1] ?? 0)
  })
  .map((value) => ({ value, label: value }))

function Submit() {
  const [form] = Form.useForm<AuditFormData>()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [history, setHistory] = useState<AuditHistoryItem[]>([])
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()

  const refreshHistory = () => setHistory(getAuditHistory())

  useEffect(() => {
    refreshHistory()
  }, [])

  const handleFinish = async (values: AuditFormData) => {
    setSubmitLoading(true)

    try {
      const requestPayload = { ...values, logo: values.logo.trim() }
      const result = await audit(requestPayload)
      saveAuditTask(result.data.taskId, requestPayload)
      refreshHistory()
      message.success('审查任务已提交')
      navigate('/reviewing', { state: { taskId: result.data.taskId } })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '请检查后端服务是否启动'
      message.error(`提交失败：${errorMsg}`)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleViewProgress = (item: AuditHistoryItem) => {
    setCurrentTaskId(item.taskId)
    navigate('/reviewing', { state: { taskId: item.taskId } })
  }

  const handleViewReport = (item: AuditHistoryItem) => {
    setCurrentTaskId(item.taskId)
    navigate(`/report/${item.taskId}`, { state: { taskId: item.taskId } })
  }

  const handleDeleteHistory = (taskId: string) => {
    removeAuditTask(taskId)
    refreshHistory()
    message.success('历史记录已删除')
  }

  const handleReset = () => {
    form.resetFields()
    message.info('表单已重置，可重新提交新的审查任务')
  }

  return (
    <div style={{ maxWidth: 1040 }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          品牌信息提交
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 0 }}>
          填写品牌资料，AI 将在 3-5 秒内完成越南商标合规审查。
        </Paragraph>
        <Steps
          current={0}
          items={[{ title: '填写信息' }, { title: 'AI 审查' }, { title: '查看报告' }]}
          size="small"
          style={{ marginTop: 18, maxWidth: 680 }}
        />
      </div>

      <Form<AuditFormData>
        form={form}
        initialValues={initialForm}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Card
          title="基础信息"
          style={{ marginBottom: 24 }}
          styles={{ body: { paddingBottom: 8 } }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="品牌名称"
                name="brandName"
                rules={[
                  { required: true, message: '请输入品牌名称' },
                  { max: 50, message: '品牌名称不能超过 50 个字符' },
                ]}
              >
                <Input placeholder="请输入品牌名称（支持中文/越南语）" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="品牌英文名称"
                name="englishName"
                rules={[
                  { required: true, message: '请输入品牌英文名称' },
                  { max: 100, message: '品牌英文名称不能超过 100 个字符' },
                  {
                    pattern: /^[a-zA-Z0-9\s\-&]+$/,
                    message: '仅允许字母、数字、空格、连字符和 &',
                  },
                ]}
              >
                <Input placeholder="请输入品牌英文名称" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="尼斯分类"
            name="niceClass"
            rules={[{ required: true, message: '请选择尼斯分类' }]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={NICE_CLASS_OPTIONS}
              placeholder="请选择尼斯分类"
            />
          </Form.Item>
        </Card>

        <Card title="品牌详情">
          <Form.Item
            label="商品/服务描述"
            name="goodsServices"
            rules={[
              { required: true, message: '请输入商品/服务描述' },
              { max: 500, message: '商品/服务描述不能超过 500 个字符' },
            ]}
          >
            <Input.TextArea
              maxLength={500}
              placeholder="请描述品牌主营业务、目标市场、出海计划等"
              rows={4}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="品牌 Logo"
            name="logo"
            rules={[{ required: true, message: '请上传品牌 Logo' }]}
          >
            <LogoUpload />
          </Form.Item>
        </Card>

        <Card
          title="跨域注册策略"
          style={{ marginTop: 24 }}
          styles={{ body: { paddingBottom: 8 } }}
        >
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item
                label="目标市场"
                name="targetMarkets"
                rules={[{ required: true, message: '请选择至少一个目标市场' }]}
              >
                <Select
                  mode="multiple"
                  options={TARGET_MARKET_OPTIONS}
                  placeholder="请选择目标市场"
                  maxTagCount="responsive"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item
                label="是否已有中国基础商标/申请"
                name="hasChinaBase"
                rules={[{ required: true, message: '请选择中国基础商标状态' }]}
              >
                <Select
                  options={[
                    { value: true, label: '已有中国注册/申请' },
                    { value: false, label: '暂无或不确定' },
                  ]}
                  placeholder="请选择"
                />
              </Form.Item>
            </Col>
          </Row>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            系统将根据目标市场数量、中国基础状态和核心市场覆盖情况，生成单国申请、马德里体系或混合路径建议。
          </Paragraph>
        </Card>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleReset}>重置</Button>
            <Button htmlType="submit" loading={submitLoading} type="primary">
              提交审查
            </Button>
          </Space>
        </div>
      </Form>

      <Card title="审查历史记录" style={{ marginTop: 24 }}>
        {history.length > 0 ? (
          <List
            dataSource={history}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key="progress" type="link" onClick={() => handleViewProgress(item)}>
                    查看进度
                  </Button>,
                  <Button key="report" type="link" onClick={() => handleViewReport(item)}>
                    查看报告
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="删除这条历史记录？"
                    description="只会删除本地历史，不会影响已生成的后端任务。"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => handleDeleteHistory(item.taskId)}
                  >
                    <Button danger type="link">
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <span>{item.brandName || item.englishName || '未命名品牌'}</span>
                      <Tag color="blue">{item.niceClass || '未填写类别'}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <span>{item.goodsServices}</span>
                      <span>
                        目标市场：{item.targetMarkets.join('、') || '未填写'} · 中国基础：
                        {item.hasChinaBase ? '已有' : '暂无或不确定'} · 提交时间：
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      <span>任务ID：{item.taskId}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无历史记录，提交一次审查后会显示在这里" />
        )}
      </Card>
    </div>
  )
}

export default Submit
