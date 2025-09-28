# Express API 示例

本目录包含基于 acquisition 项目的 Express API 示例代码，展示认证和 CRUD 操作的最佳实践实现。

## 目录结构

```
examples/express/
├── README.md                    # 本文件
├── auth/                        # 认证相关示例
│   ├── auth.controller.js      # 认证控制器
│   ├── auth.service.js         # 认证服务
│   ├── auth.routes.js          # 认证路由
│   ├── auth.validation.js      # 认证数据验证
│   └── auth.middleware.js      # 认证中间件
├── users/                       # 用户CRUD示例
│   ├── users.controller.js     # 用户控制器
│   ├── users.service.js        # 用户服务
│   ├── users.routes.js         # 用户路由
│   └── users.validation.js     # 用户数据验证
├── models/                      # 数据模型
│   └── user.model.js           # 用户模型
├── config/                      # 配置文件
│   ├── database.js             # 数据库配置
│   └── logger.js               # 日志配置
├── middleware/                  # 中间件
│   └── error.middleware.js     # 错误处理中间件
└── utils/                       # 工具函数
    ├── format.js               # 格式化工具
    ├── jwt.js                  # JWT工具
    └── cookies.js              # Cookie工具
```

## 功能特性

### 🔐 认证系统
- 用户注册 (POST /api/auth/sign-up)
- 用户登录 (POST /api/auth/sign-in)  
- 用户登出 (POST /api/auth/sign-out)
- JWT Token 认证
- 基于角色的权限控制

### 👥 用户管理 CRUD
- 获取所有用户 (GET /api/users) - 仅管理员
- 获取用户详情 (GET /api/users/:id) - 需认证
- 更新用户信息 (PUT /api/users/:id) - 用户可更新自己的信息，管理员可更新任何用户
- 删除用户 (DELETE /api/users/:id) - 仅管理员

### 🛡️ 安全特性
- 密码 bcrypt 加密
- JWT Token 安全存储在 httpOnly cookies
- 请求数据验证 (Zod)
- 统一错误处理
- 角色权限控制

## 使用方法

1. **复制示例代码**: 将相应的文件复制到你的项目中
2. **安装依赖**: 确保安装了所需的 npm 包
3. **配置环境**: 设置数据库连接和 JWT 密钥
4. **集成路由**: 在主应用中引入路由

## 依赖包

```json
{
  "dependencies": {
    "express": "^5.1.0",
    "bcrypt": "^6.0.0",
    "jsonwebtoken": "^9.0.2",
    "cookie-parser": "^1.4.7",
    "zod": "^4.1.11",
    "drizzle-orm": "^0.44.5",
    "winston": "^3.17.0"
  }
}
```

## 快速开始

查看各个目录下的示例代码，了解如何实现：

- **认证流程**: 查看 `auth/` 目录
- **CRUD 操作**: 查看 `users/` 目录  
- **数据验证**: 查看各个 `.validation.js` 文件
- **中间件使用**: 查看 `middleware/` 目录

每个文件都包含详细的注释和最佳实践实现。

## 📁 完整文件结构

```
examples/express/
├── README.md                      # 项目文档
├── auth/                          # 🔐 认证模块
│   ├── auth.controller.js        # 认证控制器 (注册/登录/登出)
│   ├── auth.service.js           # 认证业务逻辑
│   ├── auth.routes.js            # 认证路由定义
│   ├── auth.validation.js        # 认证数据验证
│   └── auth.middleware.js        # JWT认证中间件
├── users/                         # 👥 用户管理模块
│   ├── users.controller.js       # 用户CRUD控制器
│   ├── users.service.js          # 用户业务逻辑
│   ├── users.routes.js           # 用户路由定义
│   └── users.validation.js       # 用户数据验证
├── models/                        # 📊 数据模型
│   └── user.model.js             # 用户数据模型 (Drizzle ORM)
├── config/                        # ⚙️ 配置文件
│   ├── database.js               # 数据库配置 (Neon Serverless)
│   └── logger.js                 # 日志配置 (Winston)
├── utils/                         # 🛠️ 工具函数
│   ├── format.js                 # 数据格式化工具
│   ├── jwt.js                    # JWT工具
│   └── cookies.js                # Cookie管理工具
└── middleware/                    # 🔧 中间件 (可选扩展)
    └── error.middleware.js       # 全局错误处理中间件
```

## 🚀 快速开始

### 1. 环境准备

确保您的系统已安装：
- Node.js 18+
- npm 或 yarn
- PostgreSQL 数据库 (推荐使用 Neon)

### 2. 复制示例代码

```bash
# 将 examples/express 目录复制到您的项目中
cp -r examples/express/* your-project/
```

