/**
 * Token 长度估算工具
 * 粗略估算文本的 token 数量
 */

/** 平均每 token 对应的字符数（中文） */
const CHARS_PER_TOKEN_CN = 1.5

/** 平均每 token 对应的字符数（英文） */
const CHARS_PER_TOKEN_EN = 4

/**
 * 判断字符串是否主要是中文
 */
function isMostlyChinese(text: string): boolean {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)
  const totalChars = text.replace(/\s/g, '').length
  return chineseChars !== null && chineseChars.length / totalChars > 0.5
}

/**
 * 粗略估算文本的 token 数量
 * 注意：这是简化估算，实际值可能有所不同
 */
export function estimateTokens(text: string): number {
  if (!text) return 0

  const charsPerToken = isMostlyChinese(text)
    ? CHARS_PER_TOKEN_CN
    : CHARS_PER_TOKEN_EN

  return Math.ceil(text.length / charsPerToken)
}

/**
 * 估算消息列表的总 token 数
 */
export function estimateMessagesTokens(messages: { content: string }[]): number {
  return messages.reduce((total, msg) => total + estimateTokens(msg.content), 0)
}

/** 最大上下文 token 数（GLM-4-Flash 为 128k，我们限制为 100k） */
export const MAX_CONTEXT_TOKENS = 100000
