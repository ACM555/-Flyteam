const PLACEHOLDER_ONLY = /^[\s?？。·，、；：!！()（）[\]【】\\|*#@_\-—]*$/

export function isPlaceholderText(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value !== 'string') return false
  const text = value.trim()
  if (!text || PLACEHOLDER_ONLY.test(text)) return true
  const questionMarks = (text.match(/[?？]/g) ?? []).length
  return questionMarks > 0 && questionMarks / text.length > 0.5
}

export function safeField(value: unknown, fallback = '信息待补充'): string {
  return isPlaceholderText(value) ? fallback : String(value).trim()
}

export function safeList(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values.filter((item): item is string => typeof item === 'string' && !isPlaceholderText(item)).map((item) => item.trim())
}
