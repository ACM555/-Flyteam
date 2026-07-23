import { BlockOutlined, WarningOutlined } from '@ant-design/icons'
import { Card, Progress, Space, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import ProductEmpty from '@/components/ProductEmpty'
import type { HitRule } from '@/types/audit'

const { Paragraph, Text, Title } = Typography

interface HitRuleListProps {
  hitRules: HitRule[]
}

interface RuleGroupProps {
  icon: ReactNode
  rules: HitRule[]
  title: string
}

interface RuleCardProps {
  rule: HitRule
  showSimilarity?: boolean
}

function sortRules(rules: HitRule[]) {
  return [...rules].sort((a, b) => Number(b.applicable) - Number(a.applicable))
}

function RuleCard({ rule, showSimilarity = false }: RuleCardProps) {
  return (
    <Card
      size="small"
      style={{
        borderLeft: rule.applicable ? '4px solid #ff4d4f' : '4px solid #52c41a',
      }}
    >
      <Space direction="vertical" size={8} style={{ display: 'flex' }}>
        <Space wrap>
          <Text strong>{rule.article}</Text>
          <Tag color={rule.applicable ? 'red' : 'green'}>
            {rule.applicable ? '触发' : '未触发'}
          </Tag>
        </Space>

        <Paragraph style={{ margin: 0 }}>{rule.content}</Paragraph>

        {showSimilarity && rule.similarityScore > 0 && (
          <div>
            <Text style={{ fontSize: 12 }} type="secondary">
              {rule.similarityType || '相似度评分'}
            </Text>
            <Progress
              percent={rule.similarityScore}
              size="small"
              status={rule.applicable ? 'exception' : 'normal'}
            />
          </div>
        )}

        <Paragraph style={{ fontSize: 13, margin: 0 }} type="secondary">
          审查说明：{rule.note || '暂无说明'}
        </Paragraph>
      </Space>
    </Card>
  )
}

function RuleGroup({ icon, rules, title }: RuleGroupProps) {
  const triggeredCount = rules.filter((rule) => rule.applicable).length
  const isRelative = rules.some((rule) => rule.ruleType === 'relative')

  return (
    <Space direction="vertical" size={12} style={{ display: 'flex' }}>
      <Title level={5} style={{ margin: 0 }}>
        <Space>
          {icon}
          <span>
            {title}（{triggeredCount}/{rules.length} 项触发）
          </span>
        </Space>
      </Title>

      {rules.length > 0 ? (
        rules.map((rule) => (
          <RuleCard key={`${rule.ruleType}-${rule.article}-${rule.note}`} rule={rule} showSimilarity={isRelative} />
        ))
      ) : (
        <ProductEmpty description={`未归档${title}`} detail="当前规则库未覆盖该类条款，建议人工复核官方数据库后补充规则。" />
      )}
    </Space>
  )
}

function HitRuleList({ hitRules }: HitRuleListProps) {
  if (hitRules.length === 0) {
    return <ProductEmpty description="未触发规则匹配" detail="当前标识未匹配到绝对或相对驳回条款。这不等于零风险，正式提交前仍需在 NOIP、WIPO、TMview 完成检索。" />
  }

  const absoluteRules = sortRules(hitRules.filter((rule) => rule.ruleType === 'absolute'))
  const relativeRules = sortRules(hitRules.filter((rule) => rule.ruleType === 'relative'))

  return (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <RuleGroup icon={<BlockOutlined />} rules={absoluteRules} title="绝对驳回规则" />
      <RuleGroup icon={<WarningOutlined />} rules={relativeRules} title="相对驳回规则" />
    </Space>
  )
}

export default HitRuleList
