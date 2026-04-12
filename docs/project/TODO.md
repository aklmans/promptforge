# PromptForge TODO

_Based on `ROADMAP.md` · Focus milestone: `R1 / v0.2`_

这份清单用于把路线图拆成**可开工、可提 issue、可分 PR** 的执行项。

## 使用方式

- 每个 `PF-xxx` 建议对应一个 issue
- 每个 issue 尽量对应一个独立 PR
- 每个 PR 都要同时补：实现、测试、文档
- 未完成的能力不要先写进 README 的“已支持”描述

## 当前优先级

| ID | 优先级 | 事项 | 依赖 | 建议状态 |
| --- | --- | --- | --- | --- |
| PF-001 | P0 | CLI 支持 `--format` | 无 | 下一步 |
| PF-002 | P0 | TUI 导出格式选择 | PF-001 | 下一步 |
| PF-003 | P0 | Provider + Model 选择器补齐 | 无 | 下一步 |
| PF-004 | P0 | Onboarding 多 Provider + env-first | PF-003 | 下一步 |
| PF-005 | P1 | `--preset` 与领域增强策略 | 无 | 紧随其后 |
| PF-006 | P1 | 文档与真实功能对齐 | PF-001 ~ PF-005 | 紧随其后 |
| PF-007 | P1 | R1 回归测试补齐 | PF-001 ~ PF-005 | 紧随其后 |

## 推荐开发顺序

1. 先做 `PF-001`，补齐 CLI 导出闭环
2. 再做 `PF-002`，让 TUI 与 CLI 能力一致
3. 接着做 `PF-003`，让 Provider 切换真正完整
4. 然后做 `PF-004`，补齐新用户首次使用体验
5. 再做 `PF-005`，落地预设系统
6. 最后做 `PF-006` 和 `PF-007`，收口文档与回归

## PF-001 · CLI 支持 `--format`

**目标**

让 CLI 非交互模式能够选择输出格式，而不是只隐式输出增强后的纯文本。

**当前现状**

- `src/cli.tsx` 还没有 `--format`
- `src/services/exporter.ts` 已支持 `md` / `txt` / `json` / `yaml`
- CLI 当前的 `--output` 只是把增强文本原样写入文件

**建议范围**

- `src/cli.tsx`
- `src/types.ts`
- `src/services/exporter.ts`
- `tests/unit/`

**任务清单**

- 增加 `--format md|txt|json|yaml`
- 明确 `--quiet` 与 `--format` 的组合行为
- 当 `--output` 存在时，按格式写文件
- 当 `--output` 不存在时，按格式输出到 stdout
- 对非法格式给出友好错误信息

**完成标准**

- `promptforge "..." --format json`
- `promptforge "..." --format yaml --output result.yaml`
- `cat prompt.txt | promptforge --format md`

以上命令都能稳定工作。

**测试建议**

- 参数解析测试
- 格式分支测试
- stdout / output 文件行为测试

## PF-002 · TUI 导出格式选择

**目标**

让 TUI 的导出能力与 CLI 保持一致，不再固定导出 `.md`。

**当前现状**

- `src/services/exporter.ts` 有多格式能力
- `src/app.tsx` 的 `handleExportCurrent` 固定导出 Markdown

**建议范围**

- `src/app.tsx`
- `src/components/CommandPalette.tsx`
- 可能新增一个轻量导出选择组件

**任务清单**

- 在 TUI 中增加导出格式选择
- 保持快捷键 `x`
- 命令面板增加“按格式导出”动作
- 导出成功后提示真实路径与格式

**完成标准**

- 用户在 TUI 内可导出 `md` / `txt` / `json` / `yaml`
- 默认导出路径与扩展名正确
- 失败提示可读，不暴露底层堆栈

**测试建议**

- 导出路径生成测试
- 导出格式映射测试
- 命令面板动作测试

## PF-003 · Provider + Model 选择器补齐

**目标**

把当前“只切 provider”的能力补成“可切 provider，也可切 model”。

**当前现状**

- `src/components/ProviderPicker.tsx` 只展示 provider 列表
- `src/config.ts` 已支持 `models`
- `src/app.tsx` 切换时仅更新 `defaultProvider` / 推导 `defaultModel`

**建议范围**

- `src/components/ProviderPicker.tsx`
- `src/app.tsx`
- `src/config.ts`
- `src/types.ts`

**任务清单**

- Provider 视图显示 provider 与其可选 model
- 没有显式模型列表时，至少展示当前默认模型
- 选择后同时更新 `defaultProvider` 和 `defaultModel`
- 搜索要支持 provider 名、model 名、baseURL

