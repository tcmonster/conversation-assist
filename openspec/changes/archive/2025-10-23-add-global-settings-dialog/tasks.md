## 1. 全局设置弹窗
- [x] 1.1 引入 shadcn Dialog 组件并创建 `SettingsDialog` 结构(左侧菜单 + 右侧表单)  
- [x] 1.2 将 AppSidebar 的“全局设置”按钮接入弹窗开关,确保任意页面可访问

## 2. 设置状态与本地存储
- [x] 2.1 定义 Settings 数据模型(模型配置、参考信息、引用文本)与初始值  
- [x] 2.2 实现带 localStorage 持久化的 hook/store,包含读取、写入与错误兜底  
- [x] 2.3 将设置表单与状态连接,支持更新与新增/删除表格行

## 3. 验证
- [x] 3.1 自测 UI 交互(新增/删除条目、保存、关闭重开)  
- [x] 3.2 运行 `openspec validate add-global-settings-dialog --strict`

## 4. UI 优化补充
- [x] 4.1 将顶部关闭按钮替换为右上角图标,底栏仅保留“保存当前设置”主操作  
- [x] 4.2 调整保存逻辑,使底部按钮根据上下文分区写入对应设置,并移除模型 Provider 名称字段

## 5. 表格与上下文编辑
- [x] 5.1 引入官方 shadcn Table 组件展示参考信息与引用文本列表  
- [x] 5.2 为参考信息/引用文本实现统一的新增/编辑弹窗,支持保存与取消  
- [x] 5.3 在列表中展示 Info/Quote 标签、标题与内容摘要,并接入删除操作

## 6. 架构与确认交互
- [x] 6.1 梳理 settings 相关文件的目录结构,保持组件/Provider 各司其职  
- [x] 6.2 清理 SettingsProvider 解析遗留 `providerName` 字段的类型告警  
- [x] 6.3 删除操作增加二次确认,与底部保存流程保持一致

## 7. 保存体验优化
- [x] 7.1 保存成功/失败以 toast 提示,并保持当前分区不变  
- [x] 7.2 将 settings 组件回归 `src/components/settings`, provider 放在 `src/providers` 以匹配项目结构
