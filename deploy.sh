#!/bin/bash

# 🚀 Cloudflare Pages 部署脚本（包含 API 代理支持）
# 适用于包含 Cloudflare Functions 的项目

set -e  # 遇到错误立即退出

echo "🚀 开始构建和部署到 Cloudflare Pages..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误：请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查依赖
echo -e "${BLUE}📦 检查项目依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}🔄 安装依赖中...${NC}"
    npm install
fi

# 检查 Cloudflare Functions 配置
echo -e "${PURPLE}📁 检查 Cloudflare Functions...${NC}"
if [ -d "functions" ]; then
    echo -e "${GREEN}✅ 发现 functions 目录，包含以下 API:${NC}"
    find functions -name "*.js" -type f | sed 's|functions/||g' | sed 's|.js$||g' | awk '{print "   /" $0}'
else
    echo -e "${YELLOW}⚠️  警告：未找到 functions 目录，将仅部署静态文件${NC}"
fi

# 运行构建
echo -e "${BLUE}🏗️  构建项目...${NC}"
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 构建失败，未找到 dist 目录${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建成功！${NC}"

# 显示构建结果
echo -e "${BLUE}📂 构建输出检查:${NC}"
echo "• 静态文件: $(ls dist/ | wc -l) 个文件"
echo "• 大小: $(du -sh dist/ | cut -f1)"
if [ -d "functions" ]; then
    echo "• API 函数: $(find functions -name '*.js' | wc -l) 个"
fi
echo ""

# 检查是否安装了 wrangler
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  未找到 wrangler CLI${NC}"
    echo -e "${BLUE}💡 请选择部署方式:${NC}"
    echo "1. 安装 wrangler 并直接部署"
    echo "2. 手动上传 dist 目录到 Cloudflare Pages"
    echo "3. 使用 Git 连接自动部署（推荐）"
    
    read -p "请选择 (1/2/3): " choice
    
    case $choice in
        1)
            echo -e "${BLUE}📦 安装 wrangler...${NC}"
            npm install -g wrangler
            echo -e "${BLUE}🔑 请登录 Cloudflare...${NC}"
            wrangler login
            echo -e "${BLUE}🚀 部署中...${NC}"
            wrangler pages deploy dist --project-name=online-toolbox
            ;;
        2)
            echo -e "${YELLOW}📋 手动部署步骤:${NC}"
            echo "1. 登录 Cloudflare Dashboard"
            echo "2. 进入 Pages 页面"
            echo "3. 点击 'Upload assets'"
            echo "4. 上传 dist 目录中的所有文件"
            ;;
        3)
            echo -e "${GREEN}🔗 Git 自动部署步骤 (推荐):${NC}"
            echo "1. 确保代码已推送到 GitHub/GitLab"
            echo "2. 在 Cloudflare Pages 中连接你的仓库"
            echo "3. 配置构建设置:"
            echo "   - Framework: Vite"
            echo "   - Build command: npm run build"
            echo "   - Output directory: dist"
            echo "   - Functions: 自动检测 (functions 目录)"
            echo ""
            echo -e "${BLUE}📋 当前 Git 状态:${NC}"
            if git rev-parse --git-dir > /dev/null 2>&1; then
                git status --porcelain | head -10
                if [ -z "$(git status --porcelain)" ]; then
                    echo "✅ 工作目录干净，可以直接部署"
                else
                    echo "⚠️  有未提交的更改，请先提交并推送"
                    echo "   建议运行: git add . && git commit -m 'deploy: 添加API代理功能' && git push"
                fi
            else
                echo "⚠️  不在 Git 仓库中，请初始化 Git 并推送到远程仓库"
            fi
            ;;
    esac
else
    # wrangler 已安装，直接部署
    echo -e "${BLUE}🚀 使用 wrangler 部署...${NC}"
    
    # 检查是否已登录
    if ! wrangler whoami &> /dev/null; then
        echo -e "${BLUE}🔑 请登录 Cloudflare...${NC}"
        wrangler login
    fi
    
    # 部署
    wrangler pages deploy dist --project-name=online-toolbox
fi

echo -e "${GREEN}🎉 部署脚本执行完成！${NC}"
echo ""

# 显示有用的链接和信息
echo -e "${BLUE}🔗 有用的链接:${NC}"
echo "• Cloudflare Dashboard: https://dash.cloudflare.com/"
echo "• Pages 管理: https://dash.cloudflare.com/pages"
echo "• 项目文档: ./CLOUDFLARE_DEPLOYMENT.md"
echo ""
echo -e "${PURPLE}🔧 部署后可用的 API 端点:${NC}"
if [ -d "functions" ]; then
    find functions -name "*.js" -type f | sed 's|functions/||g' | sed 's|.js$||g' | awk '{print "• /" $0}'
else
    echo "• 无 API 端点 (未找到 functions 目录)"
fi
echo ""
echo -e "${GREEN}🚀 现在可以访问你的网站并测试 iPhone 库存监控功能！${NC}"