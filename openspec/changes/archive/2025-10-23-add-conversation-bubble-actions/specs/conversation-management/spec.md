## MODIFIED Requirements

### Requirement: Conversation Data Model
应用 MUST 维护结构化的会话数据,对话消息与意图/解析需按方向成对出现,以支撑中栏双列矩阵。

#### Scenario: Render When Mirror Missing
- **GIVEN** 某条消息缺少对应的镜像数据  
- **THEN** UI 左/右列只渲染实际存在的气泡  
- **AND** 未提供的数据列保持留白, 不显示占位占用视觉空间  
- **AND** 数据结构允许 `mirror` 为空并持久化保存

### Requirement: Conversation Management Actions
应用 MUST 提供置顶、归档、删除及新增、重命名等会话交互,保持状态一致与持久化。

#### Scenario: Edit Partner Message
- **GIVEN** 用户点击对方消息的编辑动作  
- **WHEN** 在弹窗中修改内容并保存  
- **THEN** 会话中该行消息内容更新, 更新时间戳  
- **AND** 状态立即写入 localStorage, UI 同步展示新文案

#### Scenario: Edit Self Message
- **GIVEN** 用户点击我方消息的编辑操作  
- **WHEN** 修改后保存  
- **THEN** 同一行的我方消息(及必要的意图说明)更新  
- **AND** 数据持久化, 并触发成功提示

#### Scenario: Delete Message Row
- **GIVEN** 用户在任意气泡上触发删除确认  
- **WHEN** 用户确认删除  
- **THEN** 整个 feed 行(消息与镜像)被移除  
- **AND** localStorage 同步更新, UI 自动滚动到剩余最新内容
