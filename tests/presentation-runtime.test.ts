import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPresentationMode, resolvePresentationRead, resolvePresentationWrite, setPresentationMode } from '@/demo/runtime'

describe('比赛演示模式', () => {
  beforeEach(() => { window.sessionStorage.clear(); setPresentationMode('live') })

  it('真实接口有数据时优先返回真实结果', async () => {
    const result = await resolvePresentationRead(async () => [{ id: 'live' }], [{ id: 'demo' }])
    expect(result).toEqual([{ id: 'live' }])
    expect(getPresentationMode()).toBe('live')
  })

  it('真实接口为空时切换到明确的兜底模式', async () => {
    const result = await resolvePresentationRead(async () => [], [{ id: 'demo' }])
    expect(result).toEqual([{ id: 'demo' }])
    expect(getPresentationMode()).toBe('fallback')
  })

  it('演示模式禁止真实写请求', async () => {
    setPresentationMode('demo')
    const write = vi.fn(async () => ({ id: 'live' }))
    const result = await resolvePresentationWrite(write, { id: 'demo' })
    expect(write).not.toHaveBeenCalled()
    expect(result).toEqual({ id: 'demo' })
  })
})
