import request from './request'

export interface AssistantSource {
  id: string
  title: string
  excerpt: string
}

export interface AssistantReply {
  answer: string
  sources: AssistantSource[]
  suggested_actions: string[]
}

export async function askAssistant(question: string, page: string, imageDataUrl?: string): Promise<AssistantReply> {
  const response = await request.post('/assistant/chat', { question, page, image_data_url: imageDataUrl })
  // `request` 的响应拦截器已经返回了解包后的业务对象；此处不能再次读取 `.data`。
  return response as unknown as AssistantReply
}
