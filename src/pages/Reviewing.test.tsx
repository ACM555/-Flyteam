import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Reviewing from '@/pages/Reviewing'
import { renderWithProviders } from '@/test/render'

vi.mock('@/api/audit', () => ({ getAuditResult: vi.fn() }))

describe('Reviewing', () => {
  it('缺少任务 ID 时提供可恢复的错误提示', async () => {
    renderWithProviders(<Reviewing />, '/reviewing')

    expect(await screen.findByText('审查任务异常')).toBeInTheDocument()
    expect(screen.getAllByText('缺少任务 ID，请从商标提交页重新进入。').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '返回修改资料' })).toBeInTheDocument()
  })
})
