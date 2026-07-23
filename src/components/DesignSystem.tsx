import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import type { DataSourceStatus, RiskLevel } from '@/api/saas'

export const riskLabels: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
}

export const sourceStatusLabels: Record<DataSourceStatus['status'], string> = {
  online: '在线',
  degraded: '服务降级',
  scheduled: '计划更新',
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="page-heading">
      <div className="page-heading-copy">
        <span className="page-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="ant-typography">{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}

export function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(reduceMotion ? value : 0)
  const previous = useRef(0)

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value)
      previous.current = value
      return
    }
    const start = previous.current
    const startedAt = performance.now()
    const duration = 650
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (value - start) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
      else previous.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduceMotion, value])

  return <>{display.toLocaleString('zh-CN')}{suffix}</>
}

export function MetricCard({ label, value, unit, note, icon, tone = 'default' }: { label: string; value: number; unit?: string; note: string; icon: ReactNode; tone?: 'default' | 'danger' | 'warning' | 'success' }) {
  return (
    <article className="metric-card">
      <div className="metric-card-top">
        <span className={`metric-icon ${tone === 'default' ? '' : tone}`}>{icon}</span>
        <span className="status-chip">实时统计</span>
      </div>
      <span className="metric-label">{label}</span>
      <strong className="metric-value"><AnimatedNumber value={value} /><span className="unit">{unit}</span></strong>
      <span className="metric-note">{note}</span>
    </article>
  )
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  return <span className={`risk-badge ${level}`}>{riskLabels[level]}{typeof score === 'number' ? ` · ${score} 分` : ''}</span>
}

export function LiveIndicator({ label = '数据实时同步', warning = false }: { label?: string; warning?: boolean }) {
  return <span className={`live-indicator ${warning ? 'warning' : ''}`}><span className="live-indicator-dot" />{label}</span>
}

export function SourceStatus({ source }: { source: DataSourceStatus }) {
  return (
    <article className="source-card">
      <div className="source-row">
        <span className="source-name">{source.name}</span>
        <span className={`source-dot ${source.status}`} aria-label={sourceStatusLabels[source.status]} />
      </div>
      <div className="source-meta">{source.type}<br />覆盖率 {source.coverage}% · {source.freshness}<br />{source.note}</div>
    </article>
  )
}
