import {
  ArrowRightOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Row, Space, Statistic, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStatistics } from '@/api'
import ComplianceModuleGrid from '@/components/ComplianceModuleGrid'
import type { StatisticsData } from '@/types/audit'

const { Paragraph, Text, Title } = Typography

const capabilities = [
  {
    title: '商标合规扫描',
    description: '围绕越南商标注册审查规则，快速识别绝对驳回与相对驳回风险。',
    hint: '适合提交前快速体检',
    icon: <SafetyCertificateOutlined />,
    color: '#1677ff',
    background: '#f0f5ff',
  },
  {
    title: '法律风险预警',
    description: '结合本地规则库、冲突品牌库和判例线索，提前发现跨类攀附风险。',
    hint: '适合出海品牌风控评估',
    icon: <FileProtectOutlined />,
    color: '#faad14',
    background: '#fffbe6',
  },
  {
    title: '防御文书生成',
    description: '把审查结论沉淀为合规建议和防御性规划书，辅助团队后续应对。',
    hint: '适合法务与业务同步决策',
    icon: <SolutionOutlined />,
    color: '#52c41a',
    background: '#f6ffed',
  },
]

function Home() {
  const navigate = useNavigate()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [statisticsData, setStatisticsData] = useState<StatisticsData>({
    auditedBrands: 0,
    highRiskBlocked: 0,
  })

  useEffect(() => {
    let ignore = false

    getStatistics()
      .then((data) => {
        if (!ignore) setStatisticsData(data)
      })
      .catch(() => {
        if (!ignore) setStatisticsData({ auditedBrands: 0, highRiskBlocked: 0 })
      })

    return () => {
      ignore = true
    }
  }, [])

  const statistics = useMemo(
    () => [
      {
        title: '已审查品牌',
        value: statisticsData.auditedBrands,
        suffix: '个',
        color: '#1677ff',
        icon: <SafetyCertificateOutlined />,
      },
      {
        title: '拦截高风险',
        value: statisticsData.highRiskBlocked,
        suffix: '项',
        color: '#ff4d4f',
        icon: <WarningOutlined />,
      },
      {
        title: '法条覆盖',
        value: 5,
        suffix: '类',
        color: '#52c41a',
        icon: <FileTextOutlined />,
      },
    ],
    [statisticsData],
  )

  return (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <div
        style={{
          background:
            'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.28) 0, rgba(255,255,255,0) 30%), linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
          borderRadius: 16,
          boxShadow: '0 16px 40px rgba(22, 119, 255, 0.22)',
          color: '#fff',
          overflow: 'hidden',
          padding: '48px 40px',
          position: 'relative',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.14)',
            borderRadius: 999,
            height: 180,
            position: 'absolute',
            right: -56,
            top: -72,
            width: 180,
          }}
        />
        <div style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.82)', fontWeight: 600 }}>
            越南出海商标合规智能体
          </Text>
          <Title level={1} style={{ color: '#fff', margin: '10px 0 12px' }}>
            Outbound-Guard
          </Title>
          <Paragraph
            style={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: 16,
              lineHeight: 1.8,
              marginBottom: 28,
              maxWidth: 620,
            }}
          >
            零幻觉法条级审查，秒级识别跨类攀附风险。为中国企业出海东南亚提供商标提交前的智能扫描、风险预警与合规建议。
          </Paragraph>
          <Space size={12} wrap>
            <Button
              ghost
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/submit')}
              size="large"
              style={{ borderColor: '#fff', color: '#fff' }}
              type="primary"
            >
              立即开始审查
            </Button>
            <Text style={{ color: 'rgba(255,255,255,0.76)' }}>预计 3-5 秒生成初步报告</Text>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {statistics.map((item) => (
          <Col key={item.title} xs={24} sm={8}>
            <Card>
              <Statistic
                prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                suffix={item.suffix}
                title={item.title}
                value={item.value}
                valueStyle={{ color: item.color, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Text type="secondary">以下数据来自当前系统任务数据库，不使用演示数字。</Text>

      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          6 大功能模块
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          围绕提交前预检、侵权线索、文化禁忌、注册策略、风控维权与文书生成组织完整产品路径。
        </Paragraph>
        <ComplianceModuleGrid />
      </div>

      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          核心能力
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          从提交、审查到报告输出，覆盖出海商标合规评估的关键节点。
        </Paragraph>
        <Row gutter={[20, 20]}>
          {capabilities.map((capability) => {
            const isHovered = hoveredCard === capability.title

            return (
              <Col key={capability.title} xs={24} md={12} lg={8}>
                <Card
                  hoverable
                  onClick={() => navigate('/submit')}
                  onMouseEnter={() => setHoveredCard(capability.title)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    boxShadow: isHovered ? '0 10px 28px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    height: '100%',
                    minHeight: 238,
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Space direction="vertical" size={16} style={{ display: 'flex' }}>
                    <div
                      style={{
                        alignItems: 'center',
                        background: capability.background,
                        borderRadius: 12,
                        color: capability.color,
                        display: 'flex',
                        fontSize: 28,
                        height: 56,
                        justifyContent: 'center',
                        width: 56,
                      }}
                    >
                      {capability.icon}
                    </div>
                    <Title level={4} style={{ margin: 0 }}>
                      {capability.title}
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      {capability.description}
                    </Paragraph>
                    <Text type="secondary">{capability.hint}</Text>
                  </Space>
                </Card>
              </Col>
            )
          })}
        </Row>
      </div>

      <div style={{ padding: '40px 0 20px', textAlign: 'center' }}>
        <Text type="secondary">Outbound-Guard v1.0.0 · 越南出海商标合规智能体</Text>
      </div>
    </Space>
  )
}

export default Home
