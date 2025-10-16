# Change History

- [x] 2025-10-15 · Codex: 紧凑聊天行距、扩充示例消息并恢复 AI 控制面板 (影响: src/app/page.tsx, src/components/conversation/column-composer.tsx)
- [x] 2025-10-15 · Codex: 调整气泡最大宽度并连通分割线, 统一上下栏衔接 (影响: src/app/page.tsx)
- [x] 2025-10-15 · Codex: 优化气泡宽度与底部输入, 去除调试底色并区分消息配色 (影响: src/app/page.tsx, src/components/conversation/column-composer.tsx)
- [x] 2025-10-15 · Codex: 中栏改为消息/解析成对气泡, 左右按对话对齐并配时间戳 (影响: src/app/page.tsx)
- [x] 2025-10-15 · Codex: 为中栏构建消息栅格, 对齐左右行内容并提供示例消息/输入框 (影响: src/app/page.tsx)
- [x] 2025-10-15 · Codex: 优化三段布局对齐, 修复滚动分割线并左对齐顶部内容 (影响: src/app/page.tsx)
- [x] 2025-10-15 · Codex: 页面填满视口仅中段滚动, 上下栏固定无全局滚动条 (影响: src/app/page.tsx)
- [x] 2025-10-15 · Codex: 去除三栏卡片包裹并固定上下栏, 中栏长内容滚动 (影响: src/app/page.tsx)
- [x] 2025-10-15 · Codex: 页面改为垂直三段结构并为每段构建独立左右分栏 (影响: src/app/page.tsx)
- [x] 2025-10-15 · Codex: 抽离左右栏头部与输入组件, 重置主界面为三段占位布局 (影响: src/components/conversation/*, src/app/page.tsx)
- [x] 2025-02-14 · TC: 统一 Sidebar skeleton 宽度以消除 hydration 警告 (影响: src/components/ui/sidebar.tsx)
- [x] 2025-02-14 · TC: 重构对话区为上下滚动同步的消息/解析双栏, 调整卡片对齐与输入区域固定 (影响: src/app/page.tsx)
- [x] 2025-02-14 · TC: 重构侧边栏为置顶/最近/归档三段并新增搜索与全局设置入口 (影响: src/components/app-sidebar.tsx)
- [x] 2025-02-14 · TC: 更新主界面为左右双栏消息/解析布局并引入固定 AI 控制面板 (影响: src/app/page.tsx)
- [x] 2025-02-14 · TC: 建立标准工作流 (影响: 更新 AGENTS.md、task_plan)
- [x] 2025-02-15 · TC: 会话页面分为顶部标题、中部同步滚动消息、底部固定输入区, 中线贯通三栏且仅中部滚动 (影响: src/app/page.tsx)
- [x] 2025-02-15 · TC: 底部输入区贴边显示且不中覆盖内容, 仅中栏滚动 (影响: src/app/page.tsx)

请保持倒序排列, 并在需要时于括号内追加简短备注。
