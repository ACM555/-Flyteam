import { ArrowRightOutlined, CheckCircleOutlined, GlobalOutlined, LockOutlined, RadarChartOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Card, Form, Input, Space, Typography } from 'antd'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { usePresentation } from '@/context/PresentationContext'

const { Text, Title } = Typography
interface AuthProps { mode: 'login' | 'register' }
interface AuthFormValues { username: string; password: string; company?: string; inviteCode?: string }

function Auth({ mode }: AuthProps) {
  const [form] = Form.useForm<AuthFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const { message } = AntdApp.useApp()
  const { login, register } = useAuth()
  const { demoEnabled, enterDemo } = usePresentation()
  const isRegister = mode === 'register'

  const destination = () => new URLSearchParams(location.search).get('from') || '/'
  const handleFinish = async (values: AuthFormValues) => {
    setSubmitting(true)
    try {
      const payload = { ...values, username: values.username.trim(), company: values.company?.trim(), inviteCode: values.inviteCode?.trim() }
      const user = isRegister ? await register(payload) : await login({ username: payload.username, password: payload.password })
      message.success(isRegister ? '企业账户创建成功' : '登录成功')
      navigate(user.role === 'admin' ? '/admin' : destination(), { replace: true })
    } catch {
      // 请求层统一展示后端校验信息。
    } finally { setSubmitting(false) }
  }

  const openDemo = () => { enterDemo(); message.success('已进入比赛演示空间'); navigate(destination(), { replace: true }) }
  return (
    <main className="auth-shell">
      <div className="auth-scene-grid" aria-hidden="true" />
      <motion.section className="auth-intro" initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="auth-brand-lockup"><img alt="东盟商标合规智能体" src="/assets/brand/outbound-guard-mark.svg" /><div><strong>东盟商标合规智能体</strong><span>OUTBOUND GUARD · CORPORATE IP RISK</span></div></div>
        <Title level={1}>中国企业出海的<br />商标风险驾驶舱</Title>
        <Typography.Paragraph>把注册前预检、跨类别保护、公告期监控与证据报告接入同一条法务工作流，让每一次市场进入决策可解释、可追踪、可执行。</Typography.Paragraph>
        <div className="auth-capabilities">
          <div className="auth-capability"><SafetyCertificateOutlined /><strong>注册前智能预检</strong><span>同步判断文字、图形、类别与绝对禁用风险。</span></div>
          <div className="auth-capability"><GlobalOutlined /><strong>东盟六国规则</strong><span>统一查看审查重点、异议窗口和注册路径。</span></div>
          <div className="auth-capability"><RadarChartOutlined /><strong>公告期持续监控</strong><span>近似申请、规则变更和处理窗口实时进入队列。</span></div>
        </div>
        <div className="auth-console"><div className="auth-console-head"><strong>实时合规控制台</strong><span className="live-indicator"><span className="live-indicator-dot" />数据链路在线</span></div><div className="auth-console-body"><span className="auth-scanline" /><div className="auth-console-lines"><span style={{ width: '86%' }} /><span style={{ width: '62%' }} /><span style={{ width: '74%' }} /></div></div></div>
      </motion.section>
      <motion.section className="auth-form-panel" initial={reduceMotion ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08, duration: 0.45 }}>
        <Card className="auth-card">
          <div className="auth-card-title"><Text className="page-eyebrow"><LockOutlined />企业安全入口</Text><Title level={2}>{isRegister ? '创建企业账户' : '账户登录'}</Title><p>{isRegister ? '创建团队成员账户并接入商标合规工作空间。' : '登录后查看审查、报告、监控和品牌资产。'}</p></div>
          <Form<AuthFormValues> form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item label="用户名" name="username" normalize={(value: string) => value?.trim()} rules={[{ required: true, message: '请输入用户名' }, { min: 2, message: '用户名至少 2 个字符' }, { max: 32, message: '用户名不能超过 32 个字符' }]}><Input autoComplete="username" prefix={<UserOutlined />} placeholder="请输入用户名" /></Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }, { min: isRegister ? 6 : 1, message: '密码至少 6 位' }]}><Input.Password autoComplete={isRegister ? 'new-password' : 'current-password'} prefix={<LockOutlined />} placeholder="请输入密码" /></Form.Item>
            {isRegister ? <><Form.Item label="企业或团队" name="company"><Input placeholder="例如：某某科技有限公司" /></Form.Item><Form.Item label="后台邀请码" name="inviteCode"><Input placeholder="普通成员可留空" prefix={<LockOutlined />} /></Form.Item></> : null}
            <Button block htmlType="submit" loading={submitting} size="large" type="primary">{isRegister ? '注册并进入系统' : '登录'}</Button>
          </Form>
          <div className="auth-trust-note"><CheckCircleOutlined />登录凭据仅用于身份校验；审查数据通过加密通道传输，所有演示操作与生产数据完全隔离。</div>
          {!isRegister && demoEnabled ? <Button block className="demo-entry" icon={<ArrowRightOutlined />} onClick={openDemo}>一键进入比赛演示空间</Button> : null}
          <div className="auth-switch">{isRegister ? <Text type="secondary">已有账户？<Link to="/login">立即登录</Link></Text> : <Text type="secondary">没有账户？<Link to="/register">创建企业账户</Link></Text>}</div>
          <Space className="auth-source-line" size={8} wrap><Text type="secondary">可信数据来源：</Text><Text>NOIP</Text><Text>WIPO</Text><Text>TMview</Text></Space>
        </Card>
      </motion.section>
    </main>
  )
}

export default Auth
