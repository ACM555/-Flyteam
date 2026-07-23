import { render, screen } from '@testing-library/react'
import { AlertOutlined } from '@ant-design/icons'
import { describe, expect, it } from 'vitest'
import { MetricCard, RiskBadge, SourceStatus, riskLabels, sourceStatusLabels } from '@/components/DesignSystem'
import { PageTransition } from '@/components/MotionKit'

describe('企业设计组件', () => {
  it('将风险和数据源状态映射为中文', () => {
    expect(riskLabels).toEqual({ high: '高风险', medium: '中风险', low: '低风险' })
    expect(sourceStatusLabels.online).toBe('在线')
    expect(sourceStatusLabels.degraded).toBe('服务降级')
  })

  it('渲染中文风险徽标和指标卡', () => {
    render(<><RiskBadge level="high" score={87} /><MetricCard icon={<AlertOutlined />} label="高风险待办" value={12} unit="项" note="需要法务处理" tone="danger" /></>)
    expect(screen.getByText('高风险 · 87 分')).toBeInTheDocument()
    expect(screen.getByText('高风险待办')).toBeInTheDocument()
    expect(screen.getByText('需要法务处理')).toBeInTheDocument()
  })

  it('展示数据来源健康状态', () => {
    render(<SourceStatus source={{ name: '越南国家知识产权局', type: 'NOIP 公告', status: 'online', coverage: 96, freshness: '15 分钟前', lastSync: '2026-07-20', note: '同步正常' }} />)
    expect(screen.getByText('越南国家知识产权局')).toBeInTheDocument()
    expect(screen.getByLabelText('在线')).toBeInTheDocument()
  })

  it('减少动效偏好下仍渲染页面内容', () => {
    render(<PageTransition><span>可访问页面内容</span></PageTransition>)
    expect(screen.getByText('可访问页面内容')).toBeVisible()
  })
})
