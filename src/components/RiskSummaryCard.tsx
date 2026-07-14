import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Card, Skeleton, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { AuditResult } from '@/types/audit'

const { Paragraph, Text, Title } = Typography

interface RiskSummaryCardProps {
  data: AuditResult | null
  loading?: boolean
}

const riskConfig: Record<AuditResult['riskLevel'], { label: string; icon: ReactNode }> = {
  high: { label: '高危', icon: <ExclamationCircleOutlined /> },
  medium: { label: '中危', icon: <WarningOutlined /> },
  low: { label: '低危', icon: <CheckCircleOutlined /> },
}

function RiskSummaryCard({ data, loading = false }: RiskSummaryCardProps) {
  if (loading || !data) {
    return <Card className="surface-card risk-summary"><Skeleton active paragraph={{ rows: 4 }} /></Card>
  }

  const brandName = data.brandName || data.summary.brandName || '未命名商标'
  const niceClass = data.niceClass || data.summary.niceClass || '未选择分类'
  const goodsServices = data.goodsServices || '暂无商品服务描述'
  const riskLevel = data.riskLevel || data.summary.riskLevel || 'low'
  const riskScore = data.riskScore ?? data.summary.riskScore ?? 0
  const overallResult = data.overallResult || data.summary.overallResult || '暂无审查结论'
  const config = riskConfig[riskLevel]

  return (
    <Card className={`surface-card risk-summary risk-summary--${riskLevel}`}>
      <div className="risk-summary-header">
        <div>
          <Text className="risk-summary-eyebrow"><SafetyCertificateOutlined /> 总体风险评估</Text>
          <Title level={2}>{brandName}</Title>
          <Tag>{niceClass}</Tag>
        </div>
        <div className="risk-score" aria-label={`风险分值 ${riskScore}，风险等级${config.label}`}>
          <span className="risk-score-value">{riskScore}</span>
          <span className="risk-score-total">/100</span>
        </div>
      </div>
      <div className="risk-summary-body">
        <div className="risk-level-line">
          <span className="risk-level-icon" aria-hidden="true">{config.icon}</span>
          <div>
            <Text>当前结论</Text>
            <Title level={3}>{config.label}</Title>
          </div>
          <Tag>{data.manualReviewRequired ? '建议人工复核' : '可继续推进'}</Tag>
        </div>
        <Paragraph className="risk-overall-result">{overallResult}</Paragraph>
        <Text className="risk-goods">商品或服务：{goodsServices}</Text>
      </div>
    </Card>
  )
}

export default RiskSummaryCard
