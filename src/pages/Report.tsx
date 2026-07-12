import { DownloadOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Image,
  List,
  Progress,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { mockReportData } from '@/api/mockData'

const { Paragraph, Text, Title } = Typography

const riskLevelLabel = {
  high: '高危',
  medium: '中危',
  low: '低危',
} as const

const priorityColor = {
  P0: 'red',
  P1: 'orange',
  P2: 'blue',
} as const

type Conflict = (typeof mockReportData.relative.conflicts)[number]

const conflictColumns: TableColumnsType<Conflict> = [
  { title: '品牌名称', dataIndex: 'brandName', key: 'brandName' },
  { title: '注册类别', dataIndex: 'registeredClass', key: 'registeredClass' },
  { title: '注册号', dataIndex: 'registrationNo', key: 'registrationNo' },
  { title: '相似类型', dataIndex: 'similarityType', key: 'similarityType' },
  {
    title: '相似度',
    dataIndex: 'similarityScore',
    key: 'similarityScore',
    render: (score: number) => <Progress percent={score} status="exception" size="small" />,
  },
]

function Report() {
  const { absolute, advice, relative, summary, visual } = mockReportData

  const absoluteTab = (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={14}>
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          {absolute.articles.map((article) => (
            <Card key={article.article} size="small">
              <Space direction="vertical" size={8} style={{ display: 'flex' }}>
                <Space>
                  <Text strong>{article.article}</Text>
                  <Tag color={article.applicable ? 'red' : 'green'}>
                    {article.applicable ? '触发' : '未触发'}
                  </Tag>
                </Space>
                <Paragraph style={{ marginBottom: 0 }}>{article.content}</Paragraph>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  审查说明：{article.note}
                </Paragraph>
              </Space>
            </Card>
          ))}
        </Space>
      </Col>
      <Col xs={24} lg={10}>
        <Card title="绝对驳回概率" style={{ height: '100%' }}>
          <div style={{ paddingTop: 24, textAlign: 'center' }}>
            <Progress
              type="dashboard"
              percent={absolute.rejectionProbability}
              strokeColor="#389e0d"
              format={(percent) => `${percent}%`}
            />
            <Title level={5} style={{ color: '#389e0d', marginTop: 20 }}>
              绝对驳回风险：低
            </Title>
          </div>
        </Card>
      </Col>
    </Row>
  )

  const relativeTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Alert message="检出 1 项跨类目驰名商标冲突，高风险" type="error" showIcon />
      <Card title="冲突品牌比对">
        <Table<Conflict>
          columns={conflictColumns}
          dataSource={relative.conflicts}
          pagination={false}
          rowKey="registrationNo"
          scroll={{ x: 900 }}
        />
      </Card>
      {relative.precedents.map((precedent) => (
        <Card key={precedent.caseName} title={<Title level={5}>{precedent.caseName}</Title>}>
          <Paragraph type="secondary">
            {precedent.court} · {precedent.date}
          </Paragraph>
          <Paragraph>判决摘要：{precedent.ruling}</Paragraph>
          <Alert message={`关联性说明：${precedent.relevance}`} type="error" />
        </Card>
      ))}
    </Space>
  )

  const visualTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
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
                  fillOpacity={0.28}
                  isAnimationActive={false}
                />
                <Radar
                  dataKey="benchmark"
                  name="LV对标"
                  stroke="#cf1322"
                  fill="#cf1322"
                  fillOpacity={0.16}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ResponsiveContainer>
            <Space size={20} style={{ justifyContent: 'center', width: '100%' }}>
              <Text style={{ color: '#1677ff' }}>● 上传商标</Text>
              <Text style={{ color: '#cf1322' }}>● LV对标</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="相似品牌对标" style={{ height: '100%' }}>
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
          </Card>
        </Col>
      </Row>
      <Alert message="几何轮廓与线条密度维度高度相似，建议人工复核" type="warning" showIcon />
    </Space>
  )

  const adviceTab = (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Card title="处置建议清单">
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
      </Card>
      <Card
        title="防御性合规规划书（预览）"
        extra={
          <Tooltip title="功能开发中">
            <Button disabled icon={<DownloadOutlined />}>
              下载完整文书
            </Button>
          </Tooltip>
        }
      >
        {advice.documentPreview.split('\n\n').map((paragraph) => (
          <Paragraph key={paragraph} style={{ whiteSpace: 'pre-line' }}>
            {paragraph}
          </Paragraph>
        ))}
      </Card>
    </Space>
  )

  return (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Title level={2} style={{ margin: 0 }}>
        商标合规审查报告
      </Title>
      <Card variant="outlined">
        <Row align="middle" gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Title level={4} style={{ margin: 0 }}>
              {summary.brandName}
            </Title>
            <Tag color="blue" style={{ marginTop: 10 }}>
              {summary.niceClass}
            </Tag>
          </Col>
          <Col xs={24} md={8}>
            <Space size={12}>
              <Tag color="red">{riskLevelLabel[summary.riskLevel]}</Tag>
              <Text strong style={{ color: '#cf1322', fontSize: 18 }}>
                风险分值 {summary.riskScore}
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary">提交时间：{summary.submitTime}</Text>
          </Col>
          <Col span={24}>
            <Alert message={summary.overallResult} type="warning" showIcon />
          </Col>
        </Row>
      </Card>
      <Tabs
        items={[
          { key: 'absolute', label: '绝对驳回分析', children: absoluteTab },
          { key: 'relative', label: '相对驳回分析', children: relativeTab },
          { key: 'visual', label: '视觉相似度', children: visualTab },
          { key: 'advice', label: '法律建议', children: adviceTab },
        ]}
      />
    </Space>
  )
}

export default Report
