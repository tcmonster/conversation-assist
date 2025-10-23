# Design Notes

## Provider Extensions
- 新增 helper 生成 feed row id, 统一时间戳。
- Actions:
  - `addPartnerMessage(content)`：生成 partner 消息 + analysis 镜像(当前可空/占位)。
  - `addSelfMessage(content)`：生成 self 消息 + intent 镜像(以右栏最新意图或空字符串)。
  - `addIntent(content)`：仅写入 intent 镜像, message 使用上一次 self reply or create placeholder? 需求要求“只能填写意图并生成回复”, 方案是在 feed 中补上一条 self message（内容可为空, 标记为“待生成回复”）。
- 意图生成的“回复”先以占位文本存储, 保持配对结构, 未来对接 AI 时再替换。

## UI Wiring
- ColumnComposer 改造：暴露 `onSubmit`, `onSecondary` 回调, 聚焦清空文本域。
- 左侧 composer 提供两个按钮: 一个“记录对方消息”, 一个“记录我方消息”；`primaryAction` -> 对方消息, `secondaryAction` -> 我方消息。
- 右侧 composer 的 primary 按钮叫“生成回复”, secondary 可改为“清空”。
- 提交成功后展示 toast, 自动滚动到最新 feed。

## Persistence
- 所有写操作通过 provider reducer 执行, 保证 localStorage 同步生效。
- 生成默认意图/analysis 内容时使用易识别的文案(例如“待补充翻译”/“草拟意图”).
