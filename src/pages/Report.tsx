import {
  DownloadOutlined,
  FileTextOutlined,
  PictureOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Empty,
  Image,
  List,
  Progress,
  Result,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { getAuditResult } from '@/api/audit'
import HitRuleList from '@/components/HitRuleList'
import LegalReferenceCollapse from '@/components/LegalReferenceCollapse'
import RiskSummaryCard from '@/components/RiskSummaryCard'
import type { AuditResult } from '@/types/audit'

const { Paragraph, Text, Title } = Typography

const priorityConfig = {
  P0: { color: 'red', label: '立即处理' },
  P1: { color: 'orange', label: '优先优化' },
  P2: { color: 'blue', label: '持续关注' },
} as const

type ReportRouteState = { taskId?: string }

function Report() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{ taskId?: string }>()
  const taskId = params.taskId ?? (location.state as ReportRouteState | null)?.taskId
  const [result, setResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!taskId) {
      setError('缺少任务 ID，请从提交页重新进入。')
      setLoading(false)
      return undefined
    }

    const clearTimer = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const poll = async () => {
      try {
        const nextResult = await getAuditResult(taskId)
        setResult(nextResult)

        if (nextResult.status === 'done') {
          clearTimer()
          setLoading(false)
          return
        }

        if (nextResult.status === 'error') {
          clearTimer()
          setError(nextResult.errorMessage || nextResult.summary?.overallResult || '审查任务执行失败。')
          setLoading(false)
          return
        }

        timerRef.current = window.setTimeout(poll, 1200)
      } catch {
        clearTimer()
        setError('无法读取审查报告，请确认 FastAPI 服务已启动。')
        setLoading(false)
      }
    }

    setLoading(true)
    setError(null)
    poll()
    return clearTimer
  }, [taskId])

  if (error) {
    return (
      <div className="page-shell state-page">
        <Result
          status="error"
          title="报告读取失败"
          subTitle={error}
          extra={[
            <Button key="submit" onClick={() => navigate('/submit')} type="primary">重新提交资料</Button>,
            <Button key="home" onClick={() => navigate('/')}>返回数据概览</Button>,
          ]}
        />
      </div>
    )
  }

  if (loading && !result) {
    return (
      <div className="page-shell report-page">
        <header className="page-header">
          <Text className="page-kicker">正在准备证据链</Text>
          <Title className="page-title">商标合规审查报告</Title>
        </header>
        <Card className="surface-card"><Skeleton active paragraph={{ rows: 10 }} /></Card>
      </div>
    )
  }

  if (!result) return <Empty description="暂无审查结果" />

  if (result.status !== 'done') {
    return (
      <div className="page-shell state-page">
        <Card className="surface-card pending-report-card">
          <Title level={2}>报告仍在生成</Title>
          <Progress percent={result.progress} strokeColor="#006a6a" />
          <Paragraph>页面正在自动读取后端结果，你也可以返回进度页继续查看。</Paragraph>
          <Button onClick={() => navigate(`/reviewing?taskId=${encodeURIComponent(result.taskId)}`)}>
            返回审查进度
          </Button>
        </Card>
      </div>
    )
  }

  const { absolute, advice, relative, visual } = result
  const reportDownloadUrl = advice.documentDownloadUrl

  const rulesPanel = (
    <div className="report-panel-stack">
      <Card className="surface-card rejection-card">
        <div>
          <Text className="report-card-kicker"><SafetyCertificateOutlined /> 绝对理由评估</Text>
          <Title level={3}>{absolute.hasRisk ? '存在绝对驳回风险' : '未发现绝对驳回风险'}</Title>
          <Paragraph>
            该概率由当前规则命中与图形分析结果综合计算，不代表主管机关最终决定。
          </Paragraph>
        </div>
        <Progress
          aria-label={`绝对驳回概率 ${absolute.rejectionProbability}%`}
          percent={absolute.rejectionProbability}
          strokeColor={absolute.hasRisk ? '#994712' : '#2f7d32'}
          type="dashboard"
        />
      </Card>
      <HitRuleList hitRules={result.hitRules} />
    </div>
  )

  const conflictPanel = (
    <div className="report-panel-stack">
      <Alert
        description={relative.hasRisk ? '请重点核对下列在先商标、注册类别和相似类型。' : '当前数据集中没有发现需要展示的冲突商标。'}
        message={relative.hasRisk ? '检出相对理由冲突' : '未检出明显冲突'}
        showIcon
        type={relative.hasRisk ? 'error' : 'success'}
      />
      {relative.conflicts.length > 0 ? (
        <div className="conflict-grid">
          {relative.conflicts.map((conflict) => (
            <Card className="surface-card conflict-card" key={conflict.registrationNo || conflict.brandName}>
              <div className="conflict-card-header">
                <Title level={4}>{conflict.brandName}</Title>
                <Tag color={conflict.similarityScore >= 80 ? 'red' : 'orange'}>
                  相似度 {conflict.similarityScore}%
                </Tag>
              </div>
              <dl className="evidence-list">
                <div><dt>注册类别</dt><dd>{conflict.registeredClass || '未提供'}</dd></div>
                <div><dt>注册号</dt><dd>{conflict.registrationNo || '未提供'}</dd></div>
                <div><dt>相似类型</dt><dd>{conflict.similarityType || '综合相似'}</dd></div>
              </dl>
            </Card>
          ))}
        </div>
      ) : (
        <Empty description="暂无冲突商标" />
      )}
      {relative.precedents.length > 0 && (
        <div>
          <Title level={3}>相关判例线索</Title>
          <div className="precedent-grid">
            {relative.precedents.map((precedent) => (
              <Card className="surface-card" key={`${precedent.caseName}-${precedent.date}`}>
                <Title level={4}>{precedent.caseName}</Title>
                <Text>{precedent.court} {precedent.date}</Text>
                <Paragraph>{precedent.ruling}</Paragraph>
                <Alert message={precedent.relevance} showIcon type="info" />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const referencePanel = (
    <Card className="surface-card" title={<span><FileTextOutlined /> 法律与数据依据</span>}>
      <LegalReferenceCollapse references={result.references} />
    </Card>
  )

  const visualPanel = (
    <div className="visual-report-grid">
      <Card className="surface-card" title={<span><PictureOutlined /> 视觉特征雷达</span>}>
        {visual.radarData.length > 0 ? (
          <>
            <div
              className="radar-chart-wrap"
              role="img"
              aria-label="上传商标与对标品牌在各视觉维度的雷达图比较"
            >
              <ResponsiveContainer height={320} width="100%">
                <RadarChart data={visual.radarData} outerRadius="68%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <Radar dataKey="target" name="上传商标" stroke="#006a6a" fill="#13c2c2" fillOpacity={0.25} isAnimationActive={false} />
                  <Radar dataKey="benchmark" name="对标品牌" stroke="#ba1a1a" fill="#ba1a1a" fillOpacity={0.16} isAnimationActive={false} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <Paragraph className="chart-summary">
              图表用于展示各维度的相对差异，具体风险仍以规则命中、冲突记录和报告结论为准。
            </Paragraph>
          </>
        ) : (
          <Empty description="暂无视觉分析数据" />
        )}
      </Card>
      <Card className="surface-card" title="相似品牌对标">
        {visual.matchedBrands.length > 0 ? (
          <List
            dataSource={visual.matchedBrands}
            renderItem={(brand) => (
              <List.Item>
                <div className="matched-brand-row">
                  <Image alt={`${brand.name} 商标缩略图`} preview={false} src={brand.thumbnailUrl} width={88} />
                  <div>
                    <Text strong>{brand.name}</Text>
                    <Progress percent={brand.matchScore} size="small" strokeColor={brand.matchScore >= 80 ? '#ba1a1a' : '#994712'} />
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无匹配品牌" />
        )}
      </Card>
    </div>
  )

  const advicePanel = (
    <div className="report-panel-stack">
      <div className="recommendation-grid">
        {advice.recommendations.map((recommendation) => {
          const config = priorityConfig[recommendation.priority]
          return (
            <Card className="surface-card recommendation-card" key={`${recommendation.priority}-${recommendation.title}`}>
              <Tag color={config.color}>{recommendation.priority} {config.label}</Tag>
              <Title level={4}>{recommendation.title}</Title>
              <Paragraph>{recommendation.description}</Paragraph>
            </Card>
          )
        })}
      </div>
      <Card className="surface-card document-preview-card" title="防御性合规规划书预览">
        {advice.documentPreview ? (
          advice.documentPreview.split('\n\n').map((paragraph) => (
            <Paragraph key={paragraph}>{paragraph}</Paragraph>
          ))
        ) : (
          <Empty description="暂无文书预览" />
        )}
      </Card>
    </div>
  )

  return (
    <div className="page-shell report-page">
      <header className="page-header report-header">
        <div className="page-header-row">
          <div>
            <Text className="page-kicker">报告 ID {result.taskId.slice(0, 8)}</Text>
            <Title className="page-title">商标合规审查报告</Title>
            <Paragraph className="page-description">
              报告将风险结论与规则、冲突商标、视觉特征和来源证据关联展示。
            </Paragraph>
          </div>
          <div className="page-header-actions">
            <Button
              disabled={!reportDownloadUrl}
              icon={<DownloadOutlined />}
              onClick={() => reportDownloadUrl && window.open(reportDownloadUrl, '_blank', 'noopener,noreferrer')}
              size="large"
              type="primary"
            >
              下载 PDF 报告
            </Button>
          </div>
        </div>
      </header>

      <RiskSummaryCard data={result} />

      {result.manualReviewRequired && (
        <Alert
          className="manual-review-alert"
          description="建议在正式申请前由商标代理人核对冲突记录、实际使用范围和主管机关最新审查口径。"
          icon={<WarningOutlined />}
          message="本报告需要人工复核"
          showIcon
          type="warning"
        />
      )}

      <Tabs
        className="report-tabs"
        destroyOnHidden={false}
        items={[
          { key: 'rules', label: '规则命中', children: rulesPanel },
          { key: 'conflicts', label: '冲突证据', children: conflictPanel },
          { key: 'references', label: '法律依据', children: referencePanel },
          { key: 'visual', label: '视觉分析', children: visualPanel },
          { key: 'advice', label: '改进建议', children: advicePanel },
        ]}
      />
    </div>
  )
}

export default Report
