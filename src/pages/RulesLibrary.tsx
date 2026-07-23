import { DatabaseOutlined, GlobalOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Card, Skeleton, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { getCountryRules, type CountryRule } from '@/api/platform'
import { PageHeader } from '@/components/DesignSystem'
import ProductEmpty from '@/components/ProductEmpty'

function RulesLibrary() {
  const [rules, setRules] = useState<CountryRule[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { let mounted = true; getCountryRules().then((data) => mounted && setRules(data)).finally(() => mounted && setLoading(false)); return () => { mounted = false } }, [])
  return <div className="page-stack rules-page">
    <PageHeader eyebrow="六国规则引擎" title="东盟商标规则库" description="沉淀禁用条款、审查重点、法律依据、周期与注册策略，为前台审查和当地法务复核提供统一的决策依据。" />
    <section className="rules-hero"><div><span className="page-eyebrow">区域策略导航</span><h2>一次审查，联动东盟六国规则</h2><p>规则库将市场特有的宗教、公共秩序、语言、公告期和注册实务转化为前置风险提示，而非在提交后才暴露问题。</p><span className="status-chip"><SafetyCertificateOutlined />规则版本：2026.07 · 已完成本期校核</span></div><div className="rules-map">{['越南', '泰国', '印度尼西亚', '马来西亚', '菲律宾', '新加坡'].map((country) => <span key={country}>{country}</span>)}</div></section>
    {loading ? <Card><Skeleton active paragraph={{ rows: 12 }} /></Card> : rules.length ? <div className="rules-grid">{rules.map((rule) => <article className="rule-card" key={rule.country}><div className="rule-card-head"><div><span className="page-eyebrow"><GlobalOutlined />国家规则</span><h3>{rule.country}</h3></div><Tag color="blue">商标规则</Tag></div><div className="rule-focus"><span>审查重点</span><p>{rule.reviewFocus}</p></div><div className="rule-tags">{rule.riskTags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div><dl className="rule-details"><div><dt>法律依据</dt><dd>{rule.legalBasis}</dd></div><div><dt>预计周期</dt><dd>{rule.timeline || '规则更新中'}</dd></div><div><dt>注册策略</dt><dd>{rule.strategy || '建议结合当地代理意见复核'}</dd></div></dl></article>)}</div> : <ProductEmpty description="暂未加载规则数据" detail="请确认规则服务状态后重试。" />}
  </div>
}

export default RulesLibrary
