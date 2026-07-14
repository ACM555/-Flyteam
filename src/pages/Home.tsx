import {
  ArrowRightOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Skeleton, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStatistics } from '@/api'
import type { StatisticsData } from '@/types/audit'

const { Paragraph, Text, Title } = Typography

const capabilities = [
  {
    title: '法条级风险筛查',
    description: '围绕越南商标注册规则识别绝对驳回与相对驳回风险，并保留命中条款与审查说明。',
    icon: <SafetyCertificateOutlined />,
    featured: true,
  },
  {
    title: '图形特征分析',
    description: '通过本地 OpenCV 提取形状、结构与对称性特征，辅助识别高风险图形表达。',
    icon: <FileProtectOutlined />,
  },
  {
    title: '证据链报告',
    description: '把规则、冲突商标、判例线索和改进建议汇总为可下载的合规规划书。',
    icon: <FileTextOutlined />,
  },
]

function Home() {
  const navigate = useNavigate()
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStatistics = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setStatistics(await getStatistics())
    } catch {
      setError('统计数据暂时无法读取，请确认后端服务已启动。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  return (
    <div className="page-shell home-page">
      <header className="page-header home-header">
        <div className="page-header-row">
          <div>
            <Text className="page-kicker">越南商标注册预审工作台</Text>
            <Title className="page-title">出海之前，先把商标风险说清楚</Title>
            <Paragraph className="page-description">
              Outbound-Guard 将公开商标数据、越南法律规则与图形分析结果整理为可追溯的风险报告，帮助企业在正式申请前发现冲突并调整方案。
            </Paragraph>
          </div>
          <div className="page-header-actions">
            <Button
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/submit')}
              size="large"
              type="primary"
            >
              开始商标审查
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <Alert
          action={<Button icon={<ReloadOutlined />} onClick={loadStatistics}>重试</Button>}
          className="home-data-alert"
          message={error}
          showIcon
          type="warning"
        />
      )}

      <section aria-labelledby="overview-title">
        <div className="section-heading-row">
          <div>
            <Title className="section-title" id="overview-title" level={2}>
              审查数据概览
            </Title>
            <Paragraph className="section-description">
              以下数据来自当前系统任务数据库，不使用演示数字。
            </Paragraph>
          </div>
          <Text className="live-status"><span aria-hidden="true" />系统服务数据</Text>
        </div>

        <div className="metric-grid">
          <Card className="surface-card metric-card">
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            ) : (
              <>
                <div className="metric-label"><SafetyCertificateOutlined /> 已完成审查</div>
                <div className="metric-value">{statistics?.auditedBrands.toLocaleString('zh-CN') ?? '0'}</div>
                <Text className="metric-note">已生成风险结论的商标任务</Text>
              </>
            )}
          </Card>
          <Card className="surface-card metric-card metric-card--risk">
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            ) : (
              <>
                <div className="metric-label"><WarningOutlined /> 高风险拦截</div>
                <div className="metric-value">{statistics?.highRiskBlocked.toLocaleString('zh-CN') ?? '0'}</div>
                <Text className="metric-note">建议正式申请前进行人工复核</Text>
              </>
            )}
          </Card>
        </div>
      </section>

      <section className="home-section" aria-labelledby="capabilities-title">
        <Title className="section-title" id="capabilities-title" level={2}>
          审查能力
        </Title>
        <Paragraph className="section-description">
          从信息提交到 PDF 报告，所有模块围绕真实业务数据工作。
        </Paragraph>
        <div className="capability-grid">
          {capabilities.map((capability) => (
            <Card
              className={`surface-card capability-card${capability.featured ? ' capability-card--featured' : ''}`}
              key={capability.title}
            >
              <div className="capability-icon" aria-hidden="true">{capability.icon}</div>
              <Title level={3}>{capability.title}</Title>
              <Paragraph>{capability.description}</Paragraph>
              {capability.featured && (
                <Button onClick={() => navigate('/submit')} type="link">
                  填写资料并开始分析 <ArrowRightOutlined />
                </Button>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section className="methodology-panel" aria-labelledby="methodology-title">
        <Title id="methodology-title" level={2}>方法与边界</Title>
        <div className="methodology-grid">
          <div>
            <Text strong>数据来源</Text>
            <Paragraph>
              系统使用项目内维护的越南公开商标条目、权利人信息和法律规则库，并支持按公开列表更新数据。
            </Paragraph>
          </div>
          <div>
            <Text strong>结论边界</Text>
            <Paragraph>
              报告属于计算风险评估，不构成正式法律意见，也不能替代越南主管机关的最终审查结果。
            </Paragraph>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
