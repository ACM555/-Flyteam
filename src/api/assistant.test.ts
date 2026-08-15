import { describe, expect, it, vi } from 'vitest'
import request from './request'
import { askAssistant, type AssistantReply } from './assistant'

vi.mock('./request', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('askAssistant', () => {
  it('uses the already-unwrapped response returned by the common request interceptor', async () => {
    const reply: AssistantReply = {
      answer: '请先补充品牌素材。',
      sources: [{ id: 'guide', title: '提交指引', excerpt: '上传素材后开始审查。' }],
      suggested_actions: ['补充品牌资产'],
    }
    vi.mocked(request.post).mockResolvedValueOnce(reply)

    await expect(askAssistant('下一步做什么？', '/submit')).resolves.toEqual(reply)
    expect(request.post).toHaveBeenCalledWith('/assistant/chat', {
      question: '下一步做什么？',
      page: '/submit',
      image_data_url: undefined,
    })
  })
})
