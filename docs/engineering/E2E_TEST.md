# PromptForge 端到端集成测试指南

## 准备工作

### 1. 获取 OpenAI API 密钥
- 访问 https://platform.openai.com/api-keys
- 创建或复制现有的 API 密钥
- 保存为环境变量或配置文件

### 2. 配置 PromptForge

**方式 A：使用环境变量**
```bash
export OPENAI_API_KEY="sk-your-key-here"
node dist/cli.js -i
```
然后在 TUI 中选择 provider 并输入 API 密钥。

**方式 B：创建配置文件**
```bash
mkdir -p ~/.promptforge
cat > ~/.promptforge/config.json << 'EOF'
{
  "defaultProvider": "openai",
  "defaultLevel": "standard",
  "theme": "dark",
  "autoSave": true,
  "maxHistoryDays": 30,
  "providers": {
    "openai": {
      "baseURL": "https://api.openai.com/v1",
      "model": "gpt-4o",
      "apiKey": "sk-your-key-here"
    }
  }
}
EOF
```

## 测试场景

### 测试 1：CLI 模式基本流程
```bash
node dist/cli.js "帮我写一个 TypeScript 中的装饰器模式示例"
```

**预期结果：**
- ✅ 输出增强后的提示词正文
- ✅ 进度提示显示当前 Provider / Model
- ✅ 命令正常结束，无报错

如需结构化输出，请显式使用：

```bash
node dist/cli.js "帮我写一个 TypeScript 中的装饰器模式示例" --format json
```

**结构化输出预期结果：**
- ✅ JSON 中包含 `enhanced`
- ✅ JSON 中包含 `changes`
- ✅ JSON 中包含 `score`
- ✅ JSON 中包含 `metadata`

### 测试 2：CLI 模式带选项
```bash
# 测试不同的增强等级
node dist/cli.js --level light "写一个简单的函数"
node dist/cli.js --level standard "写一个简单的函数"
node dist/cli.js --level deep "写一个简单的函数"

# 测试输出到文件
node dist/cli.js "你的提示词" --output result.md
cat result.md

# 测试复制到剪贴板
node dist/cli.js "你的提示词" --copy
```

### 测试 3：CLI 模式管道输入
```bash
echo "帮我实现一个分页组件" | node dist/cli.js --level standard
cat prompt.txt | node dist/cli.js --output enhanced.txt
```

### 测试 4：TUI 交互模式
```bash
node dist/cli.js -i
```

**交互流程：**
1. 输入提示词
2. 按 Enter 增强
3. 查看流式结果
4. 按 `f` 进入反馈模式
5. 输入反馈（如 "更简洁"）
6. 按 Enter 迭代优化
7. 按 `h` 查看版本历史
8. 按 `d` 查看差异
9. 按 `q` 退出

### 测试 5：错误处理
```bash
# 测试无效的 API 密钥
OPENAI_API_KEY="invalid" node dist/cli.js "测试"

# 测试无网络
node dist/cli.js "测试"  # （断网情况下）

# 测试超时
node dist/cli.js "写一个非常长的提示词..." --level deep
```

### 测试 6：配置验证
```bash
# 测试环境变量解析
cat > ~/.promptforge/config.json << 'EOF'
{
  "defaultProvider": "openai",
  "providers": {
    "openai": {
      "baseURL": "https://api.openai.com/v1",
      "model": "gpt-4o",
      "apiKey": "env:OPENAI_API_KEY"
    }
  }
}
EOF

export OPENAI_API_KEY="sk-your-key"
node dist/cli.js "测试 env 解析"
```

## 验收标准

✅ **必须通过：**
- [ ] CLI 基本流程能流式输出结果
- [ ] 结果 JSON 包含 enhanced、changes、score、metadata
- [ ] 评分在 0-100 范围内
- [ ] 支持多个增强等级
- [ ] 输出选项工作（--output、--copy、--quiet）
- [ ] 管道输入工作
- [ ] TUI 能启动并接受输入
- [ ] TUI 中能流式显示结果
- [ ] 错误消息清晰有用

## 常见问题排查

### 问题："API key not configured"
**解决：** 检查 ~/.promptforge/config.json 或设置环境变量

### 问题："Raw mode is not supported"
**解决：** 这只在管道输入时发生，CLI 模式工作正常

### 问题：结果为空或格式错误
**解决：** 检查 LLM 返回的 JSON 格式，可能需要重试

## 性能指标

- 首次 API 调用：1-5 秒（取决于网络）
- 流式输出延迟：< 100ms per chunk
- 内存使用：< 100MB
- 完整增强流程：5-10 秒

## 下一步

完成端到端测试后：
1. ✅ 测试通过 → 提交代码
2. ✅ 记录任何 bug
3. ✅ 收集性能指标
4. ✅ 准备发布 v0.1.0
