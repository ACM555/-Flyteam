import {
  AlertOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  GlobalOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { App as AntdApp, Button, Card, Form, Input, Space, Tag, Typography } from 'antd'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const { Paragraph, Text, Title } = Typography

interface AuthProps {
  mode: 'login' | 'register'
}

interface AuthFormValues {
  username: string
  password: string
  company?: string
  inviteCode?: string
}

const valueProps = [
  {
    icon: <SafetyCertificateOutlined />,
    title: '注册前预检',
    text: '文字、图形、类别与禁用条款同步审查',
  },
  {
    icon: <GlobalOutlined />,
    title: '跨类保护',
    text: '识别驰名商标、权利族和跨境冲突',
  },
  {
    icon: <AlertOutlined />,
    title: '公告期监控',
    text: '抢注、异议窗口、法规变化持续提醒',
  },
]

const trustMetrics = [
  { label: '能力模块', suffix: '大', value: '6' },
  { label: '数据源', suffix: '路', value: '4' },
  { label: '报告生成', suffix: 'PDF', value: '1' },
  { label: '监控链路', suffix: '闭环', value: '7×24' },
]

function Auth({ mode }: AuthProps) {
  const [form] = Form.useForm<AuthFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = AntdApp.useApp()
  const { login, register } = useAuth()
  const isRegister = mode === 'register'

  const handleFinish = async (values: AuthFormValues) => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        username: values.username.trim(),
        company: values.company?.trim(),
        inviteCode: values.inviteCode?.trim(),
      }
      const user = isRegister
        ? await register(payload)
        : await login({ username: payload.username, password: payload.password })
      message.success(isRegister ? '注册成功' : '登录成功')
      const from = new URLSearchParams(location.search).get('from')
      navigate(from || (user.role === 'superadmin' ? '/admin' : '/'), { replace: true })
    } catch {
      // Request interceptor already shows the backend validation message.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell auth-shell-pro">
      <div className="auth-photo-layer" aria-hidden="true" />
      <div className="auth-grid-layer-pro" aria-hidden="true" />
      <div className="auth-light auth-light-one" aria-hidden="true" />
      <div className="auth-light auth-light-two" aria-hidden="true" />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="auth-intro auth-intro-pro"
        initial={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-brand-row">
          <img alt="Outbound Guard" src="/assets/brand/outbound-guard-mark.svg" />
          <div>
            <Text className="auth-kicker">Outbound Guard · Corporate IP Risk Platform</Text>
            <Text>面向中国品牌进入东盟市场的 AI 风险控制系统</Text>
          </div>
        </div>

        <Title>企业商标出海合规入口</Title>
        <Paragraph>
          把注册前预检、跨类保护、公告期监控和报告归档整合为一套可上线的企业级法律科技 SaaS，
          让评审一眼看到产品闭环，而不是单点演示。
        </Paragraph>

        <div className="auth-value-list">
          {valueProps.map((item) => (
            <div className="auth-value-item" key={item.title}>
              <span>{item.icon}</span>
              <div>
                <strong>{item.title}</strong>
                <Text>{item.text}</Text>
              </div>
            </div>
          ))}
        </div>

        <div className="auth-metrics-strip">
          {trustMetrics.map((item) => (
            <div key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.suffix}</span>
              <Text>{item.label}</Text>
            </div>
          ))}
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="auth-command-card"
          initial={{ opacity: 0, y: 18 }}
          transition={{ delay: 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="command-card-head">
            <div>
              <Text className="auth-kicker">AI COMPLIANCE CONSOLE</Text>
              <strong>实时合规风控台</strong>
            </div>
            <Tag color="cyan">Live</Tag>
          </div>
          <div className="command-card-body">
            <div className="security-thumb">
              <img alt="数据安全风控界面" src="/assets/photos/auth-data-security.webp" />
              <div className="security-scan" />
            </div>
            <div className="risk-lines">
              <span style={{ width: '86%' }} />
              <span style={{ width: '62%' }} />
              <span style={{ width: '72%' }} />
            </div>
            <div className="risk-node node-one" />
            <div className="risk-node node-two" />
            <div className="risk-node node-three" />
          </div>
        </motion.div>
      </motion.section>

      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="auth-form-panel"
        initial={{ opacity: 0, x: 28 }}
        transition={{ delay: 0.08, duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="auth-card auth-card-pro">
          <Space direction="vertical" size={6} style={{ display: 'flex', marginBottom: 24 }}>
            <Tag className="secure-access-tag" icon={<LockOutlined />}>
              Secure Access
            </Tag>
            <Title level={3}>{isRegister ? '创建企业账号' : '账号登录'}</Title>
            <Text type="secondary">
              {isRegister
                ? '创建普通成员账号；系统管理权限仅由超级管理员在本地配置。'
                : '请输入账号密码进入商标合规风控系统。'}
            </Text>
          </Space>

          <Form<AuthFormValues> form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item
              label="用户名"
              name="username"
              normalize={(value: string) => value?.trim()}
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少 2 个字符' },
                { max: 32, message: '用户名不能超过 32 个字符' },
              ]}
            >
              <Input autoComplete="username" prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: isRegister ? 6 : 1, message: '密码至少 6 位' },
              ]}
            >
              <Input.Password
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>
            {isRegister ? (
              <>
                <Form.Item label="企业/团队" name="company">
                  <Input placeholder="例如 Flyteam 法律科技" />
                </Form.Item>
              </>
            ) : null}
            <Button block htmlType="submit" loading={submitting} size="large" type="primary">
              {isRegister ? '注册并进入系统' : '登录'}
            </Button>
          </Form>

          <div className="auth-card-footer">
            <Space size={8}>
              <CheckCircleOutlined />
              <Text type="secondary">登录后可访问审查、报告、监控和资产管理能力。</Text>
            </Space>
          </div>

          <div className="auth-switch">
            {isRegister ? (
              <Text type="secondary">
                已有账号？ <Link to="/login">去登录</Link>
              </Text>
            ) : (
              <Text type="secondary">
                没有账号？ <Link to="/register">注册账号</Link>
              </Text>
            )}
          </div>
        </Card>

        <div className="auth-side-card">
          <img alt="企业合规办公场景" src="/assets/photos/auth-corporate-legal.webp" />
          <div>
            <FileDoneOutlined />
            <Text>证据链报告 · 中英越文档 · PDF 归档</Text>
          </div>
          <div>
            <DatabaseOutlined />
            <Text>NOIP / WIPO / TMview / 本地规则库</Text>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Auth
