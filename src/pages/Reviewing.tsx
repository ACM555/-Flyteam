import { CheckCircleOutlined, ClockCircleOutlined, FileSearchOutlined, LoadingOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Progress, Result, Space, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAuditResult } from '@/api/audit'
import { usePresentation } from '@/context/PresentationContext'

const steps = [
  { title: '规则检索', detail: '匹配目标国绝对禁用与相对理由条款', log: '已加载越南、泰国及跨库检索规则' },
  { title: '视觉比对', detail: '提取图形轮廓、布局和视觉重心特征', log: '图样特征向量生成完成，开始近似比对' },
  { title: '跨类分析', detail: '识别驰名商标、关联类别和混淆风险', log: '已发现需要重点关注的跨类保护信号' },
  { title: '证据整理', detail: '归集规则依据、数据来源与比对结果', log: '证据链与检索时间戳已归档' },
  { title: '报告生成', detail: '生成管理层摘要、处置建议和导出材料', log: '风险结论已汇总，报告即将生成' },
]
type Status = 'running' | 'success' | 'error'

function Reviewing() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mode } = usePresentation()
  const taskId = (location.state as { taskId?: string } | null)?.taskId || (mode === 'demo' ? 'demo-high-risk' : '')
  const [currentStep, setCurrentStep] = useState(0)
  const [status, setStatus] = useState<Status>('running')
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    if (!taskId) { setStatus('error'); setError('缺少审查任务编号，请从品牌信息提交页重新进入。'); return }
    let cancelled = false
    const run = async () => {
      try {
        if (mode === 'demo') {
          for (let index = 0; index < steps.length; index += 1) {
            if (cancelled) return
            setCurrentStep(index); setLogs((items) => [...items, `${new Date().toLocaleTimeString('zh-CN', { hour12: false })} · ${steps[index].log}`])
            await new Promise((resolve) => window.setTimeout(resolve, 540))
          }
          await getAuditResult(taskId)
          if (!cancelled) setStatus('success')
          return
        }
        const result = await getAuditResult(taskId)
        if (cancelled) return
        if (result.status === 'error') { setStatus('error'); setError(result.errorMessage || '审查服务未能完成任务。'); return }
        const nextStep = Math.min(result.currentStep ?? 0, steps.length - 1)
        setCurrentStep(nextStep); setLogs((items) => [...items, `${new Date().toLocaleTimeString('zh-CN', { hour12: false })} · ${steps[nextStep].log}`])
        if (result.status === 'done') setStatus('success')
        else window.setTimeout(run, 1600)
      } catch { if (!cancelled) { setStatus('error'); setError('暂时无法获取审查进度，请确认服务状态后重试。') } }
    }
    void run()
    return () => { cancelled = true }
  }, [mode, taskId])

  if (status === 'error') return <Result status="error" title="审查流程未完成" subTitle={error} extra={<Space><Button onClick={() => navigate('/submit')}>返回修改</Button><Button type="primary" onClick={() => window.location.reload()}>重新加载</Button></Space>} />
  const progress = status === 'success' ? 100 : Math.round((currentStep + 0.55) / steps.length * 100)
  return <div className="page-stack reviewing-page">
    <div className="review-stage"><div className="review-stage-head"><div><span className="page-eyebrow">智能审查流水线</span><Typography.Title level={2}>{status === 'success' ? '审查已完成，报告已生成' : '正在执行东盟商标合规审查'}</Typography.Title><Typography.Paragraph>任务编号：{taskId} · 请保持此页面开启，系统会持续归集规则、图形、类别与证据结果。</Typography.Paragraph></div><div className="review-status"><SafetyCertificateOutlined /><strong>{status === 'success' ? '已完成' : '分析中'}</strong><span>{mode === 'demo' ? '比赛演示空间' : '实时任务'}</span></div></div><Progress percent={progress} showInfo={false} strokeColor="#67d4df" trailColor="rgba(255,255,255,.14)" />
      <div className="review-pipeline">{steps.map((step, index) => <article className={`review-step ${index < currentStep || status === 'success' ? 'done' : index === currentStep ? 'active' : ''}`} key={step.title}>{index < currentStep || status === 'success' ? <CheckCircleOutlined /> : index === currentStep ? <LoadingOutlined spin /> : <ClockCircleOutlined />}<strong>{step.title}</strong><span>{step.detail}</span></article>)}</div>
    </div>
    <div className="reviewing-grid"><Card className="content-panel" title="实时审查日志" extra={<Tag color={status === 'success' ? 'green' : 'blue'}>{status === 'success' ? '已归档' : '持续更新'}</Tag>}><div className="audit-log">{logs.length ? logs.map((entry, index) => <div key={`${entry}-${index}`}><span className="audit-log-dot" />{entry}</div>) : <div><span className="audit-log-dot" />正在建立审查任务连接…</div>}</div></Card><Card className="content-panel" title="阶段结果"><div className="stage-result"><span>当前阶段</span><strong>{status === 'success' ? '报告生成完成' : steps[currentStep].title}</strong><p>{status === 'success' ? '风险结论、证据来源和处置建议已整理为可追溯报告。' : steps[currentStep].detail}</p>{status === 'success' ? <Button onClick={() => navigate(`/report/${taskId}`, { state: { taskId } })} type="primary">打开审查报告</Button> : <span className="live-indicator"><span className="live-indicator-dot" />预计还需 {Math.max(1, steps.length - currentStep)} 个分析阶段</span>}</div></Card></div>
    {status === 'success' ? <Alert message="审查完成" description="报告已完成归档，可查看风险结论、冲突矩阵、证据时间线与下一步处置建议。" showIcon type="success" /> : null}
  </div>
}

export default Reviewing
