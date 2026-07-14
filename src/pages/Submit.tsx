import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Steps,
  Typography,
} from 'antd'
import { ArrowRightOutlined, InfoCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import type { SelectProps } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { audit } from '@/api'
import LogoUpload from '@/components/LogoUpload'
import type { AuditFormData } from '@/types/audit'

const { Paragraph, Text, Title } = Typography

type AccessibleSelectProps = SelectProps & { 'aria-required'?: boolean }

function AccessibleSelect({ 'aria-required': _ariaRequired, ...props }: AccessibleSelectProps) {
  return <Select {...props} />
}

const initialForm: AuditFormData = {
  brandName: '',
  englishName: '',
  niceClass: '',
  goodsServices: '',
  logo: '',
}

const COMMON_NICE_CLASSES = [
  '第43类-餐饮服务',
  '第25类-服装鞋帽',
  '第30类-方便食品',
  '第32类-啤酒饮料',
]

const NICE_CLASS_NAMES = [
  '化学原料', '颜料油漆', '日化用品', '燃料油脂', '医药用品', '金属材料', '机械设备', '手工器械',
  '科学仪器', '医疗器械', '灯具空调', '运输工具', '军火烟火', '珠宝钟表', '乐器', '办公用品',
  '橡胶制品', '皮革皮具', '建筑材料', '家具', '厨房洁具', '绳网袋篷', '纱线丝', '布料床单',
  '服装鞋帽', '钮扣拉链', '地毯席垫', '健身器材', '食品', '方便食品', '饲料种籽', '啤酒饮料',
  '酒', '烟草烟具', '广告销售', '金融物管', '建筑修理', '通讯服务', '运输贮藏', '材料加工',
  '教育娱乐', '网站服务', '餐饮服务', '医疗园艺', '法律服务',
]

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
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()

  const handleFinish = async (values: AuditFormData) => {
    setSubmitLoading(true)

    try {
      const result = await audit({ ...values, logo: values.logo.trim() })
      const taskId = result.data.taskId
      message.success('审查任务已提交')
      navigate(`/reviewing?taskId=${encodeURIComponent(taskId)}`, { state: { taskId } })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '请检查后端服务是否启动'
      message.error(`提交失败：${errorMessage}`)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="page-shell submit-page">
      <header className="page-header">
        <Text className="page-kicker">新建审查任务</Text>
        <Title className="page-title">提交商标资料</Title>
        <Paragraph className="page-description">
          填写拟申请商标与商品服务信息。系统将执行图形分析、法条筛查、冲突检索并生成可下载报告。
        </Paragraph>
        <Steps
          className="submission-steps"
          current={0}
          items={[{ title: '提交资料' }, { title: '智能审查' }, { title: '查看报告' }]}
          responsive
          size="small"
        />
      </header>

      <Form<AuditFormData>
        form={form}
        initialValues={initialForm}
        layout="vertical"
        onFinish={handleFinish}
        onFinishFailed={({ errorFields }) => {
          const firstField = errorFields[0]?.name
          if (firstField) form.scrollToField(firstField, { behavior: 'smooth', block: 'center' })
        }}
        requiredMark="optional"
      >
        <div className="submit-layout">
          <div className="submit-form-column">
            <Card className="surface-card form-section-card" title="基础信息">
              <div className="form-grid">
                <Form.Item
                  label="商标名称"
                  name="brandName"
                  rules={[
                    { required: true, message: '请输入商标名称' },
                    { max: 50, message: '商标名称不能超过 50 个字符' },
                  ]}
                >
                  <Input autoComplete="organization" placeholder="例如：墨兰奶白或 Mộc Lan" />
                </Form.Item>
                <Form.Item
                  extra="没有英文名称时可以留空"
                  label="英文名称"
                  name="englishName"
                  rules={[
                    { max: 100, message: '英文名称不能超过 100 个字符' },
                    {
                      pattern: /^[a-zA-Z0-9\s\-&]*$/,
                      message: '仅允许字母、数字、空格、连字符和 &',
                    },
                  ]}
                >
                  <Input autoComplete="off" placeholder="例如：Moc Lan" />
                </Form.Item>
              </div>

              <Form.Item
                label="尼斯分类"
                name="niceClass"
                rules={[{ required: true, message: '请选择尼斯分类' }]}
              >
                <AccessibleSelect
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={NICE_CLASS_OPTIONS}
                  placeholder="搜索并选择第 1-45 类"
                />
              </Form.Item>

              <Form.Item
                label="商品或服务描述"
                name="goodsServices"
                rules={[
                  { required: true, message: '请输入商品或服务描述' },
                  { max: 500, message: '商品或服务描述不能超过 500 个字符' },
                ]}
              >
                <Input.TextArea
                  maxLength={500}
                  placeholder="描述主营商品、服务内容与计划进入的越南市场场景"
                  rows={6}
                  showCount
                />
              </Form.Item>
            </Card>

            <Card className="surface-card form-section-card" title="商标图样">
              <Form.Item
                label="品牌 Logo"
                name="logo"
                rules={[{ required: true, message: '请上传品牌 Logo' }]}
              >
                <LogoUpload />
              </Form.Item>
            </Card>
          </div>

          <aside className="submit-guidance" aria-label="提交说明">
            <Card className="surface-card guidance-card">
              <div className="guidance-icon"><SafetyCertificateOutlined /></div>
              <Title level={3}>提交前检查</Title>
              <ul>
                <li>商标名称与计划使用名称保持一致</li>
                <li>尼斯分类与商品服务描述相互匹配</li>
                <li>上传清晰、无多余背景的 JPG 或 PNG 图样</li>
              </ul>
            </Card>
            <div className="privacy-note">
              <InfoCircleOutlined />
              <Text>提交即表示你确认资料可用于本次自动化风险分析。</Text>
            </div>
          </aside>
        </div>

        <div className="form-actions">
          <Space wrap>
            <Button disabled={submitLoading} onClick={() => form.resetFields()}>
              清空资料
            </Button>
            <Button
              aria-label="提交并开始审查"
              htmlType="submit"
              icon={<ArrowRightOutlined />}
              loading={submitLoading}
              size="large"
              type="primary"
            >
              提交并开始审查
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}

export default Submit
