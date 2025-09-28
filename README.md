# Node.js DevOps Template 🚀

> 专注于Node.js的完整DevOps实践模板和学习资源

## 📋 项目概述

这个仓库提供了一套完整的Node.js DevOps实践模板，包含从开发到生产部署的全流程最佳实践。适合想要学习现代DevOps工作流的开发者。

## 🎯 项目特点

- **🔄 完整CI/CD流水线** - GitHub Actions自动化工作流
- **🐳 生产级Docker化** - 多阶段构建，安全配置
- **📊 代码质量保障** - ESLint + Prettier + Jest
- **🗄️ 数据库版本管理** - Drizzle ORM迁移系统
- **🔒 安全最佳实践** - JWT认证，安全中间件
- **📝 详细学习文档** - 逐步学习指南

## 📁 仓库结构

```
nodejs-devops-template/
├── 📁 templates/           # 可复用的DevOps模板
│   ├── ci-cd/             # GitHub Actions工作流
│   ├── docker/            # Docker配置
│   ├── config/            # 应用配置模板  
│   └── scripts/           # 自动化脚本
├── 📁 docs/               # DevOps学习文档
│   ├── deployment/        # 部署指南
│   ├── troubleshooting/   # 故障排查
│   └── best-practices/    # 最佳实践
├── 📁 example/            # 完整示例项目
│   └── express-api/       # Express API示例
└── 📁 tools/              # 自动化工具
    └── init-project.js    # 项目初始化脚本
```

## 🚀 快速开始

### 1. 使用模板创建新项目

```bash
# 克隆模板
git clone https://github.com/your-username/nodejs-devops-template.git my-project
cd my-project

# 运行初始化脚本
node tools/init-project.js
```

### 2. 本地开发

```bash
# 安装依赖
npm install

# 启动开发环境 (Docker + 热重载)
npm run dev:docker

# 或者本地开发
npm run dev
```

### 3. 部署到生产

```bash
# 生产环境部署
npm run prod:docker
```

## 📚 学习路径

1. **[DevOps基础概念](docs/basics/README.md)** - 了解DevOps核心思想
2. **[CI/CD流水线](docs/ci-cd/README.md)** - 自动化构建和部署
3. **[容器化实践](docs/docker/README.md)** - Docker在开发和生产中的应用
4. **[监控和日志](docs/monitoring/README.md)** - 应用健康监控
5. **[安全最佳实践](docs/security/README.md)** - 生产环境安全配置

## 🛠️ 包含的DevOps实践

### CI/CD流水线
- ✅ 代码质量检查 (ESLint + Prettier)
- ✅ 自动化测试 (Jest)
- ✅ Docker镜像构建和推送
- ✅ 多架构支持 (amd64/arm64)
- ✅ 环境分离部署策略

### 容器化
- ✅ 多阶段Docker构建
- ✅ 非root用户安全配置
- ✅ 健康检查和资源限制
- ✅ 开发/生产环境分离
- ✅ 数据持久化和网络配置

### 监控和日志
- ✅ 结构化日志记录 (Winston)
- ✅ HTTP请求日志 (Morgan)
- ✅ 错误追踪和报告
- ✅ 性能监控指标

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个模板！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**💡 提示**: 这个模板基于真实的生产项目提取而来，确保了实践的可行性和稳定性。