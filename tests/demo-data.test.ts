import { describe, expect, it } from 'vitest'
import { demoAuditResult, demoOverview } from '@/demo/data'

describe('演示数据契约', () => {
  it('审查时间线使用结构化阶段数据', () => {
    expect(demoAuditResult.intelligence.registrationStrategy.timeline).toHaveLength(4)
    expect(demoAuditResult.intelligence.registrationStrategy.timeline[0]).toEqual(expect.objectContaining({ stage: expect.any(String), duration: expect.any(String), output: expect.any(String) }))
  })

  it('演示报告不指向真实下载接口', () => {
    expect(demoAuditResult.advice.documentDownloadUrl).toBe('')
  })

  it('平台定位和模块均为中文业务文案', () => {
    expect(demoOverview.positioning).toContain('中国企业')
    expect(demoOverview.modules.every((module) => /[\u4e00-\u9fff]/.test(module.name))).toBe(true)
  })
})
