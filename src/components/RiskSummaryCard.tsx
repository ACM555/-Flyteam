import { Alert, Card, Col, Progress, Row, Space, Tag, Typography } from 'antd'
import type { AuditResult } from '@/types/audit'
import { safeField } from '@/components/display'

const { Paragraph, Text, Title } = Typography

const riskConfig = {
  high: { label: '高风险', color: '#7a0019', tag: 'error' as const, summary: '建议暂停提交并进入人工复核。' },
  medium: { label: '中风险', color: '#b45309', tag: 'warning' as const, summary: '建议补齐检索和本地化证据后再评估。' },
  low: { label: '低风险', color: '#15803d', tag: 'success' as const, summary: '仍需完成正式检索和人工确认。' },
}

function formatTime(value?: string) {
  if (!value) return '生成时间待记录'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

function RiskSummaryCard({ data }: { data: AuditResult }) {
  const config = riskConfig[data.riskLevel]
  const drivers = data.evidence.filter((item) => item.basis !== 'heuristic').slice(0, 3)
  const nextStep = data.advice.recommendations[0]

  return (
    <Card className="report-summary">
      <Row gutter={[28, 20]} align="middle">
        <Col xs={24} lg={15}>
          <Space direction="vertical" size={10} style={{ display: 'flex' }}>
            <Space size={[8, 8]} wrap>
              <Tag color={config.tag}>{config.label}</Tag>
              <Text type="secondary">报告生成于 {formatTime(data.generatedAt)}</Text>
            </Space>
            <div>
              <Title level={2} style={{ margin: 0 }}>{safeField(data.brandName, '品牌信息待补充')}</Title>
              <Text type="secondary">{safeField(data.niceClass, '—')} · {safeField(data.goodsServices, '—')}</Text>
            </div>
            <Paragraph className="report-conclusion">{safeField(data.overallResult, '审查结论待生成')}</Paragraph>
            <div className="risk-driver-list">
              <Text strong>风险判断依据</Text>
              {drivers.length ? drivers.map((item) => <Text key={`${item.title}-${item.source}`}>{safeField(item.title, '—')}：{safeField(item.summary, '—')}</Text>) : <Text type="secondary">本次结论基于规则与图形特征辅助判断，详见下方审查明细。</Text>}
            </div>
          </Space>
        </Col>
        <Col xs={24} lg={9}>
          <div className="report-score-panel" style={{ borderColor: config.color }}>
            <Progress type="dashboard" percent={data.riskScore} strokeColor={config.color} format={(score) => <span><b>{score}</b><small>/100</small></span>} />
            <Text strong>风险评分</Text>
            <Text type="secondary">{config.summary}</Text>
          </div>
        </Col>
      </Row>

      {nextStep ? (
        <div className="report-next-step" style={{ marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <Text className="rns-label">建议下一步</Text>
            <div className="rns-title">{safeField(nextStep.title, '—')}</div>
            {nextStep.description ? <div className="rns-desc">{safeField(nextStep.description, '—')}</div> : null}
          </div>
        </div>
      ) : null}

      {data.manualReviewRequired && (
        <Alert
          className="manual-review-alert"
          showIcon
          type="warning"
          message="需要人工复核后再作出提交或使用决策"
          description="自动分析仅提供风险线索。请核验官方数据库检索记录、冲突权利状态、翻译与本地使用场景，并由当地执业律师或商标代理人确认。"
        />
      )}
    </Card>
  )
}

export default RiskSummaryCard
