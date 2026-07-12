import {
  FileProtectOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Row, Space, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

const capabilities = [
  {
    title: '商标合规扫描',
    description: '快速识别越南商标注册与使用环节中的合规要点。',
    icon: <SafetyCertificateOutlined style={{ color: '#1677ff', fontSize: 28 }} />,
  },
  {
    title: '法律风险预警',
    description: '结合审查规则与风险信号，为出海决策提前预警。',
    icon: <FileProtectOutlined style={{ color: '#1677ff', fontSize: 28 }} />,
  },
  {
    title: '防御文书生成',
    description: '沉淀审查结论，为后续沟通与应对提供文书基础。',
    icon: <SolutionOutlined style={{ color: '#1677ff', fontSize: 28 }} />,
  },
]

function Home() {
  const navigate = useNavigate()

  return (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <div>
        <Typography.Title level={2}>Outbound-Guard 越南商标合规智能体</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 720 }}>
          面向中国企业出海东南亚的商标合规扫描工作台。提交品牌资料后，智能体将辅助完成规则匹配、视觉比对与风险评估。
        </Typography.Paragraph>
      </div>
      <Row gutter={[24, 24]}>
        {capabilities.map((capability, index) => (
          <Col key={capability.title} xs={24} md={index === 0 ? 12 : 6} lg={index === 0 ? 12 : 6}>
            <Card style={{ minHeight: 216 }}>
              <Space direction="vertical" size={16}>
                {capability.icon}
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {capability.title}
                </Typography.Title>
                <Typography.Paragraph type="secondary">{capability.description}</Typography.Paragraph>
                <Button type="primary" onClick={() => navigate('/submit')}>
                  开始使用
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  )
}

export default Home
