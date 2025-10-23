# ai-orchestration Specification

## Purpose
TBD - created by archiving change add-ai-orchestration. Update Purpose after archive.
## Requirements
### Requirement: Prompt Composition Schema
应用 MUST 通过专门的 prompt 组合器输出统一 JSON schema,支持翻译/解析与回复生成两个任务,并包含系统、上下文、语气、历史与目标语言等字段。

#### Scenario: Compose Translation Payload
- **GIVEN** 用户录入新的对方消息  
- **WHEN** 系统为该消息准备翻译/解析请求  
- **THEN** Prompt 组合器返回形如  
  ```json
  {
    "task": "translate",
    "system": "…",
    "replyLanguage": "zh-CN",
    "context": {
      "references": [],
      "quotes": []
    },
    "history": [
      {"role": "external", "content": "…"}
    ],
    "input": {
      "message": "原始消息",
      "metadata": {
        "conversationId": "<id>",
        "messageId": "<row-id>"
      }
    }
  }
  ```  
- **AND** `history` 保留最近若干条会话消息(不超过设定上限),顺序为最旧→最新  
- **AND** `replyLanguage` 默认为对方消息语言,若会话已指定目标语言则使用该语言

#### Scenario: Compose Reply Payload
- **GIVEN** 用户在右侧控制面板勾选参考信息与引用文本,并选择语气/回复语言  
- **WHEN** 点击“生成回复”  
- **THEN** Prompt 组合器输出包含 `context.references` 与 `context.quotes` 原文内容、`tone`、`intent`、`history` 与 `replyLanguage` 的 JSON  
- **AND** `intent` 字段取当前草稿或最近 AI 解析的要点  
- **AND** 输出结构可直接序列化为 JSON 字符串用于预览与调试

### Requirement: AI Translation Workflow
系统 MUST 在记录对方消息后自动触发翻译/解析 AI 调用,并允许用户手动重试,结果需持久化在会话中。

#### Scenario: Auto Translate On Message
- **GIVEN** 用户在某会话录入新的对方消息  
- **THEN** 系统立即生成翻译/解析请求并显示加载状态  
- **AND** 成功后将译文/要点写入该行 mirror(analysis) 字段并刷新时间戳  
- **AND** 刷新页面后可从 localStorage 恢复此译文内容

#### Scenario: Retry Translation
- **GIVEN** 翻译调用失败或用户认为结果不满意  
- **WHEN** 用户点击“重新翻译”  
- **THEN** 系统重新发送同一消息的翻译请求  
- **AND** 成功后覆盖旧结果,失败时保留上一版内容并提示错误原因

### Requirement: AI Reply Generation Workflow
应用 MUST 基于 prompt 组合结果调用 AI 生成回复草稿,支持记录上下文选择与语气,并允许重试。

#### Scenario: Generate Reply Draft
- **GIVEN** 用户选择了会话的回复语言、语气与上下文勾选项  
- **WHEN** 在右侧输入框点击“生成回复”  
- **THEN** 系统调用 AI Client 返回回复文本  
- **AND** 回复内容写入当前会话最新一行的 mirror(intent) 字段,必要时追加新意图行  
- **AND** 会话状态更新最近生成时间,刷新后仍保留回复草稿

#### Scenario: Retry Reply Draft
- **GIVEN** 最近一次回复生成失败或需要重新生成  
- **WHEN** 用户点击“重新生成”  
- **THEN** 组合器重新构建 prompt,AI Client 重新请求  
- **AND** 成功后覆盖旧草稿并更新时间戳,失败时提示错误且不清空旧草稿

### Requirement: Control Panel Context Binding
控制面板 MUST 使用设置中的参考信息/引用文本,允许勾选、调整语气与回复语言,并提供 Prompt 预览功能展示最终 JSON。

#### Scenario: Render Real Context
- **GIVEN** 设置面板已保存参考信息与引用文本  
- **WHEN** 用户打开任意会话右侧控制面板  
- **THEN** 列表展示真实条目名称(Info/Quote 标签 + 标题),勾选状态与会话记录保持一致  
- **AND** 勾选变更立即写入会话上下文,刷新后保留

#### Scenario: Preview Prompt JSON
- **GIVEN** 用户已选择上下文并准备生成回复  
- **WHEN** 点击“预览 Prompt”按钮  
- **THEN** 弹出 Modal 展示当前 reply prompt 的 JSON 字符串(与实际请求一致)  
- **AND** Modal 支持一键复制,若组合失败则显示错误提示而不展示旧数据

