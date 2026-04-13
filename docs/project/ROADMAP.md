# PromptForge ROADMAP

_Last updated: 2026-04-12_

这份路线图基于两部分信息整理：

- 原始产品愿景与设计稿
- 当前仓库的真实实现状态

目标不是复述理想方案，而是给后续开发、完善与维护提供一份**可执行、可追踪、可验收**的工作基线。

## 1. 当前状态总览

截至 `2026-04-12`，PromptForge 已经具备“项目骨架 + 核心链路跑通”的基础能力，但距离原始设计稿中的完整产品形态还有明显差距。

### 已完成

- CLI 基础链路：支持位置参数、`--file`、stdin、`--provider`、`--level`、`--output`、`--quiet`、`--copy`
- TUI 基础体验：主界面、帮助、History、Provider、Diff、Feedback、Command Palette、首次运行引导
- 响应式布局基础：宽屏 / 中屏 / 窄屏三档布局，已修复主要重叠问题
- Diff 导航：按变更块浏览、上一块 / 下一块、数字跳转、焦点切换、对齐模式切换
- Provider 搜索与 History 搜索
- 本地历史记录持久化
- LLM 流式输出、基础重试、结构化 JSON 解析与 plain-text fallback
- 基础导出服务：`md` / `txt` / `json` / `yaml`
- 基础文档与发布材料：`README.md`、`docs/guides/USER_GUIDE.md`、`docs/guides/VISUAL_GUIDE.md`、`docs/guides/USER_GUIDE_EN.md`、`CHANGELOG.md`、`LICENSE`
- 基础质量门禁：`lint`、`typecheck`、`test`、`build`、`pack:dry`

### 部分完成

- 配置系统：已支持 JSON 与 `env:VAR_NAME`，但还不支持 YAML / TOML，也未真正做到 zero-config 的多 Provider 引导
- 多 Provider：已支持 OpenAI-compatible base URL，TUI 已支持 provider + model 组合选择；Onboarding 仍待扩展
- 评分系统：结果中已有 score 字段，但尚未做成右侧雷达图与评分解释面板
- 导出能力：底层支持多格式，但当前 TUI 导出入口仍固定输出 Markdown
- 历史系统：已有线性历史，但还没有树状分支、Undo、Pin、Tag、项目分组
- 主题能力：配置里已有 `dark/light`，但还没有真正独立的主题系统与自定义配色

### 尚未开始或未闭环

- `--url`
- `--preset`
- `--format`
- `batch`
- `benchmark`
- `doctor`
- 模板系统
- URL 抓取
- word-level diff
- Markdown / 代码块高亮渲染
- 编辑器集成 `e` / `Ctrl+E`
- 自动收敛检测
- Keychain 集成
- Provider fallback
- 离线降级模式
- `--no-color` / `NO_COLOR`
- CI/CD 工作流
- TUI 组件测试 / E2E / 覆盖率 `>= 80%`

## 2. 需求差距矩阵

| 方向 | 原始目标 | 当前状态 | 判断 |
| --- | --- | --- | --- |
| CLI | 一行命令即用 + 管道友好 | 已基本可用 | 基础达标 |
| TUI | Claude Code 风格沉浸体验 | 已有骨架与主流程 | 需继续打磨 |
| Diff | 变更可视化 + 导航 | 已有块级导航 | 还缺词级 diff |
| 评分 | 多维评分 + 雷达图 | 仅有分数字段 | 半成品 |
| Provider | 多 Provider + 模型切换 | TUI 已支持 provider + model 选择，首次引导仍不完整 | 半成品 |
| 配置 | Zero-config + 多格式配置 | JSON 可用，引导较弱 | 半成品 |
| 历史库 | Pin / Tag / 项目分组 / 模板 | 仅有基础历史 | 未完成 |
| 导出 | md/txt/json/xml/yaml | 缺 xml，UI 未暴露完整格式 | 半成品 |
| 稳定性 | fallback / offline / 中断恢复 | 仅有基础重试 | 未完成 |
| 工程化 | CI/CD / 高覆盖率 / 跨平台 | 仅有本地门禁 | 未完成 |

