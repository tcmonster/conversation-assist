# Conversation Assist

面向跨语种沟通场景的本地化 AI 助手,帮助用户快速理解外语消息并生成符合语境的回复。项目基于 Next.js + shadcn/ui 构建,强调数据自主管理与提示词工程能力。详情见 @docs/requirement.md。

## 核心能力

- 三栏协同界面: 会话列表、左右双栏消息对齐、AI 控制面板。  
- 翻译与解析: 支持直译/意译/要点提取,手动触发与模式切换。  
- 回复生成: 结合提示词标签、语料快捷方案与上下文历史,输出对方语言草稿。  
- 本地存储: 所有数据保存在浏览器,支持全量导出/导入备份。  
- 提示词工程: 模块化 prompt 目录、JSON 组合预览、标签化管理。  
- 快捷操作: 键盘快捷键、Toast/Tooltip 反馈、差异比对。  
- 完整文档: 产品设计(@docs/product_design.md)、技术设计(@docs/technical_design.md)、任务拆分(@docs/task_plan.md)、角色分工(AGENTS.md)。

## 快速开始

```bash
pnpm install
pnpm dev
```

- 默认开发服务运行于 `http://localhost:3000`。  
- 首次运行请按 @docs/task_plan.md#阶段-1-基础设施与框架 完成依赖与状态骨架确认。  
- 需要在设置面板录入 LLM API Key 后方可进行翻译/生成。

## 项目结构概览

```
docs/
  requirement.md      # 需求基线
  product_design.md   # 产品设计文档
  technical_design.md # 技术设计文档
  task_plan.md        # 任务拆分
AGENTS.md             # 代理角色说明
src/                  # 应用源码
```

详细模块说明请参阅 @docs/technical_design.md#模块划分。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动本地开发环境 |
| `pnpm lint` | 运行静态检查 |
| `pnpm test` | 执行测试(需按 @docs/technical_design.md#测试策略 配置) |
| `pnpm build` | 构建生产版本 |

## 协作指南

- 根据 @docs/task_plan.md 的阶段划分安排工作,并在 AGENTS.md 中找到对应职责。  
- 新增/调整需求请优先更新 @docs/product_design.md 与 @docs/technical_design.md,保持文档与实现同步。  
- 版本发布流程与检查项见 @docs/technical_design.md#部署与发布流程。  
- 讨论未决事项(如增量导出、标签高级管理)请记录于需求文档 `## 待确认` 区域。

## 支持与反馈

- 遇到问题: 首先查阅文档,并在仓库 Issue 中附带复现步骤与日志。  
- 提交贡献: 请遵循常规 Git Flow,确保 lint/test 通过,同步更新相关文档与 CHANGELOG。
