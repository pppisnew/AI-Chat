# 📋 实施计划：前端样式与布局优化

## 任务类型
- [x] 前端 (→ gemini)

## 约束
- 仅修改 className 字符串、Tailwind 类、CSS 值和布局结构
- 严禁修改逻辑、状态、事件处理或组件结构

---

## 技术方案

综合双模型分析，核心策略：
1. **统一圆角语言**：所有头像从 `rounded-full` 改为 `rounded-lg`，与微信 PC 风格一致
2. **消除硬编码颜色**：用 Tailwind token 替换 hex 值
3. **修复布局 hack**：用 Tailwind 类替换 inline style
4. **提升输入区视觉层次**：外层容器用 `bg-bg-secondary` 与白色输入卡片形成对比
5. **代码块样式一致性**：与整体设计系统对齐

---

## 实施步骤

### Step 1 — Sidebar.tsx
**文件**: `src/components/Layout/Sidebar.tsx`

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| 新建聊天按钮 | `bg-wechat-green hover:bg-wechat-greenLight ... font-medium text-sm` | 添加 `rounded-lg shadow-sm`，改 `hover:bg-wechat-greenDark` |

---

### Step 2 — ChatWindow.tsx
**文件**: `src/components/Layout/ChatWindow.tsx`

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| header 高度 | `h-[50px] px-5` | `h-[60px] px-6` |
| header 背景 | `bg-bg-tertiary` | 保持 `bg-bg-tertiary`（白色，与消息区形成对比） |

---

### Step 3 — MessageItem.tsx
**文件**: `src/components/Message/MessageItem.tsx`

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| 用户头像 | `rounded-full` | `rounded-lg` |
| AI 头像 | `rounded-full` | `rounded-lg` |

---

### Step 4 — MessageList.tsx
**文件**: `src/components/Message/MessageList.tsx`

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| TypingIndicator AI 头像 | `rounded-full` | `rounded-lg` |
| 空状态内层 div | `style={{ marginTop: '-10%' }}` | 移除 inline style，改用 `-mt-[10%]` |

---

### Step 5 — ChatInput.tsx
**文件**: `src/components/Input/ChatInput.tsx`

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| 外层容器 | `bg-white` | `bg-bg-secondary border-t border-border-light` |
| 内层卡片边框 | `border-gray-100` | `border-border-light` |
| 发送按钮激活态 | `bg-[#07C160] hover:bg-[#06AD56]` | `bg-wechat-green hover:bg-wechat-greenDark` |

---

### Step 6 — MarkdownRenderer.tsx
**文件**: `src/components/Message/MarkdownRenderer.tsx`

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| 代码块头部 | `bg-gray-200 rounded-t-lg text-xs` | `bg-gray-100 border-b border-gray-200 rounded-t-lg text-xs` |

---

## 关键文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/Layout/Sidebar.tsx:176-196` | 修改 | 新建按钮加圆角和阴影 |
| `src/components/Layout/ChatWindow.tsx:54-55` | 修改 | header 高度调整 |
| `src/components/Message/MessageItem.tsx:24,29` | 修改 | 两个头像 rounded-full → rounded-lg |
| `src/components/Message/MessageList.tsx:32,124` | 修改 | TypingIndicator 头像 + 空状态 inline style |
| `src/components/Input/ChatInput.tsx:63,89,115` | 修改 | 外层背景、边框 token、发送按钮颜色 |
| `src/components/Message/MarkdownRenderer.tsx:46` | 修改 | 代码块头部背景 |

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| `wechat-greenDark` token 不存在 | 检查 tailwind.config.js，已确认存在 `greenDark: '#06AE56'` |
| `-mt-[10%]` 在某些 Tailwind 版本不支持 | Tailwind v3 支持任意值，无风险 |
| `bg-bg-secondary` 用于输入区外层可能影响视觉 | 与消息区背景一致，输入卡片白色形成自然对比 |

---

## SESSION_ID（供 /ccg:execute 使用）
- GEMINI_SESSION (Analyzer): 37f81ea7-c559-4e75-a292-288ba0300b8f
- GEMINI_SESSION (Architect): d102171e-e792-46a2-88fb-b4ceb480184c
