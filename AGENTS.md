# AGENTS

项目采用多角色协作模型,各代理的职责如下,引用任务与设计文档以便交接。

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
