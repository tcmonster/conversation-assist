# 任务拆分文档

基于 @docs/product_design.md 与 @docs/technical_design.md 整理,用于指导实施与协作。

## 实施阶段概览

1. **基础设施与框架准备**  
   - 搭建 UI/状态管理骨架,完成核心依赖接入。  
   - 建立提示词目录与数据模型的最小实现。
2. **核心会话与消息流功能**  
   - 实现三栏布局、会话 CRUD、消息流与翻译/生成流程。  
   - 确保左右栏同步滚动与差异比对体验。  
3. **提示词与设置中心**  
   - 完成标签化 prompt 管理、快捷方案与预览。  
   - 接入模型配置、语气/语料控制。  
4. **数据持久化与导入导出**  
   - localStorage/IndexedDB 持久化策略与全量备份。  
   - 导入校验、敏感信息处理。  
5. **性能、测试与发布准备**  
   - 性能优化、测试体系、构建与发布流程。  
6. **后续扩展(选做)**  
   - 增量导出、标签高级管理、桌面封装等。

## 详细任务清单

### 阶段 1: 基础设施与框架

1. **项目结构与依赖校准**  
   - 确认 Next.js App Router 目录结构,补充必要配置。  
   - 安装/验证 shadcn/ui、tailwindcss、lucide-react、motion 等依赖(@docs/technical_design.md#架构概览)。  
   - 初始化全局样式、主题与图标系统。
2. **状态管理骨架**  
   - 创建 Zustand stores: `useConversationStore`, `useMessageStore`, `usePromptStore`, `useSettingsStore`(@docs/technical_design.md#状态管理策略)。  
   - 引入 `zustand/persist`,确定基础 schema。  
3. **工具与通用组件**  
   - 建立 Toast/Modal/Loading 组件,满足提示需求(@docs/product_design.md#反馈与警示)。  
   - 配置快捷键管理库(如 `cmdk` 或自定义 hook)。

### 阶段 2: 会话与消息流

1. **三栏布局实现**  
   - 构建左/中/右三栏布局,右栏可折叠(@docs/product_design.md#布局原则)。  
   - 同步滚动机制: 中间双列纵向对齐。  
2. **会话列表功能**  
   - CRUD、搜索、收藏置顶、归档。  
   - 虚拟列表/分页能力,支持上千条会话(@docs/technical_design.md#conversation-service)。  
3. **消息流与卡片组件**  
   - 展示原文、解析、意图、AI 草稿、最终稿。  
   - 编辑后重新生成,记录 diff(@docs/technical_design.md#message-timeline)。  
4. **翻译/解析流程**  
   - 粘贴原文→调用翻译 API→显示多模式结果(@docs/product_design.md#核心场景与任务)。  
   - 解析模式切换与缓存。

### 阶段 3: 提示词与生成

1. **Prompt 目录与加载**  
   - 搭建 `prompts/` 目录,按类型存放模板(@docs/requirement.md#提示词工程)。  
   - 实现标签索引与搜索,支持多选筛选。  
2. **Prompt Composer**  
   - 根据会话上下文组装 JSON schema,提供预览 Modal(@docs/technical_design.md#prompt-组合流程)。  
   - 允许保存/应用快捷方案。  
3. **AI Client 接入**  
   - 统一 `invokeTask` 接口,分别调用翻译与回复模型(@docs/technical_design.md#ai-调用流程)。  
   - Loading/错误状态反馈,额度提示。

### 阶段 4: 设置中心与数据持久化

1. **设置面板**  
   - API Key、默认语气、模型选择、提示词模板管理(@docs/product_design.md#设置中心)。  
   - 标签 CRUD,平面结构,多选交互。  
2. **数据存储实现**  
   - 会话/消息/设置的 localStorage 持久化,大文本走 IndexedDB(可选)(@docs/technical_design.md#数据存储)。  
   - 敏感会话标记与批量清理入口。  
3. **导出/导入功能**  
   - 全量 JSON/Markdown 导出,可选敏感数据处理(@docs/product_design.md#关键流程)。  
   - 导入校验、冲突处理、回滚策略。

### 阶段 5: 性能、测试与发布

1. **性能优化**  
   - 虚拟滚动,消息按需渲染, prompt 预编译(@docs/technical_design.md#性能优化)。  
   - 翻译结果缓存。  
2. **测试体系**  
   - 单元测试: prompt 组合、导入导出校验、store 更新。  
   - E2E: 翻译→生成→复制工作流,导出导入(@docs/technical_design.md#测试策略)。  
   - Mock 模型调用。  
3. **构建与发布流程**  
   - 脚本: `pnpm lint/test/build`,生成静态版本。  
   - 发布清单与 CHANGELOG 模板。

### 阶段 6: 拓展与验证(可选)

- 增量导出/版本历史(待确认)。  
- Prompt 标签排序/拖拽(@docs/requirement.md#待确认)。  
- 桌面打包(Electron/Tauri)。  
- 多候选生成对比。

## 角色分工建议

- **产品/交互设计**: 负责原型、交互细化、文案与可用性验收。  
- **前端开发**: 实现 UI、状态与 AI 调用、持久化。  
- **提示词工程**: 维护 prompt 模板、标签体系与测试。  
- **测试/QA**: 制定测试计划、执行自动化与手动测试。  
- **运维/发布**: 管理构建流程与版本发布。

## 里程碑建议

| 里程碑 | 时间 | 交付内容 |
| --- | --- | --- |
| M1 基础可交互原型 | 第 1-2 周 | 完成三栏布局、会话 CRUD、基础翻译展示 |
| M2 生成闭环 | 第 3-4 周 | 实现提示词组合、AI 生成、复制发送流程 |
| M3 数据与设置完善 | 第 5-6 周 | 导入导出、设置面板、提示词管理完成 |
| M4 稳定性与发布 | 第 7-8 周 | 性能优化、测试体系、发布脚本 |
| M5 扩展功能 | 视需求 | 选做项上线 |