## 3. 路线图原则

后续开发建议始终遵循这四条原则：

1. **真实可用优先于功能清单**：先补齐闭环，再扩展新功能。
2. **安全默认值优先**：API Key、配置保存、导出内容都要避免“默认不安全”。
3. **CLI / TUI 双通路一致**：能在 TUI 做的核心动作，尽量也能在 CLI 做。
4. **文档、测试、发布同步推进**：每个里程碑都要带验收、文档和回归测试。

## 4. 里程碑规划

## R1 · v0.2 产品闭环补齐

**目标**

把“已经能用”补到“主要承诺都能闭环”，优先解决当前实现与原始设计稿之间最影响体验的缺口。

**建议交付**

- CLI 增加 `--format md|txt|json|yaml`
- CLI 增加 `--preset coding|writing|data-analysis|agent|chat`
- TUI 导出支持格式选择，而不是固定导出 `.md`
- Onboarding 扩展到 `openai / claude / kimi / deepseek / ollama / custom`
- 配置保存改为“环境变量优先”，避免引导用户默认明文保存 API Key
- 文档与真实功能对齐，显式标注已实现 / 计划中能力

**验收标准**

- CLI 与 TUI 都能导出至少 `4` 种格式
- 新用户无需手改 JSON，即可完成至少 `4` 种 Provider 的初始配置
- `README.md` 与用户手册不再出现“文档已承诺、功能未实现”的关键错位

## R2 · v0.3 完整 TUI 体验

**目标**

继续向原始设计中的“Claude Code 风格 TUI”靠拢，把现在的骨架升级成真正稳定顺手的交互界面。

**建议交付**

- 顶部 Header 增加版本号与更清晰的 token 指示
- 右侧折叠面板落地：优化说明 / Diff 概览 / 评分展示
- Markdown 渲染与代码块高亮
- 评分雷达图组件
- 编辑器集成：`e` / `Ctrl+E`
- 继续优化：`Tab` 继续深化优化
- Undo：`u` 回退上一版本
- 自动收敛检测与提醒
- `--no-color` 与 `NO_COLOR`
- 终端布局回归测试，确保窄屏下不再出现重叠 / 丢边框

**验收标准**

- 在 `80` 列左右终端中，主流程仍可操作
- Diff / History / Provider / Help 在窄终端无布局重叠
- 用户可以在 TUI 内完成“输入 → 生成 → diff → feedback → 导出”全流程

## R3 · v0.4 历史与提示词库

**目标**

把“单次生成工具”升级为“可积累、可检索、可管理”的提示词工作台。

**建议交付**

- History 支持 Pin / 删除 / Tag / 项目分组
- 历史支持树状分支或至少显式迭代链路
- `promptforge export --all` / `promptforge import`
- 模板系统：`template list/create/apply`
- 自动清理与归档策略
- 原子写入、备份、数据迁移机制

**验收标准**

- 历史记录 `1000+` 条时检索仍可接受
- 导入 / 导出可完成跨机器迁移
- Pin 记录不会被自动清理

## R4 · v0.5 Provider 与韧性建设

**目标**

把“能请求模型”升级为“可持续、可恢复、可排障”的生产级调用层。

**建议交付**

- `doctor` 命令检查配置、API Key、baseURL、模型可用性
- Provider fallback 链与优先级配置
- 首 Token 超时与总超时分离
- 离线降级：无网络时仍可浏览历史、导出、搜索
- Keychain 集成（可选依赖）
- 配置格式扩展到 YAML / TOML
- Ollama 体验补齐
- 友好错误信息与修复建议模板

**验收标准**

