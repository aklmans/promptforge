# PromptForge 视觉化使用手册

这是一份偏“截图式”的界面导览。仓库里不直接存放图片，因此本手册使用 ASCII 线框图来帮助你快速理解 TUI 的布局、视图切换和推荐操作路径。

## 1. 一眼看懂 PromptForge

PromptForge 有两种典型用法：

- CLI：一句命令，直接得到增强后的 prompt
- TUI：全屏交互式打磨，适合反复修改、看 diff、切换 provider、做多轮反馈

如果你第一次接触这个工具，建议先运行：

```bash
promptforge "帮我写一个 TypeScript 中的装饰器模式示例"
```

再进入 TUI：

```bash
promptforge -i
```

## 2. 主界面长什么样

宽终端下，主界面大致会像这样：

```text
┌ PromptForge ────────────────────────────────────────────────────────────────┐
│ Input                                                                      │
│ 帮我写一个 TypeScript 中的装饰器模式示例                                   │
│                                                                             │
│                                                                             │
├───────────────────────────────────────────┬─────────────────────────────────┤
│ Inspector                                 │ Shortcuts                       │
│ Provider  openai                          │ Enter   Enhance                 │
│ Model     gpt-4o                          │ Ctrl+K  Palette                 │
│ Level     standard                        │ d       Diff                    │
│ Status    Ready                           │ f       Feedback                │
│ History   Enabled                         │ h       History                 │
└───────────────────────────────────────────┴─────────────────────────────────┘
 Status: input mode · Press Enter to enhance
```

你可以这样理解：

- 上半区：输入原始 prompt
- 左下区：Inspector，显示当前运行上下文
- 右下区：快捷键提示
- 最底部：状态栏，显示当前模式与操作提示

## 3. 窄终端时会怎么变化

在较窄的终端里，面板会改成纵向堆叠布局，避免互相覆盖：

```text
┌ PromptForge ─────────────────────────────┐
│ Input                                    │
│ 帮我优化一个代码评审提示词               │
│                                          │
├──────────────────────────────────────────┤
│ Inspector                                │
│ Provider  openai                         │
│ Model     gpt-4o                         │
│ Level     deep                           │
├──────────────────────────────────────────┤
│ Shortcuts                                │
│ Enter Enhance · Ctrl+K Palette · d Diff  │
└──────────────────────────────────────────┘
 Status: input mode
```

如果终端特别窄：

- 优先使用 `Ctrl+K` 打开命令面板
- 不记快捷键时，用命令搜索代替记忆
- 很窄的终端里可优先使用 CLI

## 4. 一次完整操作怎么走

推荐你第一次按下面路线操作：

### 第一步：输入原始 prompt

```text
[Input]
设计一个用于代码审查的 AI 助手提示词
```

### 第二步：按 `Enter`

提交后会进入生成状态，界面通常会看到：

```text
Status: enhancing...
Provider: openai / gpt-4o
```

### 第三步：查看增强结果

成功后，结果区会展示增强后的 prompt，你可以继续：

- 按 `c` 复制
- 按 `x` 导出
- 按 `d` 查看 diff
- 按 `f` 继续反馈迭代

## 5. 命令面板长什么样

按 `Ctrl+K` 或 `:` 打开命令面板：

```text
┌ Command Palette ─────────────────────────┐
│ > diff                                   │
│                                           │
│ Diff View                                │
│ Open History                             │
│ Switch Provider                          │
│ Submit Feedback                          │
│ Copy Result                              │
└──────────────────────────────────────────┘
```

适合这些场景：

- 想不起快捷键
- 终端较窄，不想频繁切视图
- 想用搜索快速定位动作

建议把命令面板当成“总入口”。

## 6. Provider 搜索与切换

按 `m` 打开 provider 视图后，你可以搜索和切换 provider / model：

```text
┌ Provider / Model ────────────────────────┐
│ / open                                   │
│                                           │
│ > openai   gpt-4o                        │
│   openai   gpt-4.1                       │
│   local    qwen-coder                    │
│   azure    gpt-4o-mini                   │
└──────────────────────────────────────────┘
```

典型操作：

- `/`：开始搜索
- `↑ / ↓`：移动选项
- `PgUp / PgDn`：翻页
- `Enter`：确认切换

## 7. Diff 视图怎么读

按 `d` 进入 diff 后，通常会看到两个关注点：

```text
┌ Hunks ───────────────┬ Patch View ─────────────────────────────────────────┐
│ > #1 Title refined   │ - 帮我写一个示例                                   │
│   #2 Added constraints│ + 帮我写一个 TypeScript 装饰器模式示例             │
│   #3 Output format   │ + 要包含角色说明、核心代码、运行说明               │
│                      │ + 输出为“说明 + 代码 + 总结”结构                    │
└──────────────────────┴─────────────────────────────────────────────────────┘
 Focus: hunks · n next · N previous · number+Enter jump
```

最常用的方式：

- 先看左边 `Hunks`
- 再看右边 `Patch View`
- 用 `n` / `N` 或 `[` / `]` 在变更块间跳转
- 输入数字后按 `Enter`，直接跳到指定 hunk

## 8. 按变更块跳转怎么用

如果一次增强改动较多，建议直接按 hunk 浏览：

```text
Input: 3
Action: Enter
Result: Jump to hunk #3
```

适合：

- 想快速定位某个大改动
- 只关注结构变化，不逐行阅读
- 多轮反馈后对比某一处调整

## 9. Feedback 迭代是什么体验

按 `f` 后，你可以输入“追加要求”，而不是重写整个 prompt：

```text
┌ Feedback ────────────────────────────────┐
│ > 更适合 coding agent 执行，并加上输出约束 │
└──────────────────────────────────────────┘
```

好的反馈通常有这些特点：

- 一次只改一个方向
- 目标明确
- 尽量可执行

例如：

- “更简洁”
- “保留中文术语”
- “增加输出格式要求”
- “加上边界条件和失败处理”

## 10. 历史视图怎么用

按 `h` 打开历史：

```text
┌ History ─────────────────────────────────┐
│ / decorator                              │
│                                           │
│ > 2026-04-12 17:20  TypeScript decorator │
│   2026-04-12 17:18  Code review agent    │
│   2026-04-12 17:11  Interview prompt     │
└──────────────────────────────────────────┘
```

常见用法：

- `/` 搜索历史关键词
- `Enter` 打开旧结果
- `g / G` 跳第一条或最后一条

## 11. 一页记住快捷键

### 全局

- `Ctrl+K`：打开命令面板
- `:`：打开命令面板
- `?`：打开帮助
- `q`：退出

### 主界面

- `Enter`：开始增强
- `i`：进入输入模式
- `ESC`：回到命令模式
- `m`：打开 provider 选择
- `d`：打开 diff
- `f`：输入反馈
- `h`：查看历史
- `c`：复制结果
- `x`：导出结果

### Diff

- `Tab`：切换焦点
- `n` / `]`：下一块
- `N` / `[`：上一块
- 数字 + `Enter`：跳到指定 hunk
- `a`：切换对齐模式

## 12. 推荐学习路径

如果你要教别人上手，可以按这个节奏：

1. 先用 CLI 跑一次最简单命令
2. 再进 TUI 输入一个简单 prompt
3. 让读者按 `Ctrl+K` 打开命令面板
4. 再让读者按 `d` 看 diff
5. 接着按 `f` 做一次反馈迭代
6. 最后按 `x` 导出结果

## 13. 适合放进演示视频的路径

如果你后面要录屏或写图文教程，建议按下面顺序展示：

1. `promptforge "..."` 的 CLI 成功案例
2. `promptforge -i` 进入 TUI
3. 输入 prompt 并生成
4. 打开 palette
5. 搜索 provider
6. 打开 diff 并按 hunk 跳转
7. 提交 feedback
8. 导出结果

## 14. 总结

如果你只记住四个动作，已经能顺畅使用大部分功能：

- `Enter` 生成
- `Ctrl+K` 找命令
- `d` 看 diff
- `f` 做反馈迭代
