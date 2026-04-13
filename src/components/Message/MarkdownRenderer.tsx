/**
 * Markdown 渲染组件
 * 使用 react-markdown + DOMPurify 防止 XSS
 */

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { sanitizeHtml } from '@/utils/sanitize'
import 'highlight.js/styles/github.css'

export interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // 在渲染前清洗内容
  const sanitizedContent = sanitizeHtml(content)

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义链接渲染，添加安全属性
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {children}
            </a>
          ),
          // 代码块
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match

            return isInline ? (
              <code
                className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          // 代码块容器
          pre: ({ children }) => (
            <pre className="bg-gray-100 rounded-lg p-3 overflow-x-auto my-2">
              {children}
            </pre>
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  )
}
