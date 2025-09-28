# Node.js 后端开发最佳实践

> 基于 acquisition 项目的实际经验总结，为 Node.js 后端 DevOps 开发提供最佳实践指导

## 目录

- [项目架构](#项目架构)
- [文件夹结构](#文件夹结构)
- [数据验证与错误处理](#数据验证与错误处理)
- [安全性实践](#安全性实践)
- [开发工具链](#开发工具链)
- [数据库集成](#数据库集成)
- [容器化部署](#容器化部署)
- [CI/CD 流程](#ci-cd-流程)
- [监控与日志](#监控与日志)

## 项目架构

### 分层架构原则

采用经典的分层架构模式，确保代码职责分离和可维护性：

```
路由层 (Routes) → 控制器层 (Controllers) → 服务层 (Services) → 数据层 (Models)
```

#### 各层职责

- **路由层 (Routes)**: 定义 API 端点，处理 HTTP 请求路由
- **控制器层 (Controllers)**: 处理请求响应，数据验证，调用业务逻辑
- **服务层 (Services)**: 实现核心业务逻辑，与数据层交互
- **数据层 (Models)**: 定义数据模型和数据库交互

### 示例实现

```javascript path=null start=null
// routes/auth.routes.js - 路由层
import { signIn, signOut, signup } from '#controllers/auth.controller.js';
import express from 'express';

const router = express.Router();
router.post('/sign-up', signup);
router.post('/sign-in', signIn);
export default router;
```

```javascript path=null start=null
// controllers/auth.controller.js - 控制器层
export const signup = async (req, res, next) => {
  try {
    // 1. 数据验证
    const validationResult = signupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }
    
    // 2. 调用业务逻辑
    const user = await createUser(validationResult.data);
    
    // 3. 返回响应
    res.status(201).json({ message: '注册成功', user });
  } catch (e) {
    next(e); // 统一错误处理
  }
};
```

## 文件夹结构

### 推荐的项目结构

```
src/
├── config/          # 配置文件
│   ├── database.js   # 数据库配置
│   ├── logger.js     # 日志配置
│   └── arcjet.js     # 安全配置
├── controllers/      # 控制器层
├── services/         # 业务逻辑层
├── models/          # 数据模型
├── routes/          # 路由定义
├── middleware/      # 中间件
├── utils/           # 工具函数
├── validations/     # 数据验证
├── app.js           # Express 应用配置
├── server.js        # 服务器启动
└── index.js         # 入口文件
```

### 模块化组织原则

1. **按功能分组**: 每个业务模块独立组织（如 auth, users）
2. **职责单一**: 每个文件只负责一个特定职责
3. **依赖清晰**: 使用路径别名简化导入关系

### 路径别名配置

在 `package.json` 中配置路径别名：

```json path=null start=null
{
  "imports": {
    "#src/*": "./src/*",
    "#config/*": "./src/config/*",
    "#controllers/*": "./src/controllers/*",
    "#middleware/*": "./src/middleware/*",
    "#models/*": "./src/models/*",
    "#routes/*": "./src/routes/*",
    "#services/*": "./src/services/*",
    "#utils/*": "./src/utils/*",
    "#validations/*": "./src/validations/*"
  }
}
```

## 数据验证与错误处理

### 使用 Zod 进行数据验证

```javascript path=null start=null
// validations/auth.validation.js
import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(6).max(128),
  role: z.enum(['user', 'admin']).default('user'),
});
```

### 统一错误处理

```javascript path=null start=null
// utils/format.js
export const formatValidationError = errors => {
  if (!errors || !errors.issues) return 'Validation failed';
  if (Array.isArray(errors.issues))
    return errors.issues.map(i => i.message).join(', ');
  return JSON.stringify(errors);
};
```

### 错误处理最佳实践

1. **统一错误格式**: 所有 API 返回一致的错误格式
2. **错误分类**: 区分业务错误、系统错误、验证错误
3. **日志记录**: 记录详细的错误信息用于调试
4. **用户友好**: 向用户返回友好的错误信息

## 安全性实践

### JWT 认证实现

```javascript path=null start=null
// utils/jwt.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d';

export const jwttoken = {
  sign: payload => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }),
  verify: token => jwt.verify(token, JWT_SECRET),
};
```

### 安全的 Cookie 配置

```javascript path=null start=null
// utils/cookies.js
export const cookies = {
  getOptions: () => ({
    httpOnly: true,                                    // 防止 XSS
    secure: process.env.NODE_ENV === 'production',    // HTTPS only
    sameSite: 'strict',                                // CSRF 防护
    maxAge: 15 * 60 * 1000,                          // 15 分钟过期
  }),
  
  set: (res, name, value, options = {}) => {
    res.cookie(name, value, { ...cookies.getOptions(), ...options });
  },
};
```

### 密码安全处理

```javascript path=null start=null
// services/auth.service.js
import bcrypt from 'bcrypt';

export const hashPassword = async password => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
```

### 中间件安全检查

- **身份认证**: JWT token 验证
- **权限控制**: 基于角色的访问控制
- **速率限制**: 防止 API 滥用
- **安全头部**: 使用 Helmet 添加安全头部

## 开发工具链

### 包管理最佳实践

```json path=null start=null
{
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest"
  }
}
```

### 代码规范工具

- **ESLint**: JavaScript 代码检查
- **Prettier**: 代码格式化
- **配置文件**: `.eslintrc.js`, `.prettierrc`

### 环境配置

```javascript path=null start=null
// 使用 dotenv 管理环境变量
import 'dotenv/config';

// 环境变量验证
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

## 数据库集成

### Drizzle ORM 使用模式

```javascript path=null start=null
// models/user.model.js
import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 40 }).notNull().default('user'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

### 数据库连接管理

```javascript path=null start=null
// config/database.js
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// 开发环境配置
if (process.env.NODE_ENV === 'development') {
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  neonConfig.useSecureWebSocket = false;
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export { db, sql };
```

### 数据库操作模式

```javascript path=null start=null
// 查询示例
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);

// 插入示例
const [newUser] = await db
  .insert(users)
  .values({ name, email, password: hashedPassword, role })
  .returning({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
  });
```

## 容器化部署

### 多阶段 Dockerfile

```dockerfile path=null start=null
# 基础镜像
FROM node:18-alpine AS base
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 安全配置
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# 开发环境
FROM base AS development
USER root
RUN npm ci && npm cache clean --force
USER nodejs
CMD ["npm", "run", "dev"]

# 生产环境
FROM base AS production
CMD ["npm", "start"]
```

### Docker Compose 配置

```yaml path=null start=null
# docker-compose.yml
version: '3.8'
services:
  app:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## CI/CD 流程

### GitHub Actions 工作流

```yaml path=null start=null
name: Docker Build and Push

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          registry: docker.io
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
          
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

### 质量检查流程

```yaml path=null start=null
name: Code Quality

on: [push, pull_request]

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test
```

## 监控与日志

### Winston 日志配置

```javascript path=null start=null
// config/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export default logger;
```

### 健康检查端点

```javascript path=null start=null
// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
  });
});
```

### 请求日志记录

```javascript path=null start=null
// 使用 Morgan 记录 HTTP 请求
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) },
  skip: (req, res) => {
    // 跳过健康检查请求
    const healthPaths = ['/health', '/ping', '/status'];
    return healthPaths.includes(req.path);
  },
}));
```

## 总结

本最佳实践指南基于 acquisition 项目的实际开发经验，涵盖了 Node.js 后端开发的核心要素：

- ✅ **清晰的项目架构**: 分层设计，职责分离
- ✅ **规范的文件组织**: 模块化，可维护性高
- ✅ **完善的安全机制**: 认证、授权、数据保护
- ✅ **高效的开发工具链**: 自动化测试、代码规范
- ✅ **可靠的部署方案**: 容器化、CI/CD
- ✅ **完整的监控体系**: 日志记录、健康检查

遵循这些实践将帮助您构建稳定、安全、可维护的 Node.js 后端服务。

---

*最后更新时间: 2024-09-28*