/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 微信风格颜色变量
      colors: {
        // 主色调 - 微信绿
        wechat: {
          green: '#07C160',
          greenLight: '#1AAD19',
          greenDark: '#06AE56',
        },
        // 背景色 - 微信PC端风格
        bg: {
          primary: '#2E2E2E',      // 左侧栏背景 - 深灰
          secondary: '#F5F5F5',    // 右侧聊天区背景 - 浅灰
          tertiary: '#FFFFFF',     // 输入框区域背景 - 纯白
          hover: '#3A3A3A',        // 左侧栏悬停背景
          active: '#4A4A4A',       // 左侧栏激活背景
          lightHover: '#E8E8E8',   // 右侧区域悬停背景
        },
        // 文字色
        text: {
          primary: '#1A1A1A',      // 主文字 - 深灰（非纯黑）
          primaryInverse: '#FFFFFF', // 左侧栏主文字 - 白色
          secondary: '#999999',    // 次要文字（时间、摘要）- 中灰
          secondaryInverse: '#AAAAAA', // 左侧栏次要文字
          tertiary: '#B2B2B2',     // 占位符
          tertiaryInverse: '#777777', // 左侧栏占位符
          inverse: '#FFFFFF',      // 反色文字（绿色气泡内）
        },
        // 边框色
        border: {
          light: '#E0E0E0',        // 浅灰分割线
          medium: '#D6D6D6',
          sidebar: '#3A3A3A',      // 左侧栏分割线
        },
        // 消息气泡
        bubble: {
          user: '#95EC69',         // 用户消息气泡（微信绿）
          userText: '#000000',     // 用户消息文字
          assistant: '#FFFFFF',    // AI消息气泡
          assistantText: '#000000', // AI消息文字
        },
      },
      // 圆角 - 微信风格
      borderRadius: {
        'bubble': '8px',
      },
      // 阴影
      boxShadow: {
        'wechat': '0 1px 2px rgba(0, 0, 0, 0.1)',
        'wechat-hover': '0 2px 4px rgba(0, 0, 0, 0.12)',
      },
      // 动画
      animation: {
        'typing': 'typing 1.4s infinite ease-in-out',
      },
      keyframes: {
        typing: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
