# Ai-Chat 技术设计文档 (TECH_DESIGN.md)

**文档版本**：V1.0  
**基于文档**：《Ai-Chat 产品需求文档 (PRD)》V1.0  
**项目定位**：纯前端、隐私优先、仿微信界面的本地 AI 对话助手

---

## 1. 技术栈选择

本项目严格遵循“无后端”原则，所有计算与存储均在用户浏览器本地完成。结合 PRD 需求与开发效率，最终技术栈选型如下：

### 1.1 核心框架与构建
*   **React 18+**：采用函数式组件与 Hooks，适合构建高交互频率的单页应用。
*   **TypeScript**：强类型约束，规范聊天记录、API 请求等复杂数据结构，减少运行时 Bug。
*   **Vite**：下一代前端构建工具，提供极快的冷启动和热模块替换（HMR）。

### 1.2 UI 与样式
*   **Tailwind CSS**：原子化 CSS 框架。极其适合快速还原微信那种“极简、重布局、轻装饰”的 UI 风格（如 flex 布局、圆角气泡、细边框等）。
*   **Zustand**：轻量级全局状态管理。用于管理当前激活的会话 ID、全局设置弹窗开关等跨组件状态，比 Context API 性能更好，比 Redux 更轻量。

### 1.3 AI 能力与流式对接
*   **Vercel AI SDK (`ai`)**：核心利器。替代原生的 `fetch` + `ReadableStream` 手写解析。它提供 `useChat` Hook，原生兼容 OpenAI 接口协议（智谱 GLM 系列完全兼容），自动处理打字机效果、消息状态管理和中断逻辑。

### 1.4 数据持久化
*   **Dexie.js (基于 IndexedDB)**：虽然 PRD 提及 MVP 用 LocalStorage，但考虑到聊天记录增长迅速，**直接在 MVP 阶段引入 Dexie.js** 是最佳实践。它提供优雅的 API，突破 LocalStorage 5MB 的容量限制，轻松应对万条级别的聊天数据。
*   **LocalStorage**：仅用于存储极小体积的配置项（如 API Key、默认 System Prompt）。

### 1.5 富文本与安全
*   **react-markdown** + **remark-gfm**：解析大模型返回的 Markdown 文本（支持表格、删除线等）。
*   **rehype-highlight**：为 Markdown 中的代码块提供语法高亮。
*   **DOMPurify**：XSS 防护库。在渲染 Markdown 之前清洗 HTML 标签，防止提示词注入攻击。

### 1.6 性能优化
*   **react-virtuoso**：虚拟滚动组件。专门针对聊天界面优化，当单会话消息超过 1000 条时，只渲染可视区域内的 DOM 节点，保证 60fps 滚动流畅度。

---

## 2. 项目结构

采用经典的按功能模块划分的目录结构，保持代码高内聚低耦合：

