# conversation-management Specification

## Purpose
TBD - created by archiving change add-conversation-management. Update Purpose after archive.
## Requirements
### Requirement: Conversation Data Model
应用 MUST 维护结构化的会话数据,对话消息与意图/解析需按方向成对出现,以支撑中栏双列矩阵。

#### Scenario: Render When Mirror Missing
- **GIVEN** 某条消息缺少对应的镜像数据  
- **THEN** UI 左/右列只渲染实际存在的气泡  
- **AND** 未提供的数据列保持留白, 不显示占位占用视觉空间  
- **AND** 数据结构允许 `mirror` 为空并持久化保存

### Requirement: Conversation State Persistence
应用 MUST 将会话列表与当前状态写入浏览器 localStorage 并在刷新后恢复。

#### Scenario: Hydrate On Load
- **GIVEN** 页面重新加载  
- **WHEN** 应用初始化  
- **THEN** 从 localStorage 读取会话数据  
- **AND** 若数据缺失或解析失败,需回退到默认空状态(不再注入演示用 mock)  
- **AND** 迁移旧版本残留的演示会话时,需按需过滤或重命名以保持一致性

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

### Requirement: Conversation List Presentation
侧边栏会话列表 MUST 以精简方式展示,保障用户快速定位目标会话。

#### Scenario: Sidebar Title Only
- **GIVEN** 会话侧边栏展示会话列表  
- **THEN** 每条记录仅显示标题文本  
- **AND** 置顶/归档/搜索等行为不受影响

