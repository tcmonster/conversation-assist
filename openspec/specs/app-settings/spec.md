# app-settings Specification

## Purpose
TBD - created by archiving change add-global-settings-dialog. Update Purpose after archive.
## Requirements
### Requirement: Global Settings Dialog
应用 MUST 提供基于弹窗的全局设置界面,遵循左侧菜单与右侧表单布局,让用户从任意页面快速调整关键配置。

#### Scenario: Open From Sidebar
- **GIVEN** 用户位于主界面  
- **WHEN** 点击侧边栏的“全局设置”按钮  
- **THEN** 弹出覆盖当前页面的 shadcn Dialog  
- **AND** 左侧展示“模型 API”“参考信息”“引用文本”菜单项,右侧显示对应表单内容  
- **AND** 右上角显示可点击的关闭图标按钮,底部固定显示“保存当前设置”主按钮  
- **AND** 关闭弹窗后返回原界面且不改变滚动位置

#### Scenario: Switch Sections
- **GIVEN** 设置弹窗已经打开  
- **WHEN** 用户点击任一菜单项  
- **THEN** 右侧区域更新为所选分区表单  
- **AND** 其他分区的未保存表单值不会被清空

#### Scenario: Footer Save Action
- **GIVEN** 设置弹窗保持打开  
- **WHEN** 用户在任一分区编辑内容并点击底部的“保存当前设置”按钮  
- **THEN** 当前分区的修改立即保存  
- **AND** 按钮保持固定位置,滚动内容区域时仍然可见

#### Scenario: Save Feedback
- **GIVEN** 用户在任一分区点击“保存当前设置”  
- **WHEN** 保存流程完成  
- **THEN** 系统以 toast 提示“设置已保存”  
- **AND** 当前分区保持不变,不自动跳转到其他菜单  
- **AND** 若保存失败(例如数据尚未加载),需显示错误 toast 并阻止状态更新

### Requirement: Model Provider Configuration
设置弹窗 MUST 允许用户维护模型调用所需的 provider 配置,并区分翻译与生成模型。

#### Scenario: Edit Provider Fields
- **GIVEN** 设置弹窗处于“模型 API”分区  
- **WHEN** 用户在表单中填写或修改 Base URL、API Key、默认翻译模型与回复模型  
- **THEN** 点击保存后数据写入本地存储  
- **AND** 重新打开弹窗时应看到最新保存值

### Requirement: Context Libraries
设置弹窗 MUST 提供基于 shadcn Table 的参考信息与引用文本列表,并通过专用弹窗完成新增与编辑。

#### Scenario: View Context Entries
- **GIVEN** 用户打开“参考信息”或“引用文本”分区  
- **THEN** 列表以 shadcn Table 呈现,显示标签(Info/Quote)、标题与内容摘要  
- **AND** 内容摘要展示部分文本(截取并追加省略号),保留原始正文供详情使用

#### Scenario: Create Context Entry
- **GIVEN** 用户位于“参考信息”或“引用文本”分区  
- **WHEN** 点击“新增”按钮  
- **THEN** 弹出新的编辑弹窗,可填写标题与正文内容  
- **AND** 点击保存后条目写入当前分区的草稿数据并立即显示在列表中

#### Scenario: Edit Context Entry
- **GIVEN** 列表中存在已保存的条目  
- **WHEN** 用户点击“编辑”操作  
- **THEN** 弹出的编辑弹窗需预填已有内容,允许修改  
- **AND** 保存后更新原有条目并写入草稿数据,点击底部“保存当前设置”后同步到 localStorage,关闭/返回则保持原值不变

#### Scenario: Remove Context Entry
- **GIVEN** 列表中存在已保存的条目  
- **WHEN** 用户点击“删除”操作  
- **THEN** 系统弹出确认框并提示操作不可撤销  
- **AND** 用户确认后条目立即从列表移除,点击底部“保存当前设置”后应从 localStorage 中同步删除  
- **AND** 若用户取消确认,条目保持不变

### Requirement: Local Persistence
所有设置更改 MUST 立刻同步至浏览器 localStorage,并在读取失败时安全回退至默认值。

#### Scenario: Persist On Change
- **GIVEN** 任意分区的表单值发生修改  
- **WHEN** 用户保存更改  
- **THEN** 状态写入 localStorage  
- **AND** 后续渲染从 localStorage 读取最新数据,加载失败时使用默认配置并提示用户(通过日志或 UI 提示)

