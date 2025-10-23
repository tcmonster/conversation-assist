# Design Notes

## State Architecture
- 新增 `ConversationProvider` 使用 `useReducer` 管理状态,暴露 `conversations`, `activeConversationId`, `actions`.
- 状态划分:
  - `conversations`: Map by id, 每个会话含 `meta`(标题、时间戳、置顶/归档标记)、`feed`(rows)。
  - `order`: Array 决定侧边栏显示顺序,根据 `pinnedAt` 与 `updatedAt` 排序。
  - `activeConversationId`: 当前展示会话 id。
- Reducer 内统一处理 `PIN`, `ARCHIVE`, `DELETE`, `RESTORE` 等事件,并在每次状态更新后持久化。

## Data Model
- `ConversationFeedRow`: 
  - `message`: `role` (`partner`|`self`), `content`, `timestamp`.
  - `mirror`: `type` (`analysis`|`intent`), `content`, `highlights?`.
  - 行内要求同方向配对: partner 消息 ⇄ analysis; self 消息 ⇄ intent。
- 支持可选空列,保障 UI 占位一致。
- 默认种子数据匹配当前静态样例,便于过渡。

## Persistence
- 引入统一的 storage helper (包裹 `window.localStorage`),现有设置存储迁移至该 helper,会话模块共享同一抽象。
- 使用 `localStorage` key `conversation-assist.conversations.v1`.
- 提供 `safeParse` 和 `persist` 工具,捕获 JSON 异常并落回默认数据。
- `useEffect` 初次加载时从存储恢复,期间暴露 `isHydrated` 避免闪烁。

## UI 集成
- Sidebar 通过 context 提供的派发器处理置顶/归档、搜索过滤; Archived 区对标现有折叠交互。
- 主页面顶栏新增 `Archive` 与 `Trash` 按钮:
  - Archive: toggle 当前会话 `archivedAt`.
  - Delete: 弹出确认 Dialog,确认后从 state 移除并切换到剩余最近会话或空态。
- Feed 使用 `SectionRow` 读取 provider 的 `activeConversation.feed` 渲染,并在空态时展示占位组件。