- 常见错误都能给出下一步建议，而不是只抛底层异常
- 单一 Provider 故障不会直接让整个交互流程不可用
- 本地离线时，历史与导出功能仍可用

## R5 · v0.6 评分、批处理与对比能力

**目标**

把 PromptForge 从“增强器”继续推进到“评估与比较平台”。

**建议交付**

- Benchmark 模式：多 Provider 并行增强与对比
- `batch` 子命令批量处理目录
- Token 计数与优化前后对比展示
- 评分解释视图，不只是给分
- Benchmark 结果可导出为 JSON / Markdown 报告

**验收标准**

- 同一 prompt 可在一次命令中并行比较多个 Provider
- 批处理结果可稳定输出到目标目录
- Benchmark 输出可直接用于评审或归档

## R6 · v1.0 发布与维护成熟化

**目标**

让项目具备稳定演进、持续发布和社区协作的基础设施。

**建议交付**

- GitHub Actions：CI / Release
- 单元测试、组件测试、TUI 快照测试、E2E
- 覆盖率统计与门禁，目标 `>= 80%`
- 跨平台 smoke tests：macOS / Linux / Windows
- `npx promptforge@latest` 免安装体验
- `npm audit` 与依赖更新策略
- README 增加 GIF / 截图 / 常见工作流

**验收标准**

- 发布流程不依赖人工记忆
- 每次发布前都能自动跑完核心门禁
- 新贡献者能在较短时间内跑起本地开发环境

## 5. 未来方向（v2+）

下面这些方向重要，但不应抢占当前 v1.0 主线资源：

- VS Code 扩展
- MCP Tool 集成
- 插件系统
- 团队共享提示词库
- A/B 真实任务评估
- 云同步

建议把它们明确放在 `v2+ backlog`，不要与当前主线混排。

## 6. 接下来三个迭代建议

如果按“投入产出比”排序，建议最近三个迭代这样安排：

### Iteration A：把闭环补齐

- `--format`
- TUI 多格式导出
- 多 Provider onboarding
- model picker
- env-first API Key 保存策略

### Iteration B：把 TUI 做顺手

- 右侧面板
- 评分雷达图
- Markdown / 代码高亮
- `u` Undo
- `e` / `Ctrl+E`
- `NO_COLOR`

### Iteration C：把数据与韧性补强

- Pin / Tag / 项目分组
- 模板系统
- `doctor`
- fallback
- 原子写入 / 备份 / 迁移

## 7. 维护节奏建议

为了避免项目后续“功能越多越难维护”，建议固定维护节奏：

### 每次合并前

- 跑 `npm run lint`
- 跑 `npm run typecheck`
- 跑 `npm test`
- 对涉及 TUI 的改动做一次人工 smoke test

### 每次发布前

- 跑 `npm run release:check`
- 跑 `npm run pack:dry`
- 检查 `CHANGELOG.md`
- 检查 README / 手册是否与当前功能一致
- 检查是否误提交本地配置或密钥

### 每月一次

- 更新依赖并回归关键流程
- 审查历史数据格式兼容性
- 审查文档中是否存在“已废弃功能”或“未实现承诺”
- 评估是否需要提升最低 Node.js 与 SDK 版本

## 8. 维护中的红线

后续开发中，建议把以下事项视为红线：

- 不默认把 API Key 明文写入仓库内配置
- 不在 README 中承诺尚未实现的关键能力
- 不为新功能补文档却不补测试
- 不为了追功能清单而破坏 CLI 主链路和 TUI 主流程

## 9. 一句话结论

PromptForge 当前已经完成了 **M1 + 部分 M2 / M4** 的工作量：基础骨架、核心链路、TUI 主流程、Diff 导航、Provider 搜索、基础发布准备都已具备。

接下来的主线，不是“继续堆功能”，而是按下面顺序推进：

**先补闭环，再做沉浸体验，再补数据管理与韧性，最后做自动化发布与生态扩展。**
