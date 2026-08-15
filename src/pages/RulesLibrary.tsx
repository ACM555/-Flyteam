import { DatabaseOutlined, GlobalOutlined } from '@ant-design/icons'
import { Card, Col, List, Row, Skeleton, Space, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { HoverLift } from '@/components/MotionKit'
import ProductEmpty from '@/components/ProductEmpty'
import { getCountryRules, type CountryRule } from '@/api/platform'

const { Paragraph, Text, Title } = Typography

function RulesLibrary() {
  const [rules, setRules] = useState<CountryRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getCountryRules()
      .then((data) => {
        if (mounted) setRules(data)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <div className="page-heading">
        <div>
          <Tag icon={<DatabaseOutlined />} color="purple">Ruleset</Tag>
          <Title level={2}>东盟规则库</Title>
          <Paragraph type="secondary">
            将比赛文档中的国家规则产品化，沉淀成审查引擎可调用、前端可解释的结构化知识库。
          </Paragraph>
        </div>
      </div>

      {loading ? (
        <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
      ) : rules.length ? (
        <Row gutter={[16, 16]}>
          {rules.map((rule) => (
            <Col key={rule.country} xs={24} md={12} xl={8}>
              <HoverLift>
              <Card className="rule-card country-map-card">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Title level={4}><GlobalOutlined /> {rule.country}</Title>
                    <Tag color="blue">IP Rules</Tag>
                  </Space>
                  <div>
                    <Text type="secondary">审查重点</Text>
                    <Paragraph>{rule.reviewFocus}</Paragraph>
                  </div>
                  <div>
                    <Text type="secondary">风险标签</Text>
                    <Space size={[6, 6]} wrap style={{ marginTop: 8 }}>
                      {rule.riskTags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
                    </Space>
                  </div>
                  <List
                    size="small"
                    dataSource={[
                      ['法律依据', rule.legalBasis],
                      ['预计周期', rule.timeline || '待补充'],
                      ['系统策略', rule.strategy || '待补充'],
                    ]}
                    renderItem={([label, value]) => (
                      <List.Item>
                        <Space direction="vertical" size={2}>
                          <Text type="secondary">{label}</Text>
                          <Text>{value}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Space>
              </Card>
              </HoverLift>
            </Col>
          ))}
        </Row>
      ) : (
        <ProductEmpty description="暂无规则数据" />
      )}
    </Space>
  )
}

export default RulesLibrary
