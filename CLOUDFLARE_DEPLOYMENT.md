# 🚀 Cloudflare Pages 部署指南

## 📋 部署配置总览

## 🔧 关键文件配置

### Cloudflare Functions 配置
```
functions/
├── api/
│   ├── ip.js           # ip地址查询
```

这些函数文件会自动部署为 Cloudflare Functions，提供以下API端点：
- `/api/ip` - ip地址查询

### 构建设置
```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: / (项目根目录)
Node.js version: 18 或更高
```

## 🎯 详细部署步骤

### 方法一：Git 连接部署（推荐）

#### 1. **登录 Cloudflare Dashboard**
- 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
- 进入 **Pages** 页面

#### 2. **创建新项目**
- 点击 **"Create a project"**
- 选择 **"Connect to Git"**

#### 3. **连接 Git 仓库**
- 授权 GitHub/GitLab 访问
- 选择你的仓库：`ccc-ju/tools`
- 选择分支：`main`

#### 4. **配置构建设置**
```yaml
Project name: online-toolbox
Production branch: main

Build settings:
  Framework preset: Vite
  Build command: npm run build
  Build output directory: dist
  Root directory: /
  
Environment variables: (暂无需要)
```

#### 5. **高级设置**
```yaml
Node.js version: 18.17.0 (或更高)
Build timeout: 10 minutes
```

### 方法二：直接上传部署

#### 1. **本地构建**
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 检查构建结果
ls -la dist/
```

#### 2. **使用 Wrangler CLI**
```bash
# 安装 Wrangler (如果还没有)
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署到 Pages
wrangler pages deploy dist --project-name=online-toolbox
```

## 🔧 构建配置详解

### package.json 脚本
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### vite.config.js 配置
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

## 📁 构建输出结构
```
dist/
├── index.html              # 主页面
├── _headers                # 安全头配置
└── assets/
    ├── index-[hash].js     # 打包的 JavaScript
    └── index-[hash].css    # 打包的 CSS
```

## 🌐 API 代理架构

### 开发环境
- 使用 Vite 代理 (`vite.config.js`)
- 本地服务器地址：`http://localhost:8788`

### 生产环境（Cloudflare Pages）
- 使用 Cloudflare Functions 作为代理
- 自动处理 CORS 和请求头
- 无需额外配置，部署时自动可用

### 自定义域名设置
1. 在 Cloudflare Pages 项目中点击 **"Custom domains"**
2. 添加你的域名
3. 配置 DNS 记录（自动或手动）

### DNS 记录示例
```
Type: CNAME
Name: tools (或 @)
Target: your-project.pages.dev
```

## 🔒 环境变量配置

如果将来需要环境变量：

### 在 Cloudflare Dashboard 中：
1. 进入项目设置
2. 点击 **"Environment variables"**
3. 添加变量：
   ```
   NODE_ENV=production
   VITE_APP_VERSION=1.0.0
   ```

### 在代码中使用：
```javascript
// 在 Vite 项目中，环境变量需要 VITE_ 前缀
const version = import.meta.env.VITE_APP_VERSION
```

## 🚨 常见问题解决

### 1. **构建失败：Node.js 版本**
```
Error: Node.js version not supported
```
**解决方案：**
- 在项目设置中设置 Node.js 版本为 18 或更高
- 或添加 `.nvmrc` 文件：
```bash
echo "18" > .nvmrc
```

### 2. **构建失败：依赖安装**
```
Error: Cannot find module
```
**解决方案：**
- 确保 `package.json` 和 `package-lock.json` 都已提交
- 检查构建命令是否正确

### 3. **路由问题（SPA）**
如果将来添加路由功能，需要配置重定向：

创建 `public/_redirects` 文件：
```
/*    /index.html   200
```

### 4. **静态资源路径问题**
确保 `public/` 目录中的文件路径正确：
```
public/_headers → 复制到 dist/_headers
```

## 📊 部署监控

### 构建日志查看
1. 在 Cloudflare Pages 项目中
2. 点击 **"Deployments"**
3. 查看构建日志和状态

### 性能监控
- 使用 Cloudflare Analytics
- 监控页面加载速度
- 查看访问统计

## 🔄 自动部署

配置完成后，每次推送到 `main` 分支都会自动触发部署：

```bash
git add .
git commit -m "update: 修复某个功能"
git push origin main
# 🚀 自动触发 Cloudflare Pages 构建和部署
```

## 📝 部署检查清单

- [ ] Git 仓库已推送最新代码
- [ ] package.json 配置正确
- [ ] 构建命令测试通过 (`npm run build`)
- [ ] Cloudflare Pages 项目已创建
- [ ] 构建设置配置正确
- [ ] 域名配置完成（如需要）
- [ ] 首次部署成功
- [ ] 功能测试通过

完成这些步骤后，你的 React 工具箱就能在 Cloudflare Pages 上正常运行了！