## MODIFIED Requirements

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

#### Scenario: Create Conversation
- **GIVEN** 用户点击侧边栏的“新建会话”按钮  
- **THEN** 系统创建一个空会话,分配默认标题(如“未命名会话”)并将其设为当前会话  
- **AND** 新会话立即写入 localStorage,界面展示空态消息/意图

#### Scenario: Rename Conversation
- **GIVEN** 用户正在查看某个会话  
- **WHEN** 在主页面顶栏编辑会话标题并确认(键入 Enter 或失焦)  
- **THEN** 标题更新写入状态与 localStorage,侧边栏列表同步显示新标题  
- **AND** 若输入为空,系统回退到默认标题,避免产生空白名称

### Requirement: Conversation List Presentation
侧边栏会话列表 MUST 以精简方式展示,保障用户快速定位目标会话。

#### Scenario: Sidebar Title Only
- **GIVEN** 会话侧边栏展示会话列表  
- **THEN** 每条记录仅显示标题文本  
- **AND** 置顶/归档/搜索等行为不受影响
