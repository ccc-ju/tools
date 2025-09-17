# 在线工具箱

一个基于React的简洁实用在线工具集合，包含常用的开发和日常工具。

## 功能特性

### 📅 时间戳转换
- 支持秒和毫秒时间戳转换
- 实时显示当前时间戳
- 双向转换：时间戳 ↔ 日期时间
- 本地时区自动识别

### 🔄 字符串对比与合并
- 智能字符串差异对比
- 可视化差异显示
- 手动选择合并结果
- 支持中文和英文内容

### 🗺️ 经纬度坐标转换
- 支持三大坐标系：WGS84、GCJ02（火星坐标）、BD09（百度坐标）
- 单个坐标转换
- 批量坐标转换
- 高精度转换算法

## 技术栈

- ⚛️ React 18
- ⚡ Vite 构建工具
- 🎨 原生CSS样式
- 📱 响应式设计
- 🔒 本地处理，数据安全

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 部署到 Cloudflare Pages

### 方法一：通过 Git 连接（推荐）

1. 将代码推送到 GitHub/GitLab 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 Pages 页面，点击 "Create a project"
4. 选择 "Connect to Git"，授权并选择你的仓库
5. 配置构建设置：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (如果项目在根目录)
6. 点击 "Save and Deploy"

### 方法二：直接上传

```bash
# 构建项目
npm run build

# 使用 Wrangler CLI 部署
npx wrangler pages deploy dist --project-name=online-toolbox
```

### 构建配置

项目已配置好 Cloudflare Pages 的构建设置：

- **Node.js 版本**: 18 或更高
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **环境变量**: 无需额外配置

## 其他部署选项

### Vercel
```bash
npm run build
# 上传 dist 目录到 Vercel
```

### Netlify
```bash
npm run build
# 拖拽 dist 目录到 Netlify Deploy
```

### GitHub Pages
```bash
npm run build
# 将 dist 目录内容推送到 gh-pages 分支
```

## 项目结构

```
online-toolbox/
├── 📄 index.html              # Vite 入口文件（必须在根目录）
├── 📄 package.json            # 项目依赖和脚本配置
├── 📄 vite.config.js          # Vite 构建配置
├── 📄 wrangler.toml           # Cloudflare Pages 部署配置
├── 📄 README.md               # 项目说明文档
├── 📄 PROJECT_STRUCTURE.md    # 项目结构说明（本文件）
│
├── 📁 public/                 # 静态资源目录
│   └── 📄 _headers            # Cloudflare Pages 安全头配置
│
├── 📁 src/                    # 源代码目录
│   ├── 📄 main.jsx            # React 应用入口
│   ├── 📄 App.jsx             # 主应用组件
│   ├── 📄 index.css           # 样式入口文件（导入所有样式模块）
│   │
│   ├── 📁 components/         # React 组件目录
│   │   ├── 📄 TimestampTool.jsx    # 时间戳转换工具组件
│   │   ├── 📄 StringDiffTool.jsx   # 字符串对比工具组件
│   │   └── 📄 CoordinateTool.jsx   # 坐标转换工具组件
│   │
│   ├── 📁 styles/             # 样式文件目录
│   │   ├── 📄 variables.css        # CSS 变量定义
│   │   ├── 📄 base.css             # 基础样式和重置
│   │   ├── 📄 layout.css           # 布局相关样式
│   │   └── 📄 components.css       # 组件样式
│   │
│   └── 📁 utils/              # 工具函数目录
│       ├── 📄 clipboard.js         # 剪贴板操作工具
│       └── 📄 coordinates.js       # 坐标转换算法
│
└── 📁 dist/                   # 构建输出目录（自动生成）
    ├── 📄 index.html          # 构建后的 HTML 文件
    ├── 📄 _headers            # 复制的安全头配置
    └── 📁 assets/             # 构建后的静态资源
        ├── 📄 index-[hash].js      # 打包后的 JavaScript
        └── 📄 index-[hash].css     # 打包后的 CSS
```

## 🎯 文件组织原则

### 1. **根目录文件**
- `index.html`: Vite 要求在根目录，作为应用入口
- 配置文件都放在根目录便于管理

### 2. **public/ 目录**
- 存放不需要处理的静态资源
- `_headers`: Cloudflare Pages 的安全头配置
- 构建时会直接复制到 dist 目录

### 3. **src/ 目录结构**
- **components/**: 按功能拆分的 React 组件
- **styles/**: 模块化的 CSS 文件
- **utils/**: 可复用的工具函数

### 4. **样式文件组织**
```css
src/index.css (入口)
├── @import './styles/variables.css'    # CSS 变量
├── @import './styles/base.css'         # 基础样式
├── @import './styles/layout.css'       # 布局样式
└── @import './styles/components.css'   # 组件样式
```

## 作者

Made with ❤️ by Devin