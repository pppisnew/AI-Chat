# Ai-Chat 开发指南 (AGENTS.md)

**文档版本**：V1.0  
**适用对象**：参与本项目的开发者及 AI 辅助编程工具

---

## 1. 项目概述

本项目是一个**纯前端、零后端、隐私优先**的 AI 聊天助手。产品高度模仿微信 PC 端的交互与视觉风格，通过浏览器直接调用大模型（默认智谱 GLM-4-Flash）API 实现流式对话。

**核心特征**：
*   **无服务端**：不需要部署 Node.js/Python 后端，所有逻辑在浏览器端运行。
*   **本地持久化**：使用 IndexedDB (Dexie.js) 存储海量聊天记录，刷新/关闭浏览器不丢失数据。
*   **流式体验**：基于 Vercel AI SDK 实现打字机效果，无等待感。

---

## 2. 开发规范

### 2.1 架构约束
*   **严禁后端代码**：本项目中不得出现 Express、Koa、Flask 等服务端框架代码，不得发起跨域代理请求。
*   **API 调用统一收口**：所有与智谱 API 的交互，必须通过 `src/lib/ai.ts` 中配置的 Vercel AI SDK 实例进行，**严禁手写 `fetch` 解析 `ReadableStream`**。
*   **状态与存储分离**：
    *   **全局 UI 状态**（如当前选中的会话 ID、弹窗开关）放入 `Zustand` (`src/store`)。
    *   **会话聊天记录**由 `useChat` Hook 在内存中管理。
    *   **持久化数据**通过 `src/db/operations.ts` 统一读写 Dexie.js。

### 2.2 数据流规范（核心）
处理 AI 对话时，必须严格遵守以下生命周期：
1.  **加载**：切换会话时，从 Dexie 读取历史消息，作为 `useChat` 的 `initialMessages`。
2.  **交互**：用户发送消息，AI 流式回复，此时**只更新内存和 UI**，不频繁写库。
3.  **落盘**：监听 `useChat` 的 `onFinish` 回调，当一整段 AI 回复完成后，**批量**将用户问题和 AI 回复写入 IndexedDB，并更新 `conversations` 表的 `updatedAt` 时间。

### 2.3 组件设计规范
*   **UI 与逻辑分离**：组件文件夹内，UI 层（`.tsx`）与复杂业务逻辑（自定义 Hook `.ts`）必须分离。例如 `MessageList.tsx` 负责渲染，数据获取与虚拟列表配置逻辑放在 `useChatSync.ts` 中。
*   **Props 定义**：所有组件的 Props 必须使用 TypeScript 定义 `interface` 或 `type`，并导出。

---

## 3. 测试要求

针对 MVP 阶段，不追求 100% 覆盖率，但以下**核心链路必须有测试保护**：

### 3.1 安全测试（必须）
*   **XSS 防御测试**：构造包含 `<script>alert(1)</script>`、`<img onerror=...>` 的恶意文本，分别作为用户输入和模拟的 AI 回复，验证经过 `DOMPurify` 处理后，`react-markdown` 不会执行脚本。
*   **Key 隔离测试**：验证在应用全局的任何网络请求中，API Key 仅出现在 Request Headers 中，不会出现在 URL 参数或 Post Body 中。

### 3.2 数据持久化测试（必须）
*   **断点续聊**：模拟发送消息且 AI 回复完成后，强制刷新页面，验证消息是否从 IndexedDB 正确恢复到界面。
*   **删除级联**：验证删除某个会话时，该会话下的所有关联 `messages` 是否被彻底从数据库清除，不会造成孤儿数据。

### 3.3 边界与性能测试（推荐）
*   **Token 截断**：模拟极长对话记录，验证发起请求前的预处理逻辑是否能正确截断上下文，请求 Payload 未超出模型限制。
*   **长列表渲染**：向数据库插入 1000+ 条模拟消息，验证虚拟列表（`react-virtuoso`）是否正常工作，浏览器 DOM 节点数是否维持在合理范围（< 100个）。

---

## 4. 代码风格

### 4.1 TypeScript 严格模式
*   项目 `tsconfig.json` 必须开启 `"strict": true`。
*   **禁止使用 `any`**：如果 Dexie 查询返回或第三方库没有类型，必须手动声明 Interface，实在无法推断时仅允许使用 `unknown` 并配合类型守卫。
*   数据库模型必须与 `src/types/index.ts` 中定义的接口保持绝对一致。

### 4.2 命名规范
*   **组件文件**：使用 PascalCase（如 `MessageItem.tsx`）。
*   **工具函数/Hook文件**：使用 camelCase（如 `useNetwork.ts`, `sanitize.ts`）。
*   **数据库字段**：使用 camelCase（如 `createdAt`, `conversationId`）。
*   **常量**：使用 UPPER_SNAKE_CASE（如 `MAX_CONTEXT_TOKENS`）。
*   **布尔值变量/Props**：必须以 `is`、`has`、`should` 开头（如 `isLoading`, `hasError`）。

### 4.3 样式规范
*   **Tailwind 优先**：95% 的样式必须直接写在 JSX 的 `className` 中。
*   **禁止内联样式**：严禁使用 `style={{ color: 'red' }}`，除非是动态计算的绝对定位坐标等 Tailwind 无法覆盖的极端场景。
*   **复杂伪元素**：微信气泡的“小尖角”等使用 Tailwind 的 `[&::before]:content-[''] [&::before:absolute]` 语法实现，保持样式的可维护性。

---

## 5. 注意事项 (避坑指南)

### 🚫 绝对红线
1.  **API Key 泄漏**：代码库中（包括提交的 Git History）绝对不能出现真实的 API Key。必须使用环境变量（如 `VITE_API_KEY`）或完全由用户在前端界面输入。
2.  **绕过 Vercel AI SDK**：绝对不允许因为“流式不好控制”而放弃 `ai` 包去手写 SSE 解析，这会导致后续的上下文管理、中断机制彻底失控。

### ⚠️ 常见陷阱
1.  **虚拟列表的滚动穿透**：在使用 `react-virtuoso` 时，AI 正在流式输出，此时调用传统的 `scrollTop = scrollHeight` 会失效甚至导致列表疯狂跳动。**必须调用其内部提供的 `scrollToIndex` 方法**。
2.  **IndexedDB 的异步特性**：Dexie.js 的所有操作都是异步的。在页面刚加载（`useEffect` 初始化）时，如果直接读取 DB 状态并立刻依赖它去发起 API 请求，可能会拿到 `undefined`。必须正确使用 `async/await` 或处理 Loading 骨架屏状态。
3.  **Markdown 渲染卡顿**：如果 AI 一次性返回了极长的代码块，`react-markdown` 解析可能会导致主线程阻塞。在 MVP 阶段可暂不处理，但在 V1.5 需考虑引入 Web Worker 进行后台解析。
4.  **网络状态监听**：使用 `window.addEventListener('offline', ...)` 时，必须在组件卸载时 `removeEventListener`，避免内存泄漏。离线提示UI必须显眼，直接阻断用户点击“发送”按钮的行为。