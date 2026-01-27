# 🛠️ 在线工具箱

一个基于 React 的简洁实用在线工具集合，包含**时间戳转换**、**字符串对比**、**坐标系转换**、**IP查询**等常用开发和日常工具。

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Deployed on Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare-F38020?style=flat-square&logo=cloudflare)](https://www.cloudflare.com/)

## ✨ 功能特性

### 📅 时间戳转换工具
- ✅ 支持秒和毫秒时间戳转换
- ✅ 实时显示当前时间戳
- ✅ 双向转换：时间戳 ↔ 日期时间
- ✅ 本地时区自动识别
- ✅ 一键复制功能

### 🔄 字符串对比与合并工具
- ✅ 智能字符串差异对比
- ✅ 可视化差异显示（新增/删除/修改）
- ✅ 手动选择合并结果
- ✅ 支持中文和英文内容
- ✅ 逐行差异分析

### 🗺️ 经纬度坐标转换工具
- ✅ 支持三大坐标系：
  - **WGS84** - GPS原始坐标（Google Maps、国际标准）
  - **GCJ02** - 国测局火星坐标（高德、腾讯地图）
  - **BD09** - 百度坐标（百度地图专用）
- ✅ 单个坐标转换
- ✅ 批量坐标转换（支持多行输入）
- ✅ 📏 经纬度距离计算
  - Haversine 公式精确计算
  - 平面近似快速估算
  - 支持米/公里单位自动转换
- ✅ 高精度转换算法（精确到8位小数）
- ✅ 详细的坐标系说明和使用建议

### 🌐 IP地址查询工具
- ✅ 自动检测 IPv4 和 IPv6 地址
- ✅ 显示详细地理位置信息（国家、省份、城市）
- ✅ 显示运营商信息（ISP、ASN）
- ✅ 显示时区信息
- ✅ 经纬度坐标显示
- ✅ 多源 IP 检测保证可靠性
- ✅ 一键复制 IP 地址
- ✅ 集成第三方专业检测平台：
  - AbuseIPDB（黑名单查询）
  - Scamalytics（欺诈分检测）

### 🎨 界面特性
- 🇨🇳中英🇺🇸文双语支持（i18n 国际化）
- 🌓 深色/浅色主题切换
- 📱 响应式设计，完美适配移动端
- ⬆️ 智能回到顶部按钮
- 🔒 所有数据本地处理，隐私安全
- ⚡ 零延迟交互体验

## 🚀 技术栈

- **前端框架**: React 18
- **构建工具**: Vite 5
- **样式方案**: 原生 CSS（CSS Variables + 模块化）
- **部署平台**: Cloudflare Pages + Functions
- **包管理器**: npm

## 📦 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖
```bash
npm install
```

### 本地开发
```bash
# 前端开发模式
npm run dev:frontend

# 完整开发模式（包含 Cloudflare Functions）
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 生产构建
```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 本地预览
```bash
npm run preview
```

## 🌐 部署

### Cloudflare Pages 部署（推荐）

#### 方法一：Git 连接自动部署
1. 将代码推送到 GitHub/GitLab 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 **Pages** → **Create a project** → **Connect to Git**
4. 选择你的仓库并配置构建设置：
   ```yaml
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   Node.js version: 18
   ```
5. 点击 **Save and Deploy**

每次推送到主分支都会自动触发部署。

#### 方法二：Wrangler CLI 直接部署
```bash
# 构建项目
npm run build

# 使用 Wrangler 部署
npx wrangler pages deploy dist --project-name=online-toolbox
```

### 其他部署平台

#### Vercel
```bash
npm run build
vercel --prod
```

#### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

详细部署指南请参阅 [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

## 📁 项目结构

```
online-toolbox/
├── 📄 index.html              # 应用入口 HTML
├── 📄 package.json            # 项目配置和依赖
├── 📄 vite.config.js          # Vite 构建配置
├── 📄 wrangler.toml           # Cloudflare 部署配置
├── 📄 .nvmrc                  # Node.js 版本锁定
├── 📄 .gitignore              # Git 忽略文件
├── 📄 README.md               # 项目说明文档
├── 📄 CLOUDFLARE_DEPLOYMENT.md # 详细部署指南
│
├── 📁 functions/              # Cloudflare Functions（Serverless API）
│   └── 📁 api/
│       └── 📄 ip.js           # IP 查询代理 API
│
├── 📁 src/                    # 源代码目录
│   ├── 📄 main.jsx            # React 应用入口
│   ├── 📄 App.jsx             # 主应用组件（路由、主题切换）
│   ├── 📄 index.css           # 样式入口文件
│   │
│   ├── 📁 components/         # React 组件
│   │   ├── 📄 TimestampTool.jsx    # 时间戳转换工具
│   │   ├── 📄 StringDiffTool.jsx   # 字符串对比工具
│   │   ├── 📄 CoordinateTool.jsx   # 坐标转换工具
│   │   └── 📄 IpTool.jsx           # IP 查询工具
│   │
│   ├── 📁 styles/             # 模块化样式文件
│   │   ├── 📄 variables.css        # CSS 变量（颜色、间距等）
│   │   ├── 📄 base.css             # 基础样式和重置
│   │   ├── 📄 layout.css           # 布局样式
│   │   └── 📄 components.css       # 组件样式
│   │
│   └── 📁 utils/              # 工具函数
│       ├── 📄 clipboard.js         # 剪贴板操作
│       ├── 📄 coordinates.js       # 坐标转换算法
│       ├── 📄 coordinateInfo.js    # 坐标系信息
│       └── 📄 i18n.jsx             # 国际化（中英文切换）
│
└── 📁 dist/                   # 构建输出目录（自动生成）
    ├── 📄 index.html
    └── 📁 assets/             # 静态资源
```

## 🛠️ 核心功能实现

### 坐标系转换算法
- **WGS84 → GCJ02**: 使用标准加密算法
- **GCJ02 → WGS84**: 迭代纠偏算法
- **GCJ02 ↔ BD09**: 百度坐标二次加密转换

### 距离计算算法
- **Haversine 公式**: 考虑地球曲率的精确球面距离
- **平面近似算法**: 快速估算短距离（适用于数百公里内）

### IP 查询架构
- **开发环境**: Vite 代理本地请求
- **生产环境**: Cloudflare Functions 作为中间层
- **多源检测**: 使用多个 IP API 提供商保证可靠性
- **智能降级**: API 失败时自动切换备用源

## 🎨 样式设计

### CSS 架构
采用模块化 CSS 设计，使用 CSS Variables 实现主题切换：

```css
/* variables.css - 定义全局变量 */
:root {
  --primary-color: #2196f3;
  --background-color: #ffffff;
  /* ... */
}

[data-theme="dark"] {
  --background-color: #1a1a1a;
  /* ... */
}
```

### 响应式设计
- Mobile First 设计理念
- 使用 Flexbox 和 Grid 布局
- 断点设计：手机（< 768px）、平板、桌面

## 🔐 隐私与安全

- ✅ **本地处理**: 所有工具均在浏览器本地运行，数据不上传服务器
- ✅ **IP 查询**: 通过 Cloudflare Functions 代理，不记录用户请求
- ✅ **无追踪**: 不使用任何分析工具或追踪脚本
- ✅ **开源透明**: 所有代码公开可审计


## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 License

本项目采用 MIT 许可证。详见 [LICENSE](./LICENSE) 文件。

## 👨‍💻 作者

Made with ❤️ by **Devin - juju**

---

⭐ 如果这个项目对你有帮助，欢迎给个 Star！