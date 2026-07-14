import {
  AuditOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  LoadingOutlined,
  PictureOutlined,
  ReloadOutlined,
  SafetyOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Progress, Skeleton, Space, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getAuditResult } from '@/api/audit'
import type { AuditResult } from '@/types/audit'

const { Paragraph, Text, Title } = Typography

type ReviewingRouteState = { taskId?: string }
type ReviewingStatus = 'loading' | 'success' | 'error' | 'timeout'

const reviewStages = [
  { title: '任务初始化', description: '校验资料并建立安全分析任务。', threshold: 15, icon: <AuditOutlined /> },
  { title: '图形分析', description: '提取形状、结构、对称性与视觉特征。', threshold: 45, icon: <PictureOutlined /> },
  { title: '绝对理由审查', description: '匹配不得注册与缺乏显著性的规则。', threshold: 65, icon: <SafetyOutlined /> },
  { title: '相对理由检索', description: '检索冲突商标、权利人和判例线索。', threshold: 78, icon: <FileSearchOutlined /> },
  { title: '生成证据报告', description: '汇总风险结论、来源和改进建议。', threshold: 100, icon: <FileDoneOutlined /> },
]

function Reviewing() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const routeTaskId = (location.state as ReviewingRouteState | null)?.taskId
  const taskId = routeTaskId ?? searchParams.get('taskId') ?? undefined
  const [status, setStatus] = useState<ReviewingStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<AuditResult | null>(null)
  const timerRef = useRef<number | null>(null)
  const navigateTimerRef = useRef<number | null>(null)
  const startTimeRef = useRef(Date.now())

  const clearTimers = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (navigateTimerRef.current) window.clearTimeout(navigateTimerRef.current)
    timerRef.current = null
    navigateTimerRef.current = null
  }, [])

  const poll = useCallback(async () => {
    if (!taskId) {
      setStatus('error')
      setErrorMessage('缺少任务 ID，请从商标提交页重新进入。')
      return
    }

    if (Date.now() - startTimeRef.current > 60000) {
      clearTimers()
      setStatus('timeout')
      return
    }

    try {
      const nextResult = await getAuditResult(taskId)
      setResult(nextResult)

      if (nextResult.status === 'done') {
        clearTimers()
        setStatus('success')
        navigateTimerRef.current = window.setTimeout(() => {
          navigate(`/report/${taskId}`, { state: { taskId } })
        }, 900)
        return
      }

      if (nextResult.status === 'error') {
        clearTimers()
        setStatus('error')
        setErrorMessage(nextResult.errorMessage || '后端审查任务执行失败。')
        return
      }

      timerRef.current = window.setTimeout(poll, 1200)
    } catch {
      clearTimers()
      setStatus('error')
      setErrorMessage('无法连接后端服务，请确认 FastAPI 已启动。')
    }
  }, [clearTimers, navigate, taskId])

  useEffect(() => {
    startTimeRef.current = Date.now()
    poll()
    return clearTimers
  }, [clearTimers, poll])

  const progress = status === 'success' ? 100 : result?.progress ?? 0
  const activeStage = useMemo(() => {
    const index = reviewStages.findIndex((stage) => progress < stage.threshold)
    return index === -1 ? reviewStages.length - 1 : index
  }, [progress])

  const handleRetry = () => {
    clearTimers()
    startTimeRef.current = Date.now()
    setErrorMessage('')
    setStatus('loading')
    poll()
  }

  return (
    <div className="page-shell reviewing-page">
      <header className="page-header">
        <Text className="page-kicker">任务 {taskId ? taskId.slice(0, 8) : '未建立'}</Text>
        <Title className="page-title">审查进度</Title>
        <Paragraph className="page-description">
          系统正在依次执行图形分析、法律规则匹配、冲突检索和报告生成。
        </Paragraph>
      </header>

      {(status === 'error' || status === 'timeout') && (
        <Alert
          action={
            <Space wrap>
              <Button disabled={!taskId} icon={<ReloadOutlined />} onClick={handleRetry} type="primary">
                重新获取状态
              </Button>
              <Button onClick={() => navigate('/submit')}>返回修改资料</Button>
            </Space>
          }
          className="review-alert"
          description={status === 'timeout' ? '服务器超过 60 秒未返回最终结果，可以重试获取状态。' : errorMessage}
          message={status === 'timeout' ? '审查等待超时' : '审查任务异常'}
          showIcon
          type={status === 'timeout' ? 'warning' : 'error'}
        />
      )}

      <Card className="surface-card review-progress-card">
        <div className="review-progress-summary">
          <div>
            <Text className="review-status-label">
              {status === 'success' ? <CheckCircleOutlined /> : status === 'loading' ? <LoadingOutlined spin /> : <WarningOutlined />}
              {status === 'success' ? '审查完成' : status === 'loading' ? '正在处理' : '需要处理'}
            </Text>
            <Title level={3}>{result?.brandName || '正在读取商标资料'}</Title>
            <Paragraph>{result?.niceClass || '等待后端返回任务信息'}</Paragraph>
          </div>
          <div className="review-progress-number" aria-label={`当前进度 ${progress}%`}>{progress}%</div>
        </div>
        <Progress
          aria-label="审查总进度"
          percent={progress}
          showInfo={false}
          status={status === 'error' ? 'exception' : status === 'success' ? 'success' : 'active'}
          strokeColor="#006a6a"
        />

        <div className="review-timeline">
          {reviewStages.map((stage, index) => {
            const complete = status === 'success' || progress >= stage.threshold
            const active = status === 'loading' && activeStage === index
            const failed = status === 'error' && activeStage === index

            return (
              <section
                className={`review-stage${complete ? ' review-stage--complete' : ''}${active ? ' review-stage--active' : ''}${failed ? ' review-stage--failed' : ''}`}
                key={stage.title}
              >
                <div className="review-stage-icon" aria-hidden="true">
                  {complete ? <CheckCircleOutlined /> : active ? <LoadingOutlined spin /> : failed ? <WarningOutlined /> : stage.icon}
                </div>
                <div className="review-stage-content">
                  <div className="review-stage-heading">
                    <Title level={4}>{stage.title}</Title>
                    <Text>{complete ? '已完成' : active ? '处理中' : failed ? '失败' : '等待中'}</Text>
                  </div>
                  <Paragraph>{stage.description}</Paragraph>
                  {active && <Skeleton active className="review-stage-skeleton" paragraph={{ rows: 2 }} title={false} />}
                  {failed && <Paragraph className="review-stage-error">{errorMessage}</Paragraph>}
                </div>
              </section>
            )
          })}
        </div>
      </Card>

      <div className="review-footer-actions">
        <Button onClick={() => navigate('/')}>返回数据概览</Button>
        {status === 'success' && taskId && (
          <Button onClick={() => navigate(`/report/${taskId}`)} type="primary">立即查看报告</Button>
        )}
      </div>
    </div>
  )
}

export default Reviewing
