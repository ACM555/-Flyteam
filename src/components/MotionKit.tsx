import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'

const easing = [0.22, 1, 0.36, 1] as const
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: easing } },
}
const staggerVariants: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } } }
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: easing } },
}

export function PageTransition({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  return <motion.div animate="visible" className={className} initial={reduceMotion ? false : 'hidden'} variants={pageVariants}>{children}</motion.div>
}

export function StaggerGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  return <motion.div animate="visible" className={className} initial={reduceMotion ? false : 'hidden'} variants={staggerVariants}>{children}</motion.div>
}

export function MotionItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} variants={itemVariants}>{children}</motion.div>
}

export function HoverLift({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  return <motion.div className={className} transition={{ duration: 0.18 }} whileHover={reduceMotion ? undefined : { y: -3 }} whileTap={reduceMotion ? undefined : { scale: 0.99 }}>{children}</motion.div>
}

export function RevealOnScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div className={className} initial={reduceMotion ? false : { opacity: 0, y: 18 }} transition={{ duration: 0.4, ease: easing }} viewport={{ amount: 0.2, once: true }} whileInView={{ opacity: 1, y: 0 }}>
      {children}
    </motion.div>
  )
}

export function ChartReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  return <motion.div className={className} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: easing }}>{children}</motion.div>
}

export function StatusSwap({ stateKey, children }: { stateKey: string | number; children: ReactNode }) {
  const reduceMotion = useReducedMotion()
  return <AnimatePresence mode="wait"><motion.div key={stateKey} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>{children}</motion.div></AnimatePresence>
}

export function ScanFeedback({ active = true }: { active?: boolean }) {
  return <span aria-hidden="true" className={`scan-feedback ${active ? 'active' : ''}`} />
}
