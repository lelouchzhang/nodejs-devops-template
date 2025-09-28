import express from 'express';
import { signIn, signOut, signup, getCurrentUser } from './auth.controller.js';
import { authenticateToken } from './auth.middleware.js';

/**
 * 认证路由配置
 * 
 * @description 定义所有与用户认证相关的路由端点
 * 包括注册、登录、登出和获取当前用户信息
 */
const router = express.Router();

/**
 * 用户注册路由
 * POST /api/auth/sign-up
 * 
 * @description 用户注册端点，创建新用户账户
 * @body {string} name - 用户姓名 (2-255字符)
 * @body {string} email - 用户邮箱 (有效邮箱格式)
 * @body {string} password - 用户密码 (6-128字符)
 * @body {string} [role='user'] - 用户角色 (user|admin)
 * 
 * @returns {201} 注册成功，返回用户信息和JWT令牌
 * @returns {400} 请求数据验证失败
 * @returns {409} 邮箱已存在
 * @returns {500} 服务器内部错误
 */
router.post('/sign-up', signup);

/**
 * 用户登录路由
 * POST /api/auth/sign-in
 * 
 * @description 用户登录端点，验证凭据并生成访问令牌
 * @body {string} email - 用户邮箱
 * @body {string} password - 用户密码
 * 
 * @returns {200} 登录成功，返回用户信息和JWT令牌
 * @returns {400} 请求数据验证失败
 * @returns {401} 邮箱或密码错误
 * @returns {500} 服务器内部错误
 */
router.post('/sign-in', signIn);

/**
 * 用户登出路由
 * POST /api/auth/sign-out
 * 
 * @description 用户登出端点，清除认证令牌
 * @header {string} Cookie - 包含JWT令牌的Cookie
 * 
 * @returns {200} 登出成功
 * @returns {500} 服务器内部错误
 */
router.post('/sign-out', signOut);

/**
 * 获取当前用户信息路由
 * GET /api/auth/me
 * 
 * @description 获取当前已认证用户的信息
 * @middleware authenticateToken - 需要有效的JWT令牌
 * @header {string} Cookie - 包含JWT令牌的Cookie
 * 
 * @returns {200} 成功返回用户信息
 * @returns {401} 未认证或令牌无效
 * @returns {500} 服务器内部错误
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * 刷新令牌路由 (可选功能)
 * POST /api/auth/refresh
 * 
 * @description 刷新JWT访问令牌
 * @middleware authenticateToken - 需要有效的JWT令牌
 * @header {string} Cookie - 包含JWT令牌的Cookie
 * 
 * @returns {200} 成功返回新的JWT令牌
 * @returns {401} 未认证或令牌无效
 * @returns {500} 服务器内部错误
 */
// router.post('/refresh', authenticateToken, refreshToken);

/**
 * 验证令牌路由 (可选功能)
 * GET /api/auth/verify
 * 
 * @description 验证JWT令牌的有效性
 * @middleware authenticateToken - 需要有效的JWT令牌
 * @header {string} Cookie - 包含JWT令牌的Cookie
 * 
 * @returns {200} 令牌有效
 * @returns {401} 令牌无效或已过期
 * @returns {500} 服务器内部错误
 */
// router.get('/verify', authenticateToken, (req, res) => {
//   res.status(200).json({
//     message: 'Token is valid',
//     user: {
//       id: req.user.id,
//       email: req.user.email,
//       role: req.user.role
//     }
//   });
// });

export default router;

/* 
使用示例:

在主应用文件 (app.js) 中:

import express from 'express';
import authRoutes from './routes/auth.routes.js';

const app = express();

// 中间件设置
app.use(express.json());
app.use(cookieParser());

// 路由设置
app.use('/api/auth', authRoutes);

// 示例API调用:

1. 用户注册:
POST /api/auth/sign-up
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "securePassword123",
  "role": "user"
}

2. 用户登录:
POST /api/auth/sign-in
Content-Type: application/json

{
  "email": "zhangsan@example.com",
  "password": "securePassword123"
}

3. 获取当前用户:
GET /api/auth/me
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

4. 用户登出:
POST /api/auth/sign-out
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

*/