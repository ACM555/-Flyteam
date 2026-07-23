import { motion, useReducedMotion } from 'motion/react'

interface RiskRadarProps { score: number; title?: string; subtitle?: string }
const rings = [82, 124, 166, 208]

function RiskRadar({ score, title = '实时风险雷达', subtitle = '跨类别保护持续运行' }: RiskRadarProps) {
  const normalized = Math.max(0, Math.min(score, 100))
  const reduceMotion = useReducedMotion()
  return (
    <div className="risk-radar" aria-label={`风险雷达评分 ${normalized} 分`}>
      <div className="radar-grid">{rings.map((size) => <span key={size} style={{ height: size, width: size }} />)}<i /></div>
      <motion.div animate={reduceMotion ? undefined : { rotate: 360 }} className="radar-sweep" transition={{ duration: 7.5, ease: 'linear', repeat: Infinity }} />
      <motion.div animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.88, 1, 0.88] }} className="radar-core" transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}>
        <strong>{normalized}</strong><span>风险指数</span>
      </motion.div>
      <div className="radar-caption"><strong>{title}</strong><span>{subtitle}</span></div>
      <span className="radar-dot dot-a" /><span className="radar-dot dot-b" /><span className="radar-dot dot-c" />
    </div>
  )
}

export default RiskRadar
