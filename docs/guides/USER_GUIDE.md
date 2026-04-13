# PromptForge 使用手册

这是一份面向日常使用者的上手手册，帮助你快速掌握 PromptForge 的 CLI 与 TUI 工作流。

## 1. PromptForge 是什么

PromptForge 用来把“原始想法”加工成更清晰、更适合 AI 执行的提示词。

它提供两种使用方式：

- CLI：适合一次性增强、脚本集成、管道处理
- TUI：适合交互式打磨、查看历史、比对修改、持续迭代

## 2. 适合谁用

- 想把零散想法整理成高质量 prompt 的个人用户
- 需要稳定生成 agent-ready prompt 的开发者
- 需要保存历史版本、反复迭代优化提示词的团队成员

## 3. 安装与准备

### 3.1 环境要求

- Node.js `>=20`
- 一个 OpenAI 兼容服务的 API Key

### 3.2 本地开发安装

```bash
npm install
npm run build
node dist/cli.js --help
```

### 3.3 npm 全局安装

发布后可以直接安装：

```bash
npm install -g promptforge
promptforge --help
```

## 4. 配置文件

PromptForge 会按以下顺序查找配置：

1. `promptforge.config.json`
2. `.promptforgerc`
3. `.promptforgerc.json`
4. `~/.promptforge/config.json`
5. `~/.promptforgerc`
6. `~/.promptforgerc.json`

推荐配置：

```json
{
  "defaultProvider": "openai",
  "defaultLevel": "standard",
  "theme": "dark",
  "autoSave": true,
  "maxHistoryDays": 30,
  "providers": {
    "openai": {
      "baseURL": "https://api.openai.com/v1",
      "defaultModel": "gpt-4o",
      "apiKey": "env:OPENAI_API_KEY"
    }
  }
}
```

### 4.1 推荐做法

- 用 `env:OPENAI_API_KEY` 这种形式引用环境变量
- 不要把真实 API Key 写进 Git 仓库
- 把个人配置保存在 `~/.promptforge/config.json`

### 4.2 常见配置项

- `defaultProvider`：默认使用的 provider
- `defaultModel`：默认模型
- `defaultLevel`：默认增强强度，可选 `light` / `standard` / `deep`
- `autoSave`：是否自动保存历史
- `maxHistoryDays`：历史保留天数

## 5. 最快上手

### 5.1 一次性增强一个提示词

```bash
promptforge "帮我写一个 TypeScript 中的装饰器模式示例"
```

### 5.2 从文件读取

```bash
promptforge --file prompt.txt
```

### 5.3 从标准输入读取

```bash
cat prompt.txt | promptforge
echo "设计一个代码评审助手提示词" | promptforge --level deep
```

### 5.4 进入交互界面

```bash
promptforge -i
```

## 6. CLI 模式详解

### 6.1 基本语法

```bash
promptforge [options] [prompt]
```

### 6.2 常用参数

- `-i, --interactive`：进入交互式 TUI
- `--file PATH`：从文件读取 prompt
- `--provider NAME`：指定 provider
- `--level LEVEL`：增强强度，支持 `light` / `standard` / `deep`
- `--format FORMAT`：输出格式，支持 `md` / `txt` / `json` / `yaml`
- `--output PATH`：把结果写入文件
- `--quiet`：静默模式，不输出进度和成功提示
- `--copy`：将结果复制到剪贴板
- `--help`：显示帮助
- `--version`：显示版本

### 6.3 常见命令示例

轻量增强：

```bash
promptforge --level light "帮我优化这个日报提示词"
```

深度增强：

```bash
promptforge --level deep "Design a coding agent prompt for bug triage"
```

输出到文件：

```bash
promptforge --file prompt.txt --output enhanced.txt
```

输出结构化 JSON：

```bash
promptforge "生成测试计划" --format json
```

输出 YAML：

```bash
promptforge --file prompt.txt --format yaml --output enhanced.yaml
```

静默输出给其他命令继续处理：

```bash
promptforge "生成测试计划" --quiet > result.txt
```

复制到剪贴板：

```bash
promptforge "写一个面试官提示词" --copy
```

## 7. TUI 模式详解

TUI 适合你边看、边改、边比对。

### 7.1 主界面

主界面通常包含：

- 输入区：写原始 prompt
- Inspector：查看当前 provider / model / 状态
- Shortcuts：查看快捷键提示
- 底部状态栏：提示当前模式和可用操作

### 7.2 基本流程

推荐按这个顺序用：

1. 输入原始 prompt
2. 按 `Enter` 开始增强
3. 查看生成结果
4. 按 `d` 查看 diff
5. 按 `f` 输入反馈继续迭代
6. 按 `h` 查看历史版本
7. 按 `x` 导出或按 `c` 复制

## 8. TUI 常用快捷键

### 8.1 全局常用

- `Ctrl+K`：打开或关闭命令面板
- `:`：打开命令面板
- `?`：打开帮助
- `q`：退出

### 8.2 主界面

- `Enter`：提交增强
- `ESC`：切换到命令模式
- `i`：回到输入模式
- `h`：打开历史
- `m`：打开 provider 选择
- `d`：打开 diff
- `f`：进入反馈迭代
- `c`：复制当前结果
- `x`：导出当前结果
- `r`：重置当前会话

### 8.3 历史视图

