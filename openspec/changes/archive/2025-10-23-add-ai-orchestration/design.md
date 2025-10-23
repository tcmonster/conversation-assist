## Overview
本次改动在前端引入独立的 Prompt 组合层与 AI 调用层,串联会话数据、设置上下文与 UI 控制面板,完成“消息翻译/解析 → 回复生成”的闭环。核心模块包括:

- **Prompt Templates**: `prompts/` 目录存放系统、参考信息、引用文本、语气预设等模板,按标签索引管理。
- **Prompt Composer**: `src/lib/ai/prompt-composer.ts` 负责从会话、设置、控制面板选择中组装统一 JSON schema。
- **AI Client**: `src/lib/ai/client.ts` 封装翻译(`translate`)/解析(`analyze`)/回复(`reply`)任务,支持真实请求与本地 mock。
- **Conversation Enhancements**: `ConversationProvider` 扩展以存储目标语言、语气、已选参考/引用项以及 AI 生成结果。
- **Control Panel**: 读取设置 Provider,渲染真实语料,驱动 prompt 组合与预览。

## Prompt Schema
- 顶层字段:
  ```json
  {
    "task": "translate" | "analyze" | "reply",
    "system": "string",
    "tone": "string | null",
    "replyLanguage": "string",
    "intent": "string | null",
    "context": {
      "references": ["..."],
      "quotes": ["..."]
    },
    "history": [
      {"role": "user" | "assistant" | "external", "content": "..."}
    ],
    "input": {
      "message": "...",
      "metadata": {...}
    }
  }
  ```
- `system` 来自默认模板,允许按任务覆写。
- `context.references`/`context.quotes` 由控制面板选项提供,默认取全部已勾选项的内容。
- `replyLanguage` 依据会话设置(初始为最近对方消息语言,后续可手动调整)。
- `history` 取最近 N 条消息(默认 6),按时间排序。

## Data Flow
1. 用户录入对方消息 → `ConversationProvider.addPartnerMessage` 触发 → 调用 `aiService.translateAndAnalyze(row)`。
   - `translateAndAnalyze` 通过 Prompt Composer 生成 `task: "translate"` schema → 调用 AI Client。
   - 成功后更新 `row.mirror.content` 为翻译/解析文本,并记录 `highlights` 信息。
2. 用户在控制面板勾选参考/引用语料、调整语气或回复语言 → `ConversationProvider` 更新会话上下文字段。
3. 用户点击“生成回复” → `buildReplyPrompt` 使用最新会话上下文 + 意图输入 + 历史消息组装 JSON → `invokeAiTask("reply")`。
   - 成功后将返回内容写入当前意图行的 mirror/消息草稿,并追加到 feed。
4. Prompt 预览按钮读取最新组合结果,在 Modal 中展示 JSON 文本,支持复制。

## State Changes
- Conversation 类型新增:
  ```ts
  {
    replyLanguage: string;
    tonePresetId?: string;
    selectedReferenceIds: string[];
    selectedQuoteIds: string[];
  }
  ```
- Feed Mirror 支持存储 `translation`, `analysisHighlights`, `aiStatus` 等扩展字段(需在任务实现时细化)。
- 控制面板通过新 hook 读取/更新这些字段,保持与设置 Provider 同步。

## Error Handling
- AI Client 将错误分类为: 配置缺失、网络失败、超时、供应商错误、未知异常。
- Conversation store 记录失败状态,UI 显示 toast + 重试按钮; mock 模式下提供固定示例并打印警告。

## Testing Strategy
- Prompt Composer: 使用 Jest/uvu(?)/Vitest(依据项目工具) 编写纯函数单元测试,验证 schema 组合。
- AI Client: 针对 mock/错误路径添加测试。
- Component Integration: 通过 React Testing Library 测试控制面板选择与 prompt 预览 JSON 是否匹配 store。
