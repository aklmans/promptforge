#!/bin/bash

# PromptForge 端到端测试设置脚本

echo "🔧 PromptForge E2E 测试设置"
echo ""

# 检查是否已构建
if [ ! -f "dist/cli.js" ]; then
    echo "❌ 未找到 dist/cli.js，请先运行: npm run build"
    exit 1
fi

echo "✅ 构建检查通过"
echo ""

# 检查 API 密钥
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  未设置 OPENAI_API_KEY 环境变量"
    echo "请设置: export OPENAI_API_KEY=\"sk-...\""
    echo ""
else
    echo "✅ OPENAI_API_KEY 已设置（长度: ${#OPENAI_API_KEY}）"
    echo ""
fi

# 检查配置文件
if [ -f "$HOME/.promptforge/config.json" ]; then
    echo "✅ 配置文件已存在: $HOME/.promptforge/config.json"
else
    echo "⚠️  配置文件不存在，首次运行 TUI 会创建"
fi

echo ""
echo "📝 测试场景："
echo ""
echo "1️⃣  基本 CLI 测试（需要 API 密钥）"
echo "   node dist/cli.js \"帮我写一个类型安全的状态管理库\""
echo ""
echo "2️⃣  指定增强级别"
echo "   node dist/cli.js --level deep \"你的提示词\""
echo ""
echo "3️⃣  输出到文件"
echo "   node dist/cli.js \"你的提示词\" --output result.md"
echo ""
echo "4️⃣  TUI 交互模式"
echo "   node dist/cli.js -i"
echo ""
echo "5️⃣  管道输入"
echo "   echo \"你的提示词\" | node dist/cli.js"
echo ""
echo "🚀 准备好开始测试了！"
