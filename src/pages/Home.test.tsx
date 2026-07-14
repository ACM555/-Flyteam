import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getStatistics } from '@/api'
import Home from '@/pages/Home'
import { renderWithProviders } from '@/test/render'

vi.mock('@/api', () => ({ getStatistics: vi.fn() }))

describe('Home', () => {
  beforeEach(() => {
    vi.mocked(getStatistics).mockResolvedValue({ auditedBrands: 12, highRiskBlocked: 4 })
  })

  it('读取后端统计而不是展示固定演示数字', async () => {
    renderWithProviders(<Home />)

    await waitFor(() => expect(getStatistics).toHaveBeenCalledTimes(1))
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('以下数据来自当前系统任务数据库，不使用演示数字。')).toBeInTheDocument()
  })
})
