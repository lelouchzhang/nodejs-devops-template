import express from 'express';
import {
  fetchAllUsers,
  fetchUserById,
  updateUserById,
  deleteUserById,
  getUserStats,
} from './users.controller.js';
import { 
  authenticateToken, 
  requireRole, 
  requireAdmin, 
  requireOwnership 
} from '../auth/auth.middleware.js';

/**
 * 用户管理路由配置
 * 
 * @description 定义所有与用户CRUD操作相关的路由端点
 * 包括获取、更新、删除用户信息，以及用户统计等功能
 */
const router = express.Router();

/**
 * 获取用户统计信息路由
 * GET /api/users/stats
 * 
 * @description 获取系统用户的统计信息，包括总数、角色分布等
 * @middleware authenticateToken - 需要认证
 * @middleware requireAdmin - 需要管理员权限
 * 
 * 注意：这个路由必须放在 /:id 路由之前，否则 'stats' 会被当作用户ID
 * 
 * @returns {200} 成功返回统计信息
 * @returns {401} 未认证
 * @returns {403} 权限不足
 * @returns {500} 服务器错误
 */
router.get('/stats', authenticateToken, requireAdmin, getUserStats);

/**
 * 获取所有用户路由
 * GET /api/users
 * 
 * @description 获取系统中所有用户的列表，仅管理员可访问
 * @middleware authenticateToken - 需要认证
 * @middleware requireAdmin - 需要管理员权限
 * 
 * @returns {200} 成功返回用户列表
 * @returns {401} 未认证
 * @returns {403} 权限不足 (非管理员)
 * @returns {500} 服务器错误
 */
router.get('/', authenticateToken, requireAdmin, fetchAllUsers);

/**
 * 根据ID获取用户路由
 * GET /api/users/:id
 * 
 * @description 获取特定用户的详细信息
 * @middleware authenticateToken - 需要认证
 * @middleware requireOwnership - 用户只能查看自己的信息，管理员可查看任何用户
 * 
 * @param {string} id - 用户ID (路径参数)
 * 
 * @returns {200} 成功返回用户信息
 * @returns {400} 用户ID格式无效
 * @returns {401} 未认证
 * @returns {403} 权限不足 (用户尝试查看他人信息)
 * @returns {404} 用户不存在
 * @returns {500} 服务器错误
 */
router.get('/:id', authenticateToken, requireOwnership('id'), fetchUserById);

/**
 * 更新用户信息路由
 * PUT /api/users/:id
 * 
 * @description 更新用户信息，支持细粒度的权限控制
 * @middleware authenticateToken - 需要认证
 * @middleware requireOwnership - 用户只能更新自己的信息，管理员可更新任何用户
 * 
 * @param {string} id - 用户ID (路径参数)
 * @body {string} [name] - 新的用户姓名
 * @body {string} [email] - 新的用户邮箱
 * @body {string} [role] - 新的用户角色 (仅管理员可修改)
 * 
 * 权限说明:
 * - 用户可以更新自己的姓名和邮箱
 * - 用户不能修改自己的角色
 * - 管理员可以更新任何用户的所有信息
 * - 管理员可以修改任何用户的角色
 * 
 * @returns {200} 成功更新用户信息
 * @returns {400} 请求数据格式无效
 * @returns {401} 未认证
 * @returns {403} 权限不足 (用户尝试更新他人信息或修改角色)
 * @returns {404} 用户不存在
 * @returns {409} 邮箱已被其他用户使用
 * @returns {500} 服务器错误
 */
router.put('/:id', authenticateToken, requireOwnership('id'), updateUserById);

/**
 * 删除用户路由
 * DELETE /api/users/:id
 * 
 * @description 删除指定用户，仅管理员可执行，且不能删除自己
 * @middleware authenticateToken - 需要认证
 * @middleware requireAdmin - 需要管理员权限
 * 
 * @param {string} id - 用户ID (路径参数)
 * 
 * 安全限制:
 * - 只有管理员可以删除用户
 * - 管理员不能删除自己的账户
 * 
 * @returns {200} 成功删除用户
 * @returns {400} 用户ID格式无效
 * @returns {401} 未认证
 * @returns {403} 权限不足 (非管理员) 或 操作被拒绝 (尝试删除自己)
 * @returns {404} 用户不存在
 * @returns {500} 服务器错误
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUserById);

export default router;

/* 
路由使用示例:

在主应用文件 (app.js) 中:

import express from 'express';
import cookieParser from 'cookie-parser';
import usersRoutes from './routes/users.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

// 中间件设置
app.use(express.json());
app.use(cookieParser());

// 路由设置
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

API 调用示例:

1. 获取所有用户 (管理员权限):
GET /api/users
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

响应:
{
  "success": true,
  "message": "成功获取用户列表",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "管理员",
        "email": "admin@example.com",
        "role": "admin",
        "created_at": "2024-01-01T00:00:00.000Z"
      },
      ...
    ],
    "count": 10
  }
}

2. 获取特定用户 (本人或管理员):
GET /api/users/123
Cookie: token=...

响应:
{
  "success": true,
  "message": "成功获取用户信息",
  "data": {
    "user": {
      "id": 123,
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "user",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}

3. 更新用户信息:
PUT /api/users/123
Cookie: token=...
Content-Type: application/json

{
  "name": "张三丰",
  "email": "zhangsanfeng@example.com"
}

响应:
{
  "success": true,
  "message": "用户信息更新成功",
  "data": {
    "user": {
      "id": 123,
      "name": "张三丰",
      "email": "zhangsanfeng@example.com",
      "role": "user",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  }
}

4. 删除用户 (管理员权限):
DELETE /api/users/123
Cookie: token=...

响应:
{
  "success": true,
  "message": "用户删除成功",
  "data": {
    "deletedUser": {
      "id": 123,
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "user"
    },
    "deletedBy": {
      "id": 1,
      "email": "admin@example.com"
    }
  }
}

5. 获取用户统计 (管理员权限):
GET /api/users/stats
Cookie: token=...

响应:
{
  "success": true,
  "message": "成功获取用户统计信息",
  "data": {
    "stats": {
      "totalUsers": 10,
      "usersByRole": {
        "user": 8,
        "admin": 2
      },
      "recentRegistrations": 3
    }
  }
}

错误响应示例:

权限不足:
{
  "success": false,
  "error": "Access denied",
  "message": "您只能查看自己的信息"
}

用户不存在:
{
  "success": false,
  "error": "User not found",
  "message": "用户不存在"
}

验证失败:
{
  "success": false,
  "error": "Validation failed",
  "message": "用户ID格式无效",
  "details": "ID must be a valid number"
}

*/