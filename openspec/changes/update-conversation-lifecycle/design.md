# Design Notes

## Provider Changes
- 在 reducer 中新增 `create` 与 `rename` 事件; `create` 生成 uuid/自增 id、设定默认标题并选中; `rename` 更新标题和 `updatedAt`.
- 初始化流程读取 localStorage,若数据缺失则返回空状态; 若检测到旧结构中的 mock 标记(例如包含 known seed ids),则忽略这些 seed 或转为空。
- 提供简单的标题计数器存储于 state(或通过 helper 根据现有会话数量生成)。

## UI Interaction
- Sidebar “新建会话”按钮触发 `createConversation`, 成功后关闭搜索并滚动到新项(无需动画)。
- 列表项仅展示标题,移除更新时间,保持置顶/归档/搜索逻辑。
- 顶栏标题使用可编辑组件: 初始显示文本,点击后变为自适应输入框,按 Enter/Blur 提交,空字符串回退默认名称。

## Persistence
- 所有新动作复用 `createStorageSlot`, 调用后立即写入 localStorage。
- 旧数据迁移通过 normalize 阶段完成,确保未命名字段补齐、旧 mock 过滤。
