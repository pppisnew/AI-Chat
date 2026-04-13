/**
 * Markdown 渲染组件
 * 使用 react-markdown + DOMPurify 防止 XSS
 * 支持代码块语法高亮和一键复制
 */

import { useState, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { sanitizeHtml } from '@/utils/sanitize'
import 'highlight.js/styles/github.css'

export interface MarkdownRendererProps {
  content: string
  className?: string
}

/** 代码块组件（带复制按钮） */
function CodeBlock({
  language = 'text',
  children,
}: {
  language?: string
  children: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  const handleCopy = useCallback(async () => {
    if (codeRef.current) {
      const code = codeRef.current.textContent || ''
      try {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }, [])

  return (
    <div className="relative group my-2">
      {/* 语言标签和复制按钮 */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-200 rounded-t-lg text-xs">
        <span className="text-gray-600 font-mono">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-300
                     text-gray-600 hover:text-gray-800 transition-colors duration-150"
          title="复制代码"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              已复制
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              复制
            </>
          )}
        </button>
      </div>

      {/* 代码内容 */}
      <pre className="!mt-0 !rounded-t-none bg-gray-100 rounded-b-lg p-3 overflow-x-auto">
        <code ref={codeRef} className={`language-${language || 'text'}`}>
          {children}
        </code>
      </pre>
    </div>
  )
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
          // 内联代码
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match

            if (isInline) {
              return (
                <code
                  className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <CodeBlock language={match[1] ?? 'text'}>
                {children}
              </CodeBlock>
            )
          },
          // 代码块容器（不使用，由 CodeBlock 处理）
          pre: ({ children }) => <>{children}</>,
          // 表格
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-3 py-1.5 bg-gray-100 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-3 py-1.5">
              {children}
            </td>
          ),
          // 引用块
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-2 text-gray-600 italic">
              {children}
            </blockquote>
          ),
          // 列表
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-1 space-y-0.5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-1 space-y-0.5">
              {children}
            </ol>
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  )
}