```text
ai-chat/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/          # UI 组件
│   │   ├── Layout/          # 整体双栏布局
│   │   │   ├── Sidebar.tsx      # 左侧会话列表栏
│   │   │   └── ChatWindow.tsx   # 右侧聊天窗口栏
│   │   ├── Message/         # 消息相关
│   │   │   ├── MessageList.tsx  # 消息流列表 (集成虚拟滚动)
│   │   │   ├── MessageItem.tsx  # 单条消息气泡 (用户/AI)
│   │   │   └── MarkdownRenderer.tsx # Markdown 渲染组件
│   │   ├── Input/           # 输入相关
│   │   │   └── ChatInput.tsx     # 文本输入框与发送按钮
│   │   └── Settings/        # 设置相关
│   │       └── SettingsModal.tsx # API Key、Prompt 设置弹窗
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useChatSync.ts   # 【核心】桥接 Vercel AI SDK 与本地数据库
│   │   └── useNetwork.ts    # 监听网络状态 (离线提示)
│   ├── db/                  # 数据库层
│   │   ├── index.ts         # Dexie 数据库初始化与表结构定义
│   │   └── operations.ts    # 封装增删改查业务逻辑
│   ├── store/               # 全局状态
│   │   └── useAppStore.ts   # Zustand 状态定义
│   ├── lib/                 # 第三方库实例化
│   │   └── ai.ts            # Vercel AI SDK 客户端配置 (智谱 API 地址)
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts         # Conversation, Message 等接口
│   ├── utils/               # 工具函数
│   │   ├── sanitize.ts      # DOMPurify 封装
│   │   └── token.ts         # Token 长度简易估算工具
│   ├── App.tsx              # 根组件
│   ├── main.tsx             # 入口文件
│   └── index.css            # Tailwind 引入与全局基础样式
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 3. 数据模型

数据完全存储在浏览器本地，分为“关系型结构”和“键值对结构”两部分。

### 3.1 IndexedDB 数据模型 (Dexie.js)
采用两张表的设计，通过 `conversationId` 建立一对多关联，便于分页查询和单会话删除。

#### 表 1：`conversations` (会话表)
| 字段名 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | Primary Key | 使用 `crypto.randomUUID()` 生成 |
| `title` | string | Not Null | 会话标题，默认取首条消息前 20 字符 |
| `createdAt` | number | Not Null | 创建时间戳 |
| `updatedAt` | number | Not Null | 最后消息时间戳，用于左侧列表排序 |

#### 表 2：`messages` (消息表)
| 字段名 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | Primary Key | 唯一消息 ID |
| `conversationId` | string | Index (索引) | 关联的会话 ID，加索引加速查询 |
| `role` | enum | Not Null | `'user'` / `'assistant'` / `'system'` |
| `content` | string | Not Null | 消息文本内容 |
| `createdAt` | number | Not Null | 发送/生成时间戳 |

### 3.2 LocalStorage 数据模型 (简单配置)
以 JSON 字符串形式存储，Key 固定前缀为 `ai_chat_`：

*   **`ai_chat_settings`**:
    ```json
    {
      "apiKey": "sk-xxxxxxxxxxxxx",
      "baseUrl": "https://open.bigmodel.cn/api/paas/v4/", // 智谱网关
      "model": "glm-4-flash",
      "systemPrompt": "你是一个有帮助的AI助手。"
    }
    ```

---

## 4. 关键技术点与解决方案

### 4.1 流式输出 (SSE) 与 本地持久化的状态桥接 (难点)
**问题**：Vercel AI SDK 的 `useChat` Hook 默认将消息存在内存（React State）中，刷新页面即丢失。而我们需要存入 IndexedDB。
**解决方案**：
1.  **初始化加载**：组件挂载时，根据当前 URL 或 Zustand 中的 `activeConversationId`，从 Dexie 读取历史 messages，作为 `useChat(initialMessages)` 的初始值。
2.  **实时落盘**：利用 `useChat` 的 `onFinish` 回调。当 AI 完成一整段回复后，将最新生成的 Assistant 消息，连同触发的 User 消息，批量 `db.messages.bulkAdd()` 写入 IndexedDB，并更新 `conversations` 表的 `updatedAt`。
3.  **异常处理**：若在流式输出中途刷新页面，丢弃不完整的内存消息，下次打开只展示已完整落盘的历史记录。

### 4.2 上下文记忆与 Token 溢出防护
**问题**：PRD 要求“自动携带最近 N 条历史记录”。如果死板地设定 N=20，遇到包含大量代码的长对话，会导致请求 Token 超过模型上限报错。
**解决方案**：
在 `lib/ai.ts` 发起请求前，编写预处理函数：
1. 从数据库取出当前会话所有历史。
2. 倒序遍历，累加每条消息的 `content.length`（按 1 个中文字符 ≈ 2 token，1 个英文单词 ≈ 1.3 token 粗略估算）。
3. 设定安全阈值（如 `GLM-4-Flash` 最大 128k，我们限制上下文窗口不超过 100k token）。
4. 一旦累加达到阈值，立即截断，取出这部分 `messages` 发送给 API，防止 400 Bad Request。

### 4.3 XSS 防护策略
**问题**：大模型有时会被越狱攻击输出恶意脚本，或用户自己输入恶意代码。
**解决方案**：
在 `MarkdownRenderer.tsx` 组件中，不直接渲染 raw string。流程如下：
`API返回文本` -> `DOMPurify.sanitize(text)` -> `react-markdown` 解析。
*注：`react-markdown` 默认不渲染原生 HTML 标签，除非显式配置了 `rehype-raw`，因此常规情况下已较安全，加上 DOMPurify 属于双保险。*

### 4.4 虚拟列表的“自动滚动到底部”失效问题 (难点)
**问题**：使用虚拟列表（如 `react-virtuoso`）后，传统的 `div.scrollTop = div.scrollHeight` 会失效，因为外部容器的高度并不等于所有内容真实的高度。
**解决方案**：
利用 `react-virtuoso` 提供的 `ref` 方法。在 AI 流式输出导致内容增加时，调用 `virtuosoRef.current.scrollToIndex({ index: totalCount - 1, behavior: 'smooth' })`，确保打字机效果时屏幕始终跟随最新内容。

### 4.5 API Key 的绝对安全隔离
**问题**：防止 Key 泄漏到第三方。
**解决方案**：
1. 代码中不写任何默认 Key。
2. 发起请求时，`headers.Authorization` 直接从 LocalStorage 读取拼接。
3. 配置 CSP (Content Security Policy) 头（若部署），禁用向非智谱 API 域名发起的请求，从底层拦截木马窃取 Key 的行为。
4. 前端不使用任何第三方统计 SDK（如 Google Analytics、百度统计），避免 Key 被作为 URL 参数上报。