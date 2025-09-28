import logger from '../config/logger.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from './users.service.js';
import {
  userIdSchema,
  updateUserSchema,
} from './users.validation.js';
import { formatValidationError } from '../utils/format.js';

/**
 * 获取所有用户控制器
 * GET /api/users
 * 
 * @description 获取系统中所有用户的列表，仅管理员可访问
 * @middleware authenticateToken - 需要认证
 * @middleware requireAdmin - 需要管理员权限
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 * 
 * @returns {200} 成功返回用户列表
 * @returns {401} 未认证
 * @returns {403} 权限不足
 * @returns {500} 服务器错误
 */
export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info(`管理员 ${req.user.email} 正在获取所有用户列表`);

    // 调用服务层获取所有用户
    const allUsers = await getAllUsers();

    logger.info(`成功获取 ${allUsers.length} 个用户`);

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '成功获取用户列表',
      data: {
        users: allUsers,
        count: allUsers.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`获取用户列表失败: ${error.message}`);
    next(error);
  }
};

/**
 * 根据ID获取用户控制器
 * GET /api/users/:id
 * 
 * @description 获取特定用户的详细信息
 * @middleware authenticateToken - 需要认证
 * @middleware requireOwnership - 用户只能查看自己的信息，管理员可查看任何用户
 * 
 * @param {Object} req - Express请求对象
 * @param {string} req.params.id - 用户ID
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 * 
 * @returns {200} 成功返回用户信息
 * @returns {400} 请求参数无效
 * @returns {401} 未认证
 * @returns {403} 权限不足
 * @returns {404} 用户不存在
 * @returns {500} 服务器错误
 */
export const fetchUserById = async (req, res, next) => {
  try {
    logger.info(`获取用户信息 - ID: ${req.params.id}, 请求者: ${req.user.email}`);

    // 1. 验证用户ID参数
    const validationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: '用户ID格式无效',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // 2. 调用服务层获取用户信息
    const user = await getUserById(id);

    logger.info(`成功获取用户 ${user.email} 的信息`);

    // 3. 返回用户信息
    res.status(200).json({
      success: true,
      message: '成功获取用户信息',
      data: {
        user,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`获取用户信息失败: ${error.message}`);

    // 处理用户不存在的情况
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: '用户不存在'
      });
    }

    next(error);
  }
};

/**
 * 更新用户信息控制器
 * PUT /api/users/:id
 * 
 * @description 更新用户信息，包含权限控制和数据验证
 * @middleware authenticateToken - 需要认证
 * @middleware requireOwnership - 用户只能更新自己的信息，管理员可更新任何用户
 * 
 * @param {Object} req - Express请求对象
 * @param {string} req.params.id - 用户ID
 * @param {Object} req.body - 更新数据
 * @param {string} [req.body.name] - 用户姓名
 * @param {string} [req.body.email] - 用户邮箱
 * @param {string} [req.body.role] - 用户角色 (仅管理员可修改)
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 * 
 * @returns {200} 成功更新用户信息
 * @returns {400} 请求数据无效
 * @returns {401} 未认证
 * @returns {403} 权限不足
 * @returns {404} 用户不存在
 * @returns {409} 邮箱已存在
 * @returns {500} 服务器错误
 */
export const updateUserById = async (req, res, next) => {
  try {
    logger.info(`更新用户信息 - ID: ${req.params.id}, 请求者: ${req.user.email}`);

    // 1. 验证用户ID参数
    const idValidationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!idValidationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: '用户ID格式无效',
        details: formatValidationError(idValidationResult.error),
      });
    }

    // 2. 验证更新数据
    const updateValidationResult = updateUserSchema.safeParse(req.body);

    if (!updateValidationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: '更新数据格式无效',
        details: formatValidationError(updateValidationResult.error),
      });
    }

    const { id } = idValidationResult.data;
    const updates = updateValidationResult.data;

    // 3. 权限控制检查
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: '您必须登录才能更新用户信息',
      });
    }

    // 4. 检查是否允许更新此用户 (用户只能更新自己的信息，管理员可以更新任何用户)
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: '您只能更新自己的信息',
      });
    }

    // 5. 角色权限检查 (只有管理员可以修改用户角色)
    if (updates.role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: '只有管理员可以修改用户角色',
      });
    }

    // 6. 如果非管理员用户尝试更新自己的信息，移除角色字段
    if (req.user.role !== 'admin') {
      delete updates.role;
      logger.info(`非管理员用户 ${req.user.email} 更新个人信息，已移除角色字段`);
    }

    // 7. 调用服务层更新用户
    const updatedUser = await updateUser(id, updates);

    logger.info(`用户 ${updatedUser.email} 信息更新成功`);

    // 8. 返回更新后的用户信息
    res.status(200).json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: updatedUser,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`更新用户信息失败: ${error.message}`);

    // 处理特定业务错误
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: '用户不存在'
      });
    }

    if (error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        message: '该邮箱已被其他用户使用'
      });
    }

    next(error);
  }
};