**完成标准**

- 用户可在 TUI 中切换到指定 provider + model
- Header 与 Inspector 正确显示当前 model
- 重新启动后选择结果仍生效

**测试建议**

- 配置解析测试
- 选择行为测试
- 搜索命中 model 测试

## PF-004 · Onboarding 多 Provider + env-first

**目标**

让首次运行真正接近“zero-config first”，并默认采用更安全的 API Key 使用方式。

**当前现状**

- `src/components/OnboardingWizard.tsx` 只支持两个 OpenAI 选项
- 当前默认直接把 API Key 存入配置文件

**建议范围**

- `src/components/OnboardingWizard.tsx`
- `src/config.ts`
- `README.md`
- `docs/guides/USER_GUIDE.md`
- `docs/guides/USER_GUIDE_EN.md`

**任务清单**

- 扩展 provider 选项：`openai`、`claude`、`kimi`、`deepseek`、`ollama`、`custom`
- 为常见 provider 预填 baseURL 与推荐模型
- 引导优先使用 `env:VAR_NAME`
- 对 `ollama` 提供无需真实 API Key 的特例路径
- 配置保存前增加结果确认页

**完成标准**

- 新用户首次启动即可完成常见 provider 配置
- 默认文案不鼓励明文保存 Key
- Onboarding 结束后可立即发起一次增强请求

**测试建议**

- 不同 provider 的配置生成测试
- `env:VAR_NAME` 保存测试
- `ollama` 配置特殊分支测试

## PF-005 · `--preset` 与领域增强策略

**目标**

让增强引擎支持领域预设，贴近原始产品设计。

**当前现状**

- 只有 `light / standard / deep`
- 还没有 `coding / writing / data-analysis / agent / chat`

**建议范围**

- `src/cli.tsx`
- `src/types.ts`
- `src/prompts/system.ts`
- `src/app.tsx`
- `tests/unit/`

**任务清单**

- 增加 `--preset`
- 在 system prompt 中注入领域策略
- TUI Inspector 展示当前 preset
- 无 preset 时维持现有默认行为

**完成标准**

- CLI 支持 `--preset coding`
- 不同 preset 会体现在生成结果的结构或 changes 中
- 文档中能给出清晰示例

**测试建议**

- 参数解析测试
- prompt 组装测试
- preset 回退默认值测试

## PF-006 · 文档与真实功能对齐

**目标**

确保文档对外表达和当前实现一致，不制造错误预期。

**当前现状**

- 已经有较完整的 README 与用户手册
- 但后续若 R1 能力落地，需要同步修正文档示例和边界说明

**建议范围**

- `README.md`
- `docs/project/ROADMAP.md`
- `docs/guides/USER_GUIDE.md`
- `docs/guides/USER_GUIDE_EN.md`
- `docs/guides/VISUAL_GUIDE.md`

**任务清单**

- 更新命令示例
- 更新 TUI 导出说明
- 更新 onboarding 文案
- 标明 preset 与 provider/model 选择能力
- 增加 R1 版本的推荐工作流

**完成标准**

- README、中文手册、英文手册三者不互相矛盾
- 手册中的示例命令在当前版本可跑通

## PF-007 · R1 回归测试补齐

**目标**

为 R1 新增能力建立最小可信回归网，避免后续继续补功能时回退。

**建议范围**

- `tests/unit/`

**任务清单**

- `--format` 参数与行为测试
- provider/model 切换测试
- onboarding 配置生成测试
- preset prompt 组装测试
- 导出格式测试

**完成标准**

- R1 新增功能至少都有对应单元测试
- `npm run release:check` 可稳定通过

## 本阶段先不做

这些能力重要，但建议不要挤进 `R1`：

- `batch`
- `benchmark`
- `doctor`
- 模板系统
- word-level diff
- 评分雷达图
- Keychain 集成
- fallback 链
- YAML / TOML 配置
- CI/CD

## 每个 R1 PR 的最低要求

- 实现只解决本 issue 范围，不顺手扩大需求
- 补测试
- 补文档
- 跑一次：
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`

## 建议 issue 标题

- `PF-001 feat(cli): add --format output modes`
- `PF-002 feat(tui): support export format picker`
- `PF-003 feat(provider): support provider and model selection`
- `PF-004 feat(onboarding): add multi-provider env-first setup`
- `PF-005 feat(prompt): add preset-based enhancement strategies`
- `PF-006 docs: align manuals with implemented R1 features`
- `PF-007 test: add regression coverage for R1 milestone`