- `/`：搜索历史
- `↑ / ↓`：移动选中项
- `Enter`：选中并查看
- `g / G`：跳到第一条 / 最后一条
- `ESC`：返回主界面

### 8.4 Provider 视图

- `/`：搜索 provider / model / baseURL
- `↑ / ↓`：切换 provider + model 组合项
- `PgUp / PgDn`：翻页
- `Enter`：选中当前 provider + model
- `ESC`：返回主界面

### 8.5 Diff 视图

- `Tab`：切换 patch / overview 焦点
- `a`：切换对齐模式（center / top）
- `[` 或 `N`：跳到上一个变更块
- `]` 或 `n`：跳到下一个变更块
- 数字 + `Enter`：跳到指定 hunk
- `Backspace`：删除已输入的 hunk 编号
- `↑ / ↓`：滚动 patch 或 overview
- `ESC`：返回主界面

## 9. 命令面板怎么用

命令面板是 TUI 的统一入口。

打开方式：

- `Ctrl+K`
- `:`

你可以在里面：

- 搜索命令
- 直接跳转到 history / diff / provider / help
- 执行复制、导出、切换焦点、切换对齐模式等动作

导出时：

- 按 `x` 会先打开导出格式选择器
- 可选 `md` / `txt` / `json` / `yaml`
- 按 `Enter` 确认导出，按 `ESC` 返回

建议：

- 不记得快捷键时，优先用命令面板
- 在窄终端里，命令面板往往比记快捷键更稳定

## 10. Diff 视图怎么读

Diff 视图用于比较原始 prompt 和增强后的版本。

你会看到：

- `Original`：原始 prompt
- `Enhanced`：增强后的 prompt
- `Hunks`：变更块概览
- `Patch View`：逐行查看变更

建议使用方式：

- 先看 `Hunks`，确认修改范围
- 再看 `Patch View`，理解具体增删内容
- 如果想快速跳转，用 `n` / `N` 或输入 hunk 编号

## 11. Feedback 迭代怎么用

第一次增强后，如果你觉得还不够满意，不用重写 prompt，可以直接反馈。

常见反馈示例：

- “更简洁”
- “保留中文术语”
- “加上输出格式要求”
- “更适合 coding agent 执行”
- “减少背景说明，增加步骤约束”

推荐做法：

- 一次只提一个明确修改目标
- 多轮小步迭代，效果通常比一次写很复杂反馈更好

## 12. 三种增强等级怎么选

### 12.1 `light`

适合：

- 小幅润色
- 修正表达不清
- 不希望 prompt 被大改

### 12.2 `standard`

适合：

- 日常使用
- 大多数任务
- 想要结构更完整但不过度扩展

### 12.3 `deep`

适合：

- 构建 agent prompt
- 复杂任务拆解
- 需要更严格输出格式和约束

经验建议：

- 不确定时先用 `standard`
- 需要“像可执行规格说明”时再用 `deep`

## 13. 推荐工作流

### 13.1 日常 prompt 优化

```bash
promptforge "帮我优化这个写作助手提示词"
```

### 13.2 复杂任务设计

```bash
promptforge --level deep "设计一个多文件代码修复 agent 的系统提示词"
```

### 13.3 文件工作流

```bash
promptforge --file draft.txt --output final.txt
```

### 13.4 交互式迭代工作流

```bash
promptforge -i
```

推荐步骤：

1. 输入原始 prompt
2. 生成结果
3. 查看 diff
4. 提交反馈
5. 对比前后版本
6. 复制或导出最终结果

## 14. 常见问题

### 14.1 提示 “No configuration found”

说明没有找到配置文件。

解决方法：

- 运行 `promptforge -i` 进入交互配置
- 或手动创建 `~/.promptforge/config.json`

### 14.2 提示 “API key not configured”

说明当前 provider 没有可用的 API Key。

解决方法：

- 设置环境变量，例如 `export OPENAI_API_KEY=...`
- 或在配置文件里填 `apiKey`

### 14.3 提示 “Provider '<name>' not configured”

说明你指定的 provider 在配置里不存在。

解决方法：

- 检查 `defaultProvider`
- 检查 `providers` 下是否存在对应名字

### 14.4 提示 “Model not specified”

说明 provider 或全局配置没有给出模型。

解决方法：

- 在 provider 下设置 `defaultModel`
- 或在顶层设置 `defaultModel`

### 14.5 终端太窄，界面看起来拥挤

PromptForge 已做响应式布局，但仍建议：

- 尽量使用 `80+` 列终端
- 复杂操作优先用命令面板 `Ctrl+K`
- 在很窄的终端里优先用 CLI 模式

## 15. 适合新用户的练习方式

如果你第一次使用，可以按下面练习：

1. 先运行：

```bash
promptforge "帮我写一个 TypeScript 中的装饰器模式示例"
```

2. 再进入 TUI：

```bash
promptforge -i
```

3. 试试这几个动作：

- `Ctrl+K` 打开命令面板
- `d` 查看 diff
- `f` 输入反馈
- `h` 查看历史

4. 最后试导出：

```bash
promptforge --file prompt.txt --output result.txt
```

## 16. 总结

如果你只记住三件事：

- 一次性处理用 CLI
- 反复打磨用 TUI
- 不记得快捷键时直接按 `Ctrl+K`

你已经可以比较顺畅地使用 PromptForge 了。
