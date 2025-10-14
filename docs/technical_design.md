# 技术设计文档

@docs/requirement.md#综述  
@docs/product_design.md#用户旅程

## 架构概览

- **前端框架**: 基于 Next.js(App Router) 构建,使用 TypeScript 强化类型安全,UI 依赖 shadcn/ui、tailwindcss 与 lucide-react(@docs/requirement.md#技术)。  
- **状态层**: 通过 Zustand 管理全局与局部状态,配合 React Query/自研 hooks 管理异步请求与缓存。  
- **AI 服务层**: 在客户端封装统一 LLM 调用模块,对接翻译与回复模型,支持互换供应商与多提示词策略。  
- **存储层**: 浏览器 localStorage 为核心持久化载体,结合 IndexedDB(可选)处理大体量数据; 导入/导出使用 JSON/Markdown。  
- **Prompt 组合层**: 独立目录维护系统、上下文、语气等模块化 prompt,通过组合器生成最终 JSON 请求体(@docs/requirement.md#提示词工程)。  
- **通信安全**: 所有敏感配置(如 API Key)仅存储本地,调用外部模型接口时使用 HTTPS。

```
[UI Layer] —shadcn/ui & tailwindcss
    ↓ user actions / keyboard shortcuts
[State Layer] — Zustand store + derived selectors
    ↓ triggers
[Domain Services]
    - Conversation Service
    - Prompt Composer
    - AI Client (Translation / Reply)
    - Export/Import Manager
    ↓ storage ↔ AI APIs
[Persistence] localStorage (+ IndexedDB optional)
```

## 模块划分

### 1. Conversation Service

- 负责会话 CRUD、排序、收藏、归档。  
- 维护会话元信息(名称、语言、更新时间、收藏状态、选中语料组合)。  
- 与消息流模块协作,在删除与导出时批量处理数据。  
- 支持虚拟列表数据源,为左栏提供懒加载能力(@docs/product_design.md#信息架构)。

### 2. Message Timeline

- 管理消息实体(原文、解析、意图、生成稿、发送稿)。  
- 提供版本控制: 记录生成前后 diff、编辑历史(本地缓存)。  
- 支持重新生成: 更新消息后触发 prompt 组合与 AI 调用。  
- 维持左/右列同步滚动的渲染数据结构,通过共享时间戳进行对齐(@docs/requirement.md#界面)。

### 3. Prompt Composer

- 读取 prompt 目录,按类型(system/context/intent/tone)加载。  
- 提供标签索引,支持多标签筛选,无层级结构(@docs/requirement.md#提示词工程)。  
- 根据会话历史,截取最近若干条消息,建立上下文片段,并按 JSON schema 输出。  
- 支持渲染预览 Modal,展示最终注入文本,便于调试。

### 4. AI Client

- 封装翻译、解析、生成等能力,统一调用入口: `invokeTask({ type: 'translate' | 'reply', payload })`。  
- 允许配置不同模型端点,支持 OpenAI、Azure、Claude 等结构。  
- 实现超时、重试与错误分类(额度不足、网络异常、提示词非法)。  
- 与状态层协作显示进度、额度提示(@docs/requirement.md#界面)。

### 5. Settings & Prompt Library

- 管理 API Key、默认语气、模型偏好、提示词模板。  
- 标签管理: 平面标签 CRUD、排序,允许拖拽调整优先级(若后续确认)。  
- 支持导出时合并设置与会话数据,导入时执行结构校验、版本比对(@docs/requirement.md#数据存储)。

### 6. Export/Import Manager

- 导出: 打包会话、消息、提示词、设置为单一 JSON; 另提供 Markdown 摘要(按会话)。  
- 导入: 校验 schema 版本、数据量,提示覆盖风险,支持局部预览。  
- 提供钩子交给 UI 触发 Toast/进度条。  
- 扩展点: 支持增量导出或版本历史(待确认)。

## 数据模型

### 会话 `Conversation`

```ts
type PromptTagId = string;

interface Conversation {
  id: string;
  title: string;
  language: string;
  summary: string;
  pinned: boolean;
  archived: boolean;
  updatedAt: number;
  promptTagIds: PromptTagId[]; // 会话记忆的提示词标签组合
  tonePresetId?: string;
}
```

### 消息 `Message`

```ts
type MessageRole = 'external' | 'user-intent' | 'ai-draft' | 'final-reply';

interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  originalLanguage: string;
  targetLanguage: string;
  content: string;
  translation?: {
    literal?: string;
    adaptive?: string;
    summary?: string;
  };
  diff?: string; // 生成前后变化
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'generated' | 'sent';
}
```

### 提示词与语料

```ts
interface PromptTemplate {
  id: string;
  type: 'system' | 'context' | 'intent' | 'tone';
  tags: string[];
  title: string;
  description?: string;
  content: string; // 建议英文
  createdAt: number;
  updatedAt: number;
}

interface PromptPreset {
  id: string;
  name: string;
  templateIds: string[];
  tonePresetId?: string;
}
```

### 导出结构

```ts
interface BackupPackage {
  version: string;
  exportedAt: number;
  conversations: Conversation[];
  messages: Message[];
  promptTemplates: PromptTemplate[];
  promptPresets: PromptPreset[];
  settings: AppSettings;
}
```

## 状态管理策略

- 使用多个 Zustand store 拆分责任: `useConversationStore`, `useMessageStore`, `usePromptStore`, `useSettingsStore`。  
- store 内部使用 immer 提供不可变更新语义,公开 selector/hooks 减少组件重渲染。  
- 结合 `zustand/persist` 将关键状态同步至 localStorage,大型数据(消息正文)可存放 IndexedDB 以避免 localStorage 容量问题。  
- 对异步调用(翻译、生成)使用 `useAsyncTask` hook 管理 loading/error 状态,结合 AbortController 支持取消。

## Prompt 组合流程

1. 收集上下文: 从选定会话提取最近 N 条消息(可配置,默认 6),按外部→用户→AI 顺序排序。  
2. 读取模板: 根据标签获取系统/上下文/意图/语气模板内容。  
3. 组装 schema:  
   ```json
   {
     "system": "...",
     "context": ["...", "..."],
     "intent": "...",
     "tone": "...",
     "history": [
       {"role": "user", "content": "..."},
       {"role": "assistant", "content": "..."}
     ],
     "task": "reply"
   }
   ```  
4. 在 UI 提供预览 Modal,支持复制 JSON 供调试。  
5. 将 schema 传入 AI Client,映射到供应商 API 所需格式。

## AI 调用流程

1. 校验模型配置和 API Key 是否存在,无配置时提示用户跳转设置页。  
2. 根据任务类型选择模型/端点:  
   - `translate`: 可使用轻量模型(如 gpt-4o-mini / gemini-pro-translate)。  
   - `reply`: 使用较强模型(如 gpt-4o / claude 3).  
3. 生成请求载荷:  
   - 字段: 模型名、messages[], temperature、max_tokens 等可配置参数。  
   - 包含 prompt schema 中的系统与上下文信息。  
4. 发送请求,处理响应:  
   - 成功: 保存结果到消息实体,同步更新时间。  
   - 失败: 记录错误类型,显示 Toast/弹窗,允许重试。  
5. 统计: 记录平均响应时长、 token 消耗(若供应商返回相关数据)。

## 错误处理与恢复

- **API 错误**: 分类为认证失败、额度不足、网络错误、超时; 提供对应文案与指引。  
- **数据异常**: 导入失败时,提供错误定位(行号/字段),不修改现有数据。  
- **本地存储容量不足**: 捕获 `QuotaExceededError`,提示用户导出/清理、切换 IndexedDB。  
- **生成失败**: 允许用户回滚至上一次成功版本,保留失败记录用于排查。

## 安全与隐私

- API Key 仅保存在 localStorage(可选加密),提供一键清除。  
- 支持敏感会话标记,在导出时默认不包含,需用户勾选才导出。  
- 提供安全模式: 快捷清除所有数据,用于公共场景快速退出。  
- 不向第三方发送任何本地存量数据,除非用户主动触发 AI 调用。

## 性能优化

- 会话列表使用虚拟滚动,支持搜索/过滤时的 memoization。  
- 消息详情按需渲染,大段文本延迟加载。  
- Prompt 模板预编译,减少组合时间。  
- 使用 web worker 处理 diff、Markdown 渲染等重任务,避免阻塞主线程。  
- 引入缓存层,避免重复翻译同一文本(基于 hash 缓存)。

## 日志与指标

- 本地统计关键操作次数(生成、翻译、导出),用于优化体验。  
- 可选集成本地 analytics(仅存本机),或提供导出日志功能。  
- 对严重错误保留匿名栈信息,便于用户携带日志反馈。

## 测试策略

- **单元测试**: 聚焦 prompt 组合器、导入导出校验、状态更新逻辑。  
- **集成测试**: 使用 Playwright 对关键流程(翻译→生成→复制)运行端到端脚本。  
- **模拟 API**: 提供 mock service,允许在无真实 Key 情况下演示流程。  
- **回归检查**: 针对导出/导入与会话 CRUD 维护回归用例。  
- **性能基准**: 在 500+ 会话、10K 消息数据集下评估加载与生成延迟。

## 部署与发布流程

- 使用 Next.js 静态导出或部署至 Vercel/Netlify,但保持本地数据逻辑。  
- 构建脚本: `pnpm lint && pnpm test && pnpm build`。  
- 发布前进行提示词目录与默认模板校验,确保引用一致。  
- 提供 CHANGELOG,记录新增提示词、模型支持等。

## 未来扩展

- 增量导出与版本管理(待需求确认)。  
- 多候选生成与 A/B 对比。  
- 团队同步或云端备份(需重新评估隐私策略)。  
- 提供桌面版封装(Electron/Tauri),增强离线能力。

