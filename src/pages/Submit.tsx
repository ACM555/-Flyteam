import { CheckOutlined, MinusCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Card, Form, Input, InputNumber, Progress, Radio, Select, Switch, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { audit } from '@/api'
import { getCountryRules, type CountryRule } from '@/api/platform'
import { PageHeader } from '@/components/DesignSystem'
import LogoUpload from '@/components/LogoUpload'
import { ScanFeedback } from '@/components/MotionKit'
import type { AuditFormData } from '@/types/audit'

const initialForm: AuditFormData = { brandName: '', englishName: '', niceClass: '', goodsServices: '', targetCountries: ['越南'], operationStage: 'pre-entry', plannedMarkets: 1, hasChinaBaseMark: false, logo: '' }
const countries = ['越南', '泰国', '印度尼西亚', '马来西亚', '菲律宾', '新加坡'].map((country) => ({ value: country, label: country }))
const classNames = ['化学原料', '颜料油漆', '日化用品', '燃料油脂', '医药用品', '金属材料', '机械设备', '手工器械', '科学仪器', '医疗器械', '灯具空调', '运输工具', '军火烟火', '珠宝钟表', '乐器', '办公用品', '橡胶制品', '皮革皮具', '建筑材料', '家具', '厨房洁具', '绳网袋篷', '纱线丝', '布料床单', '服装鞋帽', '钮扣拉链', '地毯席垫', '健身器材', '食品', '方便食品', '饲料种籽', '啤酒饮料', '酒', '烟草烟具', '广告销售', '金融物管', '建筑修理', '通讯服务', '运输贮藏', '材料加工', '教育娱乐', '网站服务', '餐饮服务', '医疗园艺', '法律服务']
export const NICE_CLASS_OPTIONS = classNames.map((name, index) => ({ value: `第 ${index + 1} 类 ${name}`, label: `第 ${index + 1} 类 ${name}` }))
const sampleLogo = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlWnYQAAAAASUVORK5CYII='

function Submit() {
  const [form] = Form.useForm<AuditFormData>()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [countryRules, setCountryRules] = useState<CountryRule[]>([])
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const selectedCountries = Form.useWatch('targetCountries', form) ?? initialForm.targetCountries
  const values = Form.useWatch([], form) ?? initialForm
  useEffect(() => { getCountryRules().then(setCountryRules).catch(() => setCountryRules([])) }, [])
  const activeCountryRules = useMemo(() => countryRules.filter((rule) => selectedCountries?.includes(rule.country)), [countryRules, selectedCountries])
  const checklist = [
    { label: '品牌中文名称已填写', ok: Boolean(values.brandName?.trim()) },
    { label: '英文名称格式有效', ok: /^[a-zA-Z0-9\s\-&]+$/.test(values.englishName ?? '') },
    { label: '尼斯分类已选择', ok: Boolean(values.niceClass) },
    { label: '商品或服务描述已填写', ok: Boolean(values.goodsServices?.trim()) },
    { label: '至少选择一个目标国家', ok: (selectedCountries?.length ?? 0) > 0 },
    { label: '品牌图样已上传', ok: Boolean(values.logo) },
  ]
  const readyCount = checklist.filter((item) => item.ok).length
  const completion = Math.round(readyCount / checklist.length * 100)
  const fillDemo = () => form.setFieldsValue({ brandName: '墨兰奶白', englishName: 'Molan Tea', niceClass: '第 43 类 餐饮服务', goodsServices: '茶饮店、咖啡馆、餐厅及外卖服务，计划进入越南与泰国核心城市。', targetCountries: ['越南', '泰国'], operationStage: 'pre-entry', plannedMarkets: 3, hasChinaBaseMark: false, logo: sampleLogo })
  const handleFinish = async (formValues: AuditFormData) => { setSubmitLoading(true); try { const result = await audit({ ...formValues, logo: formValues.logo.trim() }); message.success('审查任务已提交'); navigate('/reviewing', { state: { taskId: result.data.taskId } }) } catch (error) { message.error(`提交失败：${error instanceof Error ? error.message : '请确认服务状态'}`) } finally { setSubmitLoading(false) } }

  return <div className="page-stack submit-page">
    <PageHeader eyebrow="三步智能审查" title="品牌信息提交" description="填写品牌、目标市场和出海阶段，系统将完成规则检索、图形比对、跨类保护与注册路径分析。" actions={<Button onClick={fillDemo}>填入比赛示例</Button>} />
    <div className="workflow-steps"><div className="active"><span>1</span><strong>填写信息</strong></div><div><span>2</span><strong>智能审查</strong></div><div><span>3</span><strong>查看报告</strong></div></div>
    <Form<AuditFormData> form={form} initialValues={initialForm} layout="vertical" onFinish={handleFinish}>
      <div className="submit-layout"><div className="submit-main">
        <Card className="content-panel" title="基础信息"><div className="form-grid-two"><Form.Item label="品牌中文名称" name="brandName" rules={[{ required: true, message: '请输入品牌中文名称' }, { max: 50 }]}><Input placeholder="请输入品牌名称" /></Form.Item><Form.Item label="品牌英文名称" name="englishName" rules={[{ required: true, message: '请输入品牌英文名称' }, { pattern: /^[a-zA-Z0-9\s\-&]+$/, message: '仅允许字母、数字、空格、连字符和 & 符号' }]}><Input placeholder="例如 Molan Tea" /></Form.Item></div><Form.Item label="尼斯分类" name="niceClass" rules={[{ required: true, message: '请选择尼斯分类' }]}><Select showSearch optionFilterProp="label" options={NICE_CLASS_OPTIONS} placeholder="请选择尼斯分类" /></Form.Item></Card>
        <Card className="content-panel" title="出海策略"><div className="form-grid-two"><Form.Item label="目标国家" name="targetCountries" rules={[{ required: true, message: '请至少选择一个国家' }]}><Select mode="multiple" options={countries} placeholder="请选择目标国家" /></Form.Item><Form.Item label="计划覆盖市场数" name="plannedMarkets"><InputNumber min={1} max={10} style={{ width: '100%' }} /></Form.Item></div><div className="form-grid-two"><Form.Item label="当前阶段" name="operationStage"><Radio.Group optionType="button" buttonStyle="solid" options={[{ value: 'pre-entry', label: '注册前预检' }, { value: 'launching', label: '注册中导航' }, { value: 'operating', label: '注册后监控' }]} /></Form.Item><Form.Item label="已有中国基础商标" name="hasChinaBaseMark" valuePropName="checked"><Switch checkedChildren="有" unCheckedChildren="无" /></Form.Item></div></Card>
        <Card className="content-panel" title="品牌详情"><Form.Item label="商品或服务描述" name="goodsServices" rules={[{ required: true, message: '请输入商品或服务描述' }, { max: 500 }]}><Input.TextArea maxLength={500} placeholder="描述主营业务、目标客户和市场进入计划" rows={4} showCount /></Form.Item><Form.Item label="品牌图样" name="logo" rules={[{ required: true, message: '请上传品牌图样' }]}><LogoUpload /></Form.Item></Card>
      </div><aside className="submit-aside">
        <Card className="content-panel submit-progress-card" title="提交检查台"><div className="completion-ring"><Progress percent={completion} type="circle" size={96} strokeColor="#087f8c" /><ScanFeedback active={completion < 100} /></div><div className="submit-checklist">{checklist.map((item) => <div className={`submit-check-item ${item.ok ? 'ok' : ''}`} key={item.label}>{item.ok ? <CheckOutlined /> : <MinusCircleOutlined />}{item.label}</div>)}</div><Button block disabled={completion < 100} htmlType="submit" loading={submitLoading} size="large" type="primary">提交智能审查</Button></Card>
        <Card className="content-panel" title="目标国规则摘要">{activeCountryRules.length ? activeCountryRules.map((rule) => <div className="country-rule" key={rule.country}><div className="country-rule-title"><SafetyCertificateOutlined /><strong>{rule.country}</strong></div><p>{rule.reviewFocus}</p><div className="tag-row">{rule.riskTags.slice(0, 4).map((tag) => <Tag key={tag}>{tag}</Tag>)}</div><small>{rule.legalBasis}</small></div>) : <p className="empty-copy">选择目标国家后显示对应规则。</p>}</Card>
      </aside></div>
    </Form>
  </div>
}

export default Submit
