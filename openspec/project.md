# Project Context

## Purpose
- 支持跨语种沟通用户在邮件、IM 等场景中快速理解来信并生成高质量回复,降低翻译与润色成本(@docs/product_design.md#产品愿景与目标)。
- 维持完全本地的离线化/单机体验,所有会话与提示词仅保留在用户设备,满足隐私与安全诉求(@docs/requirement.md#产品范围与约束)。
- 以三栏工作台(UI 已实现)统筹“原文/译文”“意图草稿”“AI 控制面板”,确保用户在少量操作内完成翻译、梳理和回复输出。

## Tech Stack
- **前端框架**: Next.js 15(App Router) + React 19 + TypeScript 严格模式,路径别名 `@/*` 组织模块。
- **UI 与样式**: tailwindcss 4 + shadcn/ui 组件体系,配合 lucide-react 图标与自定义 Sidebar 组件。
- **交互基元**: Radix UI 原子组件(checkbox、tabs、dialog 等)与 motion 计划负责动效,当前界面以静态数据演示核心流程。
- **数据持久化(规划)**: 浏览器 localStorage 为主,必要时引入 IndexedDB 处理大体量历史记录(@docs/technical_design.md#数据存储)。
- **AI 集成(规划)**: 封装统一 AI Client,兼容翻译与回复模型,根据任务类型选择不同供应商配置(@docs/technical_design.md#ai-调用流程)。

## Project Conventions

### Code Style
- TypeScript 严格模式 + 函数组件 Hook 架构; 组件按职责拆分在 `src/components/*`。
- tailwind utility class + `cn` 工具组合样式,仅在必要时补充 CSS。
- ESLint(Next.js 规则)作为最低质量门槛,计划补充单元/端到端测试前置在 CI。
- UI 文案默认中文,提示词内容建议以英文维护确保模型对齐(@docs/requirement.md#提示词工程)。

### Architecture Patterns
- **三栏布局**: `SidebarProvider` 驱动左侧会话列表(AppSidebar)、中部对话矩阵、右侧 AI 控制面板(ControlPanel),保持顶部/底部固定、中部滚动; 中线贯穿实现左右对齐(@docs/product_design.md#信息架构)。
- **对话矩阵**: 中栏 `SectionRow` 将对话与解析成对呈现,自动填充空白列,满足“消息+解析/意图”同步滚动的体验目标(@docs/requirement.md#界面)。
- **输入与生成**: 底部双列 `ColumnComposer` 分别承载“下一步消息草稿”“回复意图/提醒”,结合主/次操作按钮映射“生成回复”“保存意图”等动作。
- **控制面板**: 右栏突出上下文勾选、语气 Tabs 与 Prompt 预览入口,对齐提示词组合器规划; 后续会挂接真实数据与模型状态提示。
- **会话管理**: 左栏提供搜索、置顶、最近、归档与设置入口,与产品旅程中的“快速回溯/收藏/搜索”能力一致(@docs/product_design.md#运营与留存设计)。

### Testing Strategy
- 单元测试: 提示词组合器、导入导出校验、状态更新逻辑(@docs/technical_design.md#测试策略)。
- 集成/E2E: 使用 Playwright 覆盖“翻译→意图→生成→复制”主流程,并验证导入导出及快捷操作。
- Mock: 提供无真实 Key 的 AI Mock,保证离线演示。
- 性能基准: 针对 500+ 会话、1 万条消息数据集评估加载延迟与生成耗时。

### Git Workflow
- 以 `main` 为发布分支,功能开发需遵循 OpenSpec 变更流程: 提前创建 `openspec/changes/<change-id>/` 说明,获批后在特性分支实现。
- 提交信息推荐引用相关 change-id,完成任务后更新 `docs/change_history.md` 并运行 `openspec validate --strict` 确认一致性。
- 保持小步提交,确保 UI 与规格保持同步; 禁止直接在 `main` 上 push 未经评审的功能性改动。

## Domain Context
- 用户旅程涵盖“粘贴原文→翻译解析→整理意图→生成回复→导出/复制→维护设置”全链路(@docs/product_design.md#用户旅程)。
- 左栏会话项展示摘要/更新时间/收藏状态,支持搜索与归档折叠,对应自由职业者与客服快速回溯高价值对话的需求。
- 中栏双列结构同时展示原文/译文与意图/生成稿,配合自动滚动至底部的体验,确保长对话也能快速定位最新内容(@docs/product_design.md#核心场景与任务)。
- 右侧控制面板以勾选上下文、引用语料、语气 Tabs 实现 Prompt 组合,并提供实时 Prompt 预览按钮,方便高阶用户调试(@docs/requirement.md#提示词工程)。
- 设置面板(侧边底部入口)将承载模型/密钥、提示词模板、导入导出等高级操作,支撑隐私与备份需求。

## Important Constraints
- 保持本地优先: 所有会话、提示词、设置存储在用户设备,仅在用户触发 AI 调用时外发必要上下文(@docs/requirement.md#产品范围与约束)。
- UI 三栏结构为既定体验,后续功能需在现有布局内演进,避免大幅改动已完成的视觉与交互。
- 默认生成语言与对方语种一致,暂不提供多候选/多语并行输出; 扩展能力需另行评估。
- 需在大数据量场景(大量会话/消息)维持性能,列表应支持虚拟滚动或分页策略。
- 敏感数据操作(导入、导出、清理)必须提供显式确认与错误反馈。

## External Dependencies
- AI 模型供应商(OpenAI、Azure OpenAI、Claude 等)通过统一客户端接入,遵循 HTTPS 与超时/重试策略(@docs/technical_design.md#ai-调用流程)。
- 浏览器本地存储(localStorage/IndexedDB)提供持久化能力; 若转为桌面版,需评估对应存储 API。
- UI 依赖 shadcn/ui、Radix primitives 与 lucide-react,升级需关注 Breaking Change 并同步更新自定义组件。
