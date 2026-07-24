import { useState } from 'react'
import { RobotOutlined, SendOutlined, CloseOutlined, FileTextOutlined, PaperClipOutlined } from '@ant-design/icons'
import { Button, Input, Spin, Tag, Typography } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { askAssistant, type AssistantReply } from '@/api/assistant'

interface ChatMessage {
  role: 'assistant' | 'user'
  text: string
}

const pageActions: Record<string, string> = {
  '新建智能审查': '/submit',
  '查看品牌资产': '/assets',
  '浏览规则库': '/rules',
  '补充品牌资产': '/assets',
  '前往智能审查': '/submit',
  '检查提交材料': '/submit',
  '查看规则库': '/rules',
  '查看审查进度': '/reviewing',
  '查看报告中心': '/reports',
  '查看审查报告': '/reports',
}

export default function AiAssistant() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string>()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: '我是合规引导助手。可以协助你准备材料、理解风险和定位系统规则。' },
  ])
  const [reply, setReply] = useState<AssistantReply | null>(null)

  const send = async () => {
    const text = question.trim()
    if (!text || loading) return
    setQuestion('')
    setMessages((current) => [...current, { role: 'user', text }])
    setLoading(true)
    try {
      const nextReply = await askAssistant(text, location.pathname, imageDataUrl)
      setReply(nextReply)
      setMessages((current) => [...current, { role: 'assistant', text: nextReply.answer }])
      setImageDataUrl(undefined)
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: '暂时无法连接 AI 服务，请稍后重试。' }])
    } finally {
      setLoading(false)
    }
  }

  const attachImage = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/') || file.size > 4 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => setImageDataUrl(typeof reader.result === 'string' ? reader.result : undefined)
    reader.readAsDataURL(file)
  }

  return (
    <aside className={`ai-assistant ${open ? 'ai-assistant--open' : ''}`} aria-label="合规引导助手">
      {open && (
        <section className="ai-assistant__panel">
          <header className="ai-assistant__header">
            <div>
              <Typography.Text strong>合规引导助手</Typography.Text>
              <Typography.Text type="secondary">基于已授权资料回答</Typography.Text>
            </div>
            <Button type="text" icon={<CloseOutlined />} onClick={() => setOpen(false)} aria-label="收起助手" />
          </header>
          <div className="ai-assistant__dialogue">
            {messages.map((message, index) => (
              <p className={`ai-assistant__message ai-assistant__message--${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </p>
            ))}
            {loading && <Spin size="small" tip="正在检索已授权资料…" />}
          </div>
          {reply && (
            <div className="ai-assistant__evidence">
              {reply.sources.map((source) => <Tag icon={<FileTextOutlined />} key={source.id}>{source.title}</Tag>)}
              <div className="ai-assistant__actions">
                {reply.suggested_actions.map((action) => (
                  <Button key={action} size="small" onClick={() => navigate(pageActions[action] ?? '/')}>{action}</Button>
                ))}
              </div>
            </div>
          )}
          <div className="ai-assistant__composer">
            <div className="ai-assistant__input-stack">
              <Input.TextArea value={question} onChange={(event) => setQuestion(event.target.value)} onPressEnter={(event) => { if (!event.shiftKey) { event.preventDefault(); void send() } }} placeholder="输入你的合规问题" autoSize={{ minRows: 2, maxRows: 4 }} />
              <label className="ai-assistant__attachment">
                <PaperClipOutlined /> {imageDataUrl ? '图样已附加' : '附加图样（限 4MB）'}
                <input type="file" accept="image/*" onChange={(event) => attachImage(event.target.files?.[0])} />
              </label>
            </div>
            <Button type="primary" icon={<SendOutlined />} onClick={() => void send()} loading={loading} aria-label="发送问题" />
          </div>
        </section>
      )}
      <Button className="ai-assistant__launcher" type="primary" icon={<RobotOutlined />} onClick={() => setOpen((value) => !value)}>
        AI 引导
      </Button>
    </aside>
  )
}
