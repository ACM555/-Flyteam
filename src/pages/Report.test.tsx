import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Report from '@/pages/Report'
import { renderWithProviders } from '@/test/render'

vi.mock('@/api/audit', () => ({ getAuditResult: vi.fn() }))

describe('Report', () => {
  it('缺少任务 ID 时引导用户重新提交', async () => {
    renderWithProviders(<Report />, '/report')

    expect(await screen.findByText('审查失败')).toBeInTheDocument()
    expect(screen.getByText('当前没有可查看的审查报告，请先提交品牌信息。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新提交' })).toBeInTheDocument()
  })
})
