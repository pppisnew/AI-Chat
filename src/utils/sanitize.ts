import DOMPurify from 'dompurify'

/**
 * 使用 DOMPurify 清洗 HTML
 * 防止 XSS 攻击
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'ul', 'ol', 'li', 'blockquote', 'a', 'h1', 'h2', 'h3',
      'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * 清洗纯文本内容
 * 用于用户输入和 AI 返回的文本
 */
export function sanitizeText(text: string): string {
  // 移除潜在的 HTML 标签
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}
