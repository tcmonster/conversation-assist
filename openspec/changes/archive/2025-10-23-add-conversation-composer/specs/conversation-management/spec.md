## MODIFIED Requirements

### Requirement: Conversation Data Model
应用 MUST 维护结构化的会话数据,对话消息与意图/解析需按方向成对出现,以支撑中栏双列矩阵。

#### Scenario: Append Partner Message
- **GIVEN** 用户从左侧输入框记录新的对方消息  
- **WHEN** 提交“记录对方消息”  
- **THEN** 数据结构中新增一行 `role = partner` 的消息  
- **AND** 同一行右侧生成 `type = analysis` 的解析占位(内容可留空), 保持配对完整  
- **AND** 新行写入 localStorage, UI 自动滚动到最新位置

#### Scenario: Append Self Reply
- **GIVEN** 用户在左侧输入框选择“记录我方消息”  
- **THEN** 会话新增 `role = self` 的消息行  
- **AND** 同行右侧写入 `type = intent` 的意图说明(默认空或沿用右侧草稿)  
- **AND** 状态持久化, 刷新后仍可看到新增内容

### Requirement: Conversation Management Actions
应用 MUST 提供置顶、归档、删除及新增、重命名等会话交互,保持状态一致与持久化。

#### Scenario: Compose Intent Without Message
- **GIVEN** 用户只在右侧输入框填写意图  
- **WHEN** 点击“生成回复”  
- **THEN** 会话新增一行 `role = self` 的消息占位(标记待生成)  
- **AND** 同行右侧记录提交的意图内容, 方便后续 AI 执行  
- **AND** 输入框清空, toast 提示操作完成