### 3. 安装依赖

```bash
npm install express bcrypt jsonwebtoken cookie-parser zod drizzle-orm winston helmet cors morgan dotenv @neondatabase/serverless

# 开发依赖
npm install -D drizzle-kit eslint prettier
```

### 4. 环境配置

创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL=postgresql://username:password@host:port/database

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d

# 应用配置
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

### 5. 数据库设置

```bash
# 生成数据库迁移文件
npx drizzle-kit generate

# 运行迁移
npx drizzle-kit migrate

# (可选) 启动数据库管理界面
npx drizzle-kit studio
```

### 6. 创建主应用文件

创建 `app.js`：

```javascript
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './config/logger.js';

// 导入路由
import authRoutes from './auth/auth.routes.js';
import usersRoutes from './users/users.routes.js';

const app = express();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 日志中间件
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `路径 ${req.originalUrl} 不存在`
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  logger.error('未处理的错误:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : error.message
  });
});

export default app;
```

创建 `server.js`：

```javascript
import 'dotenv/config';
import app from './app.js';
import logger from './config/logger.js';
import { testConnection } from './config/database.js';

const PORT = process.env.PORT || 3000;

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`🚀 服务器启动成功`);
      logger.info(`📡 监听端口: http://localhost:${PORT}`);
      logger.info(`🌍 环境: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();
```

### 7. 运行项目

```bash
# 开发模式
npm run dev
# 或
node --watch server.js

# 生产模式
npm start
# 或
node server.js
```

## 📡 API 端点

### 认证接口

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| POST | `/api/auth/sign-up` | 用户注册 | 公开 |
| POST | `/api/auth/sign-in` | 用户登录 | 公开 |
| POST | `/api/auth/sign-out` | 用户登出 | 需要认证 |
| GET  | `/api/auth/me` | 获取当前用户信息 | 需要认证 |

### 用户管理接口

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 获取所有用户 | 管理员 |
| GET | `/api/users/stats` | 获取用户统计 | 管理员 |
| GET | `/api/users/:id` | 获取用户详情 | 本人或管理员 |
| PUT | `/api/users/:id` | 更新用户信息 | 本人或管理员 |
| DELETE | `/api/users/:id` | 删除用户 | 管理员 |

## 🧪 API 测试示例

使用 curl 或 Postman 测试API：

### 1. 用户注册
```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "管理员",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. 用户登录
```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 3. 获取用户列表
```bash
curl -X GET http://localhost:3000/api/users \
  -b cookies.txt
```

### 4. 创建普通用户
```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "email": "zhangsan@example.com",
    "password": "password123"
  }'
```

## 🏗️ 项目特性

### ✅ 已实现功能
- 🔐 **JWT身份认证**: 基于Cookie的安全认证
- 👤 **用户管理**: 完整的CRUD操作
- 🛡️ **权限控制**: 基于角色的访问控制
- ✨ **数据验证**: 使用Zod进行请求数据验证
- 📝 **日志记录**: Winston结构化日志
- 🔒 **密码安全**: bcrypt密码加密
- 🍪 **安全Cookie**: httpOnly + sameSite配置
- 📊 **数据库ORM**: Drizzle ORM集成
- 🛠️ **错误处理**: 统一错误响应格式
- 📈 **用户统计**: 管理员统计功能

### 🔧 架构特点
- **分层架构**: Routes → Controllers → Services → Models
- **模块化设计**: 功能模块独立组织
- **类型安全**: 完整的数据验证
- **安全第一**: 多层安全防护
- **可扩展性**: 易于添加新功能

## 🎯 最佳实践亮点

1. **安全认证流程**: JWT + httpOnly Cookie
2. **细粒度权限控制**: 用户只能操作自己的资源
3. **数据验证**: 请求参数和响应数据的双重验证
4. **错误处理**: 统一的错误响应格式和日志记录
5. **代码组织**: 清晰的分层和模块化结构
6. **环境配置**: 开发和生产环境的配置分离
7. **数据库安全**: ORM防SQL注入，密码哈希存储

## 🚀 扩展建议

基于此示例，您可以轻松扩展：

- 📧 **邮件服务**: 注册验证、密码重置
- 🔄 **刷新令牌**: 长期会话管理
- 📱 **多因素认证**: 短信/邮箱验证
- 🔍 **搜索过滤**: 用户列表搜索和分页
- 📊 **审计日志**: 用户操作记录
- 🌐 **国际化**: 多语言支持
- 🎨 **文件上传**: 头像上传功能
- 📈 **监控集成**: APM和性能监控

开始使用这些示例代码，构建您的下一个Node.js后端项目吧！ 🎉