/**
 * 删除用户控制器
 * DELETE /api/users/:id
 * 
 * @description 删除用户，仅管理员可执行，且不能删除自己
 * @middleware authenticateToken - 需要认证
 * @middleware requireAdmin - 需要管理员权限
 * 
 * @param {Object} req - Express请求对象
 * @param {string} req.params.id - 用户ID
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 * 
 * @returns {200} 成功删除用户
 * @returns {400} 请求参数无效
 * @returns {401} 未认证
 * @returns {403} 权限不足或试图删除自己
 * @returns {404} 用户不存在
 * @returns {500} 服务器错误
 */
export const deleteUserById = async (req, res, next) => {
  try {
    logger.info(`删除用户 - ID: ${req.params.id}, 操作者: ${req.user.email}`);

    // 1. 验证用户ID参数
    const validationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: '用户ID格式无效',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // 2. 权限检查
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: '您必须登录才能删除用户',
      });
    }

    // 3. 只有管理员可以删除用户
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: '只有管理员可以删除用户',
      });
    }

    // 4. 防止管理员删除自己
    if (req.user.id === id) {
      return res.status(403).json({
        success: false,
        error: 'Operation denied',
        message: '您不能删除自己的账户',
      });
    }

    // 5. 调用服务层删除用户
    const deletedUser = await deleteUser(id);

    logger.info(`用户 ${deletedUser.email} 已被管理员 ${req.user.email} 删除`);

    // 6. 返回删除成功响应
    res.status(200).json({
      success: true,
      message: '用户删除成功',
      data: {
        deletedUser: {
          id: deletedUser.id,
          name: deletedUser.name,
          email: deletedUser.email,
          role: deletedUser.role
        },
        timestamp: new Date().toISOString(),
        deletedBy: {
          id: req.user.id,
          email: req.user.email
        }
      }
    });
  } catch (error) {
    logger.error(`删除用户失败: ${error.message}`);

    // 处理用户不存在的情况
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: '要删除的用户不存在'
      });
    }

    next(error);
  }
};

/**
 * 获取用户统计信息控制器 (可选功能)
 * GET /api/users/stats
 * 
 * @description 获取用户统计信息，仅管理员可访问
 * @middleware authenticateToken - 需要认证
 * @middleware requireAdmin - 需要管理员权限
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
export const getUserStats = async (req, res, next) => {
  try {
    logger.info(`管理员 ${req.user.email} 获取用户统计信息`);

    const allUsers = await getAllUsers();
    
    // 统计不同角色的用户数量
    const stats = allUsers.reduce((acc, user) => {
      acc.total += 1;
      acc.byRole[user.role] = (acc.byRole[user.role] || 0) + 1;
      return acc;
    }, {
      total: 0,
      byRole: {}
    });

    // 计算最近注册的用户 (最近30天)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = allUsers.filter(user => 
      new Date(user.created_at) > thirtyDaysAgo
    ).length;

    res.status(200).json({
      success: true,
      message: '成功获取用户统计信息',
      data: {
        stats: {
          totalUsers: stats.total,
          usersByRole: stats.byRole,
          recentRegistrations: recentUsers,
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error(`获取用户统计信息失败: ${error.message}`);
    next(error);
  }
};

/* 
使用示例:

在路由文件中:

import express from 'express';
import {
  fetchAllUsers,
  fetchUserById, 
  updateUserById,
  deleteUserById,
  getUserStats
} from './users.controller.js';
import { authenticateToken, requireAdmin, requireOwnership } from '../auth/auth.middleware.js';

const router = express.Router();

// 获取所有用户 (仅管理员)
router.get('/', authenticateToken, requireAdmin, fetchAllUsers);

// 获取用户统计 (仅管理员)
router.get('/stats', authenticateToken, requireAdmin, getUserStats);

// 获取特定用户 (用户可查看自己，管理员可查看任何人)
router.get('/:id', authenticateToken, requireOwnership('id'), fetchUserById);

// 更新用户信息 (用户可更新自己，管理员可更新任何人)
router.put('/:id', authenticateToken, requireOwnership('id'), updateUserById);

// 删除用户 (仅管理员)
router.delete('/:id', authenticateToken, requireAdmin, deleteUserById);

API 调用示例:

1. 获取所有用户:
GET /api/users
Cookie: token=...
Authorization: admin required

2. 获取特定用户:
GET /api/users/123
Cookie: token=...

3. 更新用户信息:
PUT /api/users/123
Cookie: token=...
Content-Type: application/json

{
  "name": "新名字",
  "email": "new@email.com"
}

4. 删除用户:
DELETE /api/users/123
Cookie: token=...
Authorization: admin required

*/