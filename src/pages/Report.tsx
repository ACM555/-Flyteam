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
import ComplianceModuleGrid from '@/components/ComplianceModuleGrid'
import DocumentPreviewCard from '@/components/DocumentPreviewCard'
import HitRuleList from '@/components/HitRuleList'
import LegalReferenceCollapse from '@/components/LegalReferenceCollapse'
import ReportActionPanel from '@/components/ReportActionPanel'
import RiskSummaryCard from '@/components/RiskSummaryCard'
import type { AuditResult } from '@/types/audit'
import { getCurrentTaskId, setCurrentTaskId } from '@/utils/auditHistory'

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

function StatisticLike({ title, value }: { title: string; value: string }) {
  return (
    <Space direction="vertical" size={4} style={{ display: 'flex' }}>
      <Text type="secondary">{title}</Text>
      <Text strong style={{ fontSize: 16 }}>
        {value}
      </Text>
    </Space>
  )
}

function isRecommendedOption(option: string, recommendedPath: string) {
  return recommendedPath === option || recommendedPath.includes(option)
}

function Report() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{ taskId?: string }>()
  const taskId = params.taskId ?? (location.state as ReportRouteState | null)?.taskId ?? getCurrentTaskId()
  const [result, setResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!taskId) {
      setError('当前没有可查看的审查报告，请先提交品牌信息。')
      setLoading(false)
      return undefined
    }

    setCurrentTaskId(taskId)

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
        setError('任务不存在或后端服务已重启，请返回提交页重新提交。')
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
            重新提交
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
  const { registrationStrategy } = result

  const intelligentPrecheckTab = (
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
        <Col xs={24} lg={14}>
          <Card title="OpenCV 视觉特征雷达">
            {visual.radarData.length > 0 ? (
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
                    name="风险基准"
                    stroke="#ff4d4f"
                    fill="#ff4d4f"
                    fillOpacity={0.2}
                    isAnimationActive={false}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无视觉分析数据" />
            )}
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

  const culturalRiskTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Alert
        message="越南硬规则与文化禁忌审查"
        description="当前阶段优先覆盖纯中文/非常用文字、公共标志、显著性不足、误导性描述等越南商标审查硬规则；东盟多国禁忌表将在后续扩展。"
        type="warning"
        showIcon
      />
      <Card title="硬规则命中">
        <HitRuleList hitRules={result.hitRules.filter((rule) => rule.ruleType === 'absolute')} />
      </Card>
      <Card title="法律依据">
        <LegalReferenceCollapse references={result.references} />
      </Card>
    </Space>
  )

  const registrationStrategyTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Alert
        message={`推荐路径：${registrationStrategy.recommendedPath || '待生成'}`}
        description={registrationStrategy.reason || '暂无注册策略结果'}
        type="info"
        showIcon
      />
      <Card title="策略摘要">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <StatisticLike title="目标市场" value={registrationStrategy.targetMarkets.join('、') || '未填写'} />
          </Col>
          <Col xs={24} md={8}>
            <StatisticLike
              title="中国基础"
              value={registrationStrategy.hasChinaBase ? '已有注册/申请' : '暂无或不确定'}
            />
          </Col>
          <Col xs={24} md={8}>
            <StatisticLike title="成本提示" value={registrationStrategy.costSaving || '待评估'} />
          </Col>
        </Row>
      </Card>
      <Row gutter={[16, 16]}>
        {registrationStrategy.costComparison.map((item) => (
          <Col key={item.option} xs={24} md={8}>
            <Card title={item.option} style={{ height: '100%' }}>
              <Space direction="vertical" size={8} style={{ display: 'flex' }}>
                <Tag color={isRecommendedOption(item.option, registrationStrategy.recommendedPath) ? 'green' : 'blue'}>
                  {isRecommendedOption(item.option, registrationStrategy.recommendedPath) ? '推荐路径' : item.costLevel}
                </Tag>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  速度：{item.speed}
                </Paragraph>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  适用：{item.suitableFor}
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>{item.note}</Paragraph>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="推进时间轴">
            <Steps
              direction="vertical"
              items={registrationStrategy.timeline.map((item) => ({
                title: `${item.stage} · ${item.duration}`,
                description: item.action,
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="商品/服务本地化改写">
            <List
              dataSource={registrationStrategy.localizedGoodsServices}
              locale={{ emptyText: '暂无本地化建议' }}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" size={6} style={{ display: 'flex' }}>
                    <Tag color={item.market === '越南' ? 'red' : 'blue'}>{item.market}</Tag>
                    <Text strong>{item.localized}</Text>
                    <Text type="secondary">{item.note}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
      <Card title="策略风险提示">
        {registrationStrategy.risks.length > 0 ? (
          <List
            dataSource={registrationStrategy.risks}
            renderItem={(risk) => (
              <List.Item>
                <Alert message={risk} type="warning" showIcon style={{ width: '100%' }} />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无策略风险提示" />
        )}
      </Card>
    </Space>
  )

  const monitoringPlaceholderTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Alert
        message="风控与维权监测"
        description="围绕公告监控、法规预警和反向风险建立持续跟踪入口，便于企业在申请后继续管理商标风险。"
        type="warning"
        showIcon
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="抢注预警">
            <Paragraph type="secondary">未来接入 NOIP 周公告 PDF/OCR，监控近似新申请和 5 个月异议窗口。</Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="法规预警">
            <Paragraph type="secondary">未来抓取主管机关公告并由模型摘要标签化，提示对申请/异议/维权的影响。</Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="反向风险">
            <Paragraph type="secondary">未来定期跑全库 Top-K，提示他人相似标对我方经营造成的潜在威胁。</Paragraph>
          </Card>
        </Col>
      </Row>
    </Space>
  )

  const documentGenerationTab = (
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
      <Card title="报告生成说明" extra={<Tag color="blue">Markdown 可下载</Tag>}>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          当前阶段根据审查结果生成三份 M6 材料：① 红/黄/绿风险模板对应的《越南商标注册合规预检报告》；
          ② 按上传 Word 模板格式生成的《商标注册申请书》；③ 按上传 Word 模板格式生成的《商标代理委托书》。
          三份材料均可复制或下载 Markdown，正式提交前应由越南本地代理机构补充申请人、代理机构、签章和认证信息。
        </Paragraph>
      </Card>
      <Tabs
        items={[
          {
            key: 'risk-report',
            label: '合规预检报告',
            children: (
              <DocumentPreviewCard
                brandName={result.brandName}
                content={advice.documentPreview}
                filenameSuffix="越南商标注册合规预检报告"
              />
            ),
          },
          {
            key: 'application',
            label: '商标注册申请书',
            children: (
              <DocumentPreviewCard
                brandName={result.brandName}
                content={advice.applicationDocumentPreview}
                title="M6 · 商标注册申请书"
                emptyDescription="暂无申请书预览"
                filenameSuffix="商标注册申请书"
              />
            ),
          },
          {
            key: 'poa',
            label: '商标代理委托书',
            children: (
              <DocumentPreviewCard
                brandName={result.brandName}
                content={advice.powerOfAttorneyPreview}
                title="M6 · 商标代理委托书"
                emptyDescription="暂无委托书预览"
                filenameSuffix="商标代理委托书"
              />
            ),
          },
        ]}
      />
    </Space>
  )

  return (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Title level={2} style={{ margin: 0 }}>
        商标合规审查报告
      </Title>
      <RiskSummaryCard data={result} />
      <ReportActionPanel result={result} />
      <Card title="6 大模块执行总览">
        <ComplianceModuleGrid result={result} />
      </Card>
      <Tabs
        items={[
          { key: 'm1', label: 'M1 智能预检', children: intelligentPrecheckTab },
          { key: 'm2', label: 'M2 侵权检索', children: relativeTab },
          { key: 'm3', label: 'M3 文化禁忌', children: culturalRiskTab },
          { key: 'm4', label: 'M4 注册策略', children: registrationStrategyTab },
          { key: 'm5', label: 'M5 风控与维权', children: monitoringPlaceholderTab },
          { key: 'm6', label: 'M6 报告生成', children: documentGenerationTab },
        ]}
      />
    </Space>
  )
}

export default Report
