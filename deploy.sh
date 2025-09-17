#!/bin/bash

# 🚀 Cloudflare Pages 快速部署脚本

set -e  # 遇到错误立即退出

echo "🚀 开始部署到 Cloudflare Pages..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
echo -e "${BLUE}📦 检查项目依赖...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 未找到 package.json 文件${NC}"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  未找到 node_modules，正在安装依赖...${NC}"
    npm install
fi

# 运行构建
echo -e "${BLUE}🔨 构建项目...${NC}"
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 构建失败，未找到 dist 目录${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建成功！${NC}"

# 显示构建结果
echo -e "${BLUE}📁 构建输出:${NC}"
ls -la dist/

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
            echo -e "${GREEN}🔗 Git 自动部署步骤:${NC}"
            echo "1. 确保代码已推送到 GitHub/GitLab"
            echo "2. 在 Cloudflare Pages 中连接你的仓库"
            echo "3. 配置构建设置:"
            echo "   - Framework: Vite"
            echo "   - Build command: npm run build"
            echo "   - Output directory: dist"
            echo ""
            echo -e "${BLUE}📋 当前 Git 状态:${NC}"
            git status --porcelain
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

# 显示有用的链接
echo -e "${BLUE}🔗 有用的链接:${NC}"
echo "• Cloudflare Dashboard: https://dash.cloudflare.com/"
echo "• Pages 管理: https://dash.cloudflare.com/pages"
echo "• 项目文档: ./CLOUDFLARE_DEPLOYMENT.md"