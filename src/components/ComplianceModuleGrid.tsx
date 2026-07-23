import {
  BellOutlined,
  DeploymentUnitOutlined,
  EyeOutlined,
  FileDoneOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Card, Col, Progress, Row, Space, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { AuditResult } from '@/types/audit'

const { Paragraph, Text, Title } = Typography

interface ModuleConfig {
  key: string
  title: string
  subtitle: string
  color: string
  icon: ReactNode
  description: string
}

interface ComplianceModuleGridProps {
  result?: AuditResult | null
}

const modules: ModuleConfig[] = [
  {
    key: 'M1',
    title: 'M1 · 智能预检',
    subtitle: '文本规则 + 商标底账 + OpenCV',
    color: '#1677ff',
    icon: <SafetyCertificateOutlined />,
    description: '提交前识别绝对驳回、相对冲突和视觉复核线索。',
  },
  {
    key: 'M2',
    title: 'M2 · 商标权侵权检索',
    subtitle: '同类/跨类冲突线索',
    color: '#ff4d4f',
    icon: <EyeOutlined />,
    description: '基于本地商标库输出在先权利和高知名度标识风险线索。',
  },
  {
    key: 'M3',
    title: 'M3 · 文化禁忌审查',
    subtitle: '越南硬规则',
    color: '#faad14',
    icon: <GlobalOutlined />,
    description: '覆盖纯中文、公共标志、显著性不足等越南审查风险。',
  },
  {
    key: 'M4',
    title: 'M4 · 跨域注册策略',
    subtitle: '路径建议',
    color: '#722ed1',
    icon: <DeploymentUnitOutlined />,
    description: '展示单国申请、马德里体系和混合路径的策略框架。',
  },
  {
    key: 'M5',
    title: 'M5 · 风控与维权',
    subtitle: '公告监控 + 法规预警',
    color: '#13c2c2',
    icon: <BellOutlined />,
    description: '展示公告监控、法规预警、反向风险的产品入口。',
  },
  {
    key: 'M6',
    title: 'M6 · 报告生成',
    subtitle: '红黄绿模板 + Markdown 报告',
    color: '#52c41a',
    icon: <FileDoneOutlined />,
    description: '根据审查结果生成建议清单和防御性合规规划书预览。',
  },
]

function getModuleMetric(moduleKey: string, result?: AuditResult | null) {
  if (!result) {
    return null
  }

  if (moduleKey === 'M1') {
    return { label: '综合风险', value: result.riskScore }
  }
  if (moduleKey === 'M2') {
    const relativeCount = result.hitRules.filter((rule) => rule.ruleType === 'relative' && rule.applicable).length
    return { label: '冲突线索', value: Math.min(relativeCount * 34, 100), text: `${relativeCount} 项` }
  }
  if (moduleKey === 'M3') {
    const absoluteCount = result.hitRules.filter((rule) => rule.ruleType === 'absolute' && rule.applicable).length
    return { label: '硬规则命中', value: Math.min(absoluteCount * 25, 100), text: `${absoluteCount} 项` }
  }
  if (moduleKey === 'M6') {
    return { label: '报告生成', value: result.advice.documentPreview ? 100 : 0 }
  }
  return null
}

function ComplianceModuleGrid({ result }: ComplianceModuleGridProps) {
  return (
    <Row gutter={[16, 16]}>
      {modules.map((module) => {
        const metric = getModuleMetric(module.key, result)

        return (
          <Col key={module.key} xs={24} md={12} xl={8}>
            <Card style={{ height: '100%' }}>
              <Space direction="vertical" size={12} style={{ display: 'flex' }}>
                <Space align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Space align="start" size={12}>
                    <div
                      style={{
                        alignItems: 'center',
                        background: `${module.color}14`,
                        borderRadius: 12,
                        color: module.color,
                        display: 'flex',
                        fontSize: 24,
                        height: 48,
                        justifyContent: 'center',
                        width: 48,
                      }}
                    >
                      {module.icon}
                    </div>
                    <div>
                      <Title level={5} style={{ margin: 0 }}>
                        {module.title}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {module.subtitle}
                      </Text>
                    </div>
                  </Space>
                </Space>

                <Paragraph type="secondary" style={{ margin: 0, minHeight: 44 }}>
                  {module.description}
                </Paragraph>

                {metric ? (
                  <div>
                    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Text type="secondary">{metric.label}</Text>
                      <Text strong>{metric.text ?? `${metric.value}/100`}</Text>
                    </Space>
                    <Progress percent={metric.value} showInfo={false} strokeColor={module.color} />
                  </div>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {result ? '本模块展示对应的产品能力入口。' : '将在审查报告中展示对应能力。'}
                  </Text>
                )}
              </Space>
            </Card>
          </Col>
        )
      })}
    </Row>
  )
}

export default ComplianceModuleGrid
