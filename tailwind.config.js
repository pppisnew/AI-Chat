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
        // 背景色 - 微信灰白色调
        bg: {
          primary: '#EDEDED',      // 左侧栏背景
          secondary: '#F5F5F5',    // 右侧聊天区背景
          tertiary: '#FFFFFF',     // 消息气泡背景
          hover: '#D9D9D9',        // 悬停背景
          active: '#C9C9C9',       // 激活背景
        },
        // 文字色
        text: {
          primary: '#191919',      // 主文字
          secondary: '#888888',    // 次要文字（时间、摘要）
          tertiary: '#B2B2B2',     // 占位符
          inverse: '#FFFFFF',      // 反色文字（绿色气泡内）
        },
        // 边框色
        border: {
          light: '#E5E5E5',
          medium: '#D6D6D6',
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
