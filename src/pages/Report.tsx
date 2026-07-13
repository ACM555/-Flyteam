import { DownloadOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Image,
  List,
  Progress,
  Result,
  Row,
  Skeleton,
  Space,
  Steps,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
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

const reviewSteps = [
  { title: '法条规则匹配' },
  { title: '多模态视觉比对' },
  { title: '风险综合评估' },
]

const priorityColor = {
  P0: 'red',
  P1: 'orange',
  P2: 'blue',
} as const

type Conflict = AuditResult['relative']['conflicts'][number]

const conflictColumns: TableColumnsType<Conflict> = [
  { title: '品牌名称', dataIndex: 'brandName', key: 'brandName' },
  { title: '注册类别', dataIndex: 'registeredClass', key: 'registeredClass' },
  { title: '注册号', dataIndex: 'registrationNo', key: 'registrationNo' },
  { title: '相似类型', dataIndex: 'similarityType', key: 'similarityType' },
  {
    title: '相似度',
    dataIndex: 'similarityScore',
    key: 'similarityScore',
    render: (score: number) => (
      <Progress percent={score} status={score >= 80 ? 'exception' : 'normal'} size="small" />
    ),
  },
]

type ReportRouteState = {
  taskId?: string
}

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
      setError('缺少任务ID，请从提交页重新进入')
      setLoading(false)
      return undefined
    }

    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
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
          setError(`审查失败：${nextResult.errorMessage || nextResult.summary.overallResult || '未知错误'}`)
          setLoading(false)
          return
        }

        timerRef.current = window.setTimeout(poll, 2000)
      } catch {
        clearTimer()
        setError('网络请求失败，请检查后端服务')
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
      <Result
        status="error"
        title="审查失败"
        subTitle={error}
        extra={
          <Button type="primary" onClick={() => navigate('/submit')}>
            返回提交页重试
          </Button>
        }
      />
    )
  }

  if (loading && !result) {
    return (
      <Space direction="vertical" size={24} style={{ display: 'flex' }}>
        <Title level={2} style={{ margin: 0 }}>
          商标合规审查报告
        </Title>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Space>
    )
  }

  if (!result) {
    return <Empty description="暂无审查结果" />
  }

  if (result.status !== 'done') {
    return (
      <Card style={{ margin: '64px auto', maxWidth: 620 }}>
        <Space direction="vertical" size={24} style={{ display: 'flex' }}>
          <Title level={2} style={{ margin: 0 }}>
            AI 合规审查中...
          </Title>
          <Progress percent={result.progress} />
          <Steps current={result.currentStep} direction="vertical" items={reviewSteps} />
          <Paragraph type="secondary" style={{ margin: 0 }}>
            正在获取后端审查结果，页面将每 2 秒自动刷新一次。
          </Paragraph>
        </Space>
      </Card>
    )
  }

  const { absolute, advice, relative, visual } = result

  const absoluteTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <HitRuleList hitRules={result.hitRules} />
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card title="绝对驳回概率" style={{ height: '100%' }}>
            <div style={{ paddingTop: 24, textAlign: 'center' }}>
              <Progress
                type="dashboard"
                percent={absolute.rejectionProbability}
                strokeColor={absolute.hasRisk ? '#faad14' : '#52c41a'}
                format={(percent) => `${percent}%`}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  )

  const relativeTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Alert
        message={relative.hasRisk ? '检出跨类目冲突' : '未检出冲突'}
        type={relative.hasRisk ? 'error' : 'success'}
        showIcon
      />
      <Card title="冲突品牌比对">
        {relative.conflicts.length > 0 ? (
          <Table<Conflict>
            columns={conflictColumns}
            dataSource={relative.conflicts}
            pagination={false}
            rowKey={(record) => record.registrationNo || record.brandName}
            scroll={{ x: 900 }}
          />
        ) : (
          <Empty description="暂无冲突品牌" />
        )}
      </Card>
      {relative.precedents.length > 0 ? (
        relative.precedents.map((precedent) => (
          <Card key={`${precedent.caseName}-${precedent.date}`} title={<Title level={5}>{precedent.caseName}</Title>}>
            <Paragraph type="secondary">
              {precedent.court} · {precedent.date}
            </Paragraph>
            <Paragraph>判决摘要：{precedent.ruling}</Paragraph>
            <Alert message={`关联性说明：${precedent.relevance}`} type="error" />
          </Card>
        ))
      ) : (
        <Empty description="暂无判例依据" />
      )}
    </Space>
  )

  const referenceTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Card title="法律依据">
        <LegalReferenceCollapse references={result.references} />
      </Card>
    </Space>
  )

  const visualTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      {visual.radarData.length > 0 ? (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card title="视觉特征雷达比对">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={visual.radarData} outerRadius="68%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <Radar
                    dataKey="target"
                    name="上传商标"
                    stroke="#1677ff"
                    fill="#1677ff"
                    fillOpacity={0.3}
                    isAnimationActive={false}
                  />
                  <Radar
                    dataKey="benchmark"
                    name="对标品牌"
                    stroke="#ff4d4f"
                    fill="#ff4d4f"
                    fillOpacity={0.3}
                    isAnimationActive={false}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="相似品牌对标" style={{ height: '100%' }}>
              {visual.matchedBrands.length > 0 ? (
                <List
                  dataSource={visual.matchedBrands}
                  renderItem={(brand) => (
                    <List.Item>
                      <Space size={16}>
                        <Image alt={brand.name} width={80} preview={false} src={brand.thumbnailUrl} />
                        <Space direction="vertical" size={4}>
                          <Text strong>{brand.name}</Text>
                          <Tag color="orange">匹配分值 {brand.matchScore}</Tag>
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无匹配品牌" />
              )}
            </Card>
          </Col>
        </Row>
      ) : (
        <Empty description="暂无视觉分析数据" />
      )}
    </Space>
  )

  const adviceTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Card title="处置建议清单">
        {advice.recommendations.length > 0 ? (
          <List
            dataSource={advice.recommendations}
            renderItem={(recommendation) => (
              <List.Item>
                <Space align="start" size={12}>
                  <Tag color={priorityColor[recommendation.priority]}>{recommendation.priority}</Tag>
                  <div>
                    <Text strong>{recommendation.title}</Text>
                    <Paragraph type="secondary" style={{ margin: '6px 0 0' }}>
                      {recommendation.description}
                    </Paragraph>
                  </div>
                </Space>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无建议" />
        )}
      </Card>
      <Card
        title="防御性合规规划书（预览）"
        extra={
          <Tooltip title={advice.documentDownloadUrl ? '下载 PDF 合规规划书' : '报告尚未生成'}>
            <Button
              disabled={!advice.documentDownloadUrl}
              icon={<DownloadOutlined />}
              onClick={() => {
                if (advice.documentDownloadUrl) {
                  window.open(advice.documentDownloadUrl, '_blank', 'noopener,noreferrer')
                }
              }}
            >
              下载完整文书
            </Button>
          </Tooltip>
        }
      >
        {advice.documentPreview ? (
          advice.documentPreview.split('\n\n').map((paragraph) => (
            <Paragraph key={paragraph} style={{ whiteSpace: 'pre-line' }}>
              {paragraph}
            </Paragraph>
          ))
        ) : (
          <Empty description="暂无文书预览" />
        )}
      </Card>
    </Space>
  )

  return (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Title level={2} style={{ margin: 0 }}>
        商标合规审查报告
      </Title>
      <RiskSummaryCard data={result} />
      <Tabs
        items={[
          { key: 'rules', label: '规则命中', children: absoluteTab },
          { key: 'relative', label: '相对驳回分析', children: relativeTab },
          { key: 'references', label: '法律依据', children: referenceTab },
          { key: 'visual', label: '视觉相似度', children: visualTab },
          { key: 'advice', label: '法律建议', children: adviceTab },
        ]}
      />
    </Space>
  )
}

export default Report
