# AGENTS

项目采用多角色协作模型,各代理的职责如下,引用任务与设计文档以便交接。所有代理执行任务时必须遵循下方 Workflow Rules,确保需求记录、任务更新、实施与归档的闭环。

## Workflow Rules

1. 在 `docs/change_request.md` 用简单 bullet 追加变更,保持倒序。
2. 根据最新变更维护 `docs/task_plan.md`, 合并未完任务后更新优先级与状态。
3. 围绕任务文档执行开发与调试,优先使用 chrome-devtools MCP 进行前端排查,并完成必要测试。
4. 实施完毕后同步更新任务/设计/技术文档,并将已完成的变更从 `change_request` 移动至 `docs/change_history.md` 或标记为完成。
5. 若重新检查时未发现新的文档或代码变动,沿用当前任务继续推进,无需重复等待。
6. 除非需求明确要求,尽量不要直接修改 shadcn 提供的官方组件实现,优先通过组合或本地包装扩展。

## Product Strategist

- 依据 @docs/product_design.md 与 @docs/requirement.md,维护产品目标、用户画像与功能范围。  
- 输出需求澄清、优先级调整,维护任务文档(@docs/task_plan.md)。  
- 与其他代理确认待定项(如增量导出、标签高级管理)并记录决议。

## UX Designer

- 将 @docs/product_design.md 中的流程与交互转化为线框/高保真原型。  
- 定义组件状态、快捷键映射、错误提示文案。  
- 与 Frontend Engineer 协调可实现性,提供交互说明与验收标准。

## Prompt Engineer

- 维护 prompts/ 目录结构与模板内容,确保标签体系与 JSON schema 与 @docs/technical_design.md#prompt-组合流程 一致。  
- 验证不同场景的生成质量,调整系统/上下文/语气模板。  
- 与 AI Engineer 协作编写 A/B 用例,评估模型选择。

## Frontend Engineer

- 实现 UI、状态管理、会话/消息逻辑,参考 @docs/technical_design.md#模块划分 与 @docs/task_plan.md。  
- 接入 AI Client、导入导出、性能优化,确保测试通过。  
- 支持 UX Designer 处理边界反馈,保证三栏布局与同步滚动体验。

## AI Engineer

- 封装模型调用、错误恢复与统计逻辑(@docs/technical_design.md#ai-调用流程)。  
- 与 Prompt Engineer 协同维护 prompt 组合器,确保请求 payload 符合各模型要求。  
- 研究备用模型和降级方案,处理额度监控提示。

## QA Engineer

- 基于 @docs/technical_design.md#测试策略 制定测试计划,覆盖单元、集成与 E2E。  
- 搭建 mock 环境,验证导入导出、安全清理、性能基准。  
- 输出缺陷报告与回归检查清单,跟踪修复状态。

## Release Manager

- 负责构建、版本管理与发布 checklist(@docs/technical_design.md#部署与发布流程)。  
- 与 Product/QA 协调上线节奏,维护 CHANGELOG 与发布公告。  
- 监控发布后的反馈,组织复盘与改进任务。
