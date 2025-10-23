## ADDED Requirements

### Requirement: Conversation Data Model
应用 MUST 维护结构化的会话数据,对话消息与意图/解析需按方向成对出现,以支撑中栏双列矩阵。

#### Scenario: Partner Message Pairing
- **GIVEN** 会话包含来自对方的消息  
- **THEN** 数据结构中该消息记录 `role = partner`, 保存原文与时间戳  
- **AND** 同一行右侧存在 `type = analysis` 的镜像记录,包括翻译或解析文本(可选高亮信息)  
- **AND** 界面渲染时展示为“实际会话内容”与“对话意图”两列一一对应

#### Scenario: Self Message Pairing
- **GIVEN** 会话包含我方发送的消息  
- **THEN** 数据结构中该消息记录 `role = self`, 保存正文与时间戳  
- **AND** 同一行右侧存在 `type = intent` 的镜像记录,描述回复意图或行动  
- **AND** feed 渲染时序保持与原消息一致,无额外排序漂移

### Requirement: Conversation State Persistence
应用 MUST 将会话列表与当前状态写入浏览器 localStorage 并在刷新后恢复。

#### Scenario: Persist On Update
- **GIVEN** 用户对会话执行置顶、归档、删除或新增消息等操作  
- **WHEN** 状态更新完成  
- **THEN** 本地存储同步更新最新状态  
- **AND** 捕获序列化异常并记录错误而不阻断 UI

#### Scenario: Hydrate On Load
- **GIVEN** 页面重新加载  
- **WHEN** 应用初始化  
- **THEN** 从 localStorage 读取会话数据  
- **AND** 若数据缺失或解析失败,需回退到默认种子会话并继续渲染

### Requirement: Conversation Management Actions
应用 MUST 提供置顶、归档、删除会话的交互,包括顶栏主操作按钮与侧边栏同步刷新。

#### Scenario: Pin And Unpin
- **GIVEN** 用户在侧边栏选择会话项  
- **WHEN** 点击置顶/取消置顶操作  
- **THEN** 会话 `pinnedAt` 状态切换,列表即时重排  
- **AND** 状态持久化至 localStorage

#### Scenario: Archive Toggle From Header
- **GIVEN** 用户正在查看某个会话  
- **WHEN** 点击顶栏右侧的归档按钮  
- **THEN** 会话 `archivedAt` 状态被切换,归档会话折叠至 archived 区域  
- **AND** 如果是取消归档,该会话重新出现在最近列表顶部  
- **AND** 无论归档状态如何,用户仍可打开会话查看完整 feed,但归档列表默认保持折叠

#### Scenario: Delete Conversation
- **GIVEN** 用户正在查看某个会话  
- **WHEN** 点击顶栏右侧的删除按钮  
- **THEN** 系统弹出确认对话框并提示删除不可撤销  
- **AND** 用户确认删除后会话从状态中移除,localStorage 同步更新  
- **AND** 用户取消时,会话保持不变  
- **AND** 应用自动切换到时间最近的未归档会话; 若无可用会话,显示空态
