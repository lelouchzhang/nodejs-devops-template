import logger from '../config/logger.js';
import { jwttoken } from '../utils/jwt.js';

/**
 * JWT 令牌认证中间件
 * 
 * @description 验证请求中的JWT令牌，确保用户已认证
 * 从Cookie中提取JWT令牌，验证其有效性，并将用户信息附加到请求对象
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象  
 * @param {Function} next - Express下一个中间件函数
 */
export const authenticateToken = (req, res, next) => {
  try {
    // 1. 从Cookie中获取JWT令牌
    const token = req.cookies.token;

    // 2. 检查令牌是否存在
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: '访问此资源需要登录',
        code: 'NO_TOKEN'
      });
    }

    // 3. 验证JWT令牌
    const decoded = jwttoken.verify(token);

    // 4. 将解码后的用户信息附加到请求对象
    req.user = decoded;

    // 5. 记录认证成功日志
    logger.info(`用户认证成功: ${decoded.email} (${decoded.role})`);

    // 6. 继续到下一个中间件
    next();
  } catch (error) {
    logger.error('认证失败:', error);

    // 处理具体的认证错误
    if (error.message === 'Failed to authenticate token') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: '登录令牌无效或已过期',
        code: 'INVALID_TOKEN'
      });
    }

    // 处理JWT相关错误
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: '登录令牌格式错误',
        code: 'MALFORMED_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Authentication failed', 
        message: '登录令牌已过期，请重新登录',
        code: 'EXPIRED_TOKEN'
      });
    }

    // 其他认证错误
    return res.status(500).json({
      error: 'Internal server error',
      message: '认证过程中发生错误',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * 角色权限检查中间件生成器
 * 
 * @description 创建一个中间件函数，检查用户是否具有所需的角色权限
 * 必须在 authenticateToken 中间件之后使用
 * 
 * @param {string|Array} allowedRoles - 允许访问的角色，可以是字符串或数组
 * @returns {Function} Express中间件函数
 */
export const requireRole = (allowedRoles) => {
  // 确保 allowedRoles 是数组格式
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    try {
      // 1. 检查用户是否已认证
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: '用户未认证',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // 2. 检查用户角色是否在允许的角色列表中
      if (!roles.includes(req.user.role)) {
        logger.warn(
          `访问被拒绝 - 用户 ${req.user.email} (角色: ${req.user.role}) 尝试访问需要角色 ${roles.join(', ')} 的资源`
        );

        return res.status(403).json({
          error: 'Access denied',
          message: '您没有权限访问此资源',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: roles,
          current: req.user.role
        });
      }

      // 3. 权限检查通过，继续到下一个中间件
      logger.info(`权限检查通过 - 用户 ${req.user.email} (角色: ${req.user.role}) 访问需要角色 ${roles.join(', ')} 的资源`);
      next();
    } catch (error) {
      logger.error('角色权限检查错误:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: '权限检查过程中发生错误',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * 管理员权限检查中间件
 * 
 * @description 快捷方式，检查用户是否为管理员
 * 等同于 requireRole(['admin'])
 */
export const requireAdmin = requireRole(['admin']);

/**
 * 用户权限检查中间件 (包含管理员)
 * 
 * @description 快捷方式，检查用户是否为普通用户或管理员
 * 等同于 requireRole(['user', 'admin'])
 */
export const requireUser = requireRole(['user', 'admin']);

/**
 * 资源所有权检查中间件生成器
 * 
 * @description 检查当前用户是否为资源的所有者，或者是管理员
 * 用于需要检查用户是否可以操作特定资源的场景
 * 
 * @param {string} resourceIdParam - 资源ID在req.params中的键名 (如 'id', 'userId')
 * @returns {Function} Express中间件函数
 */
export const requireOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    try {
      // 1. 检查用户是否已认证
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: '用户未认证',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // 2. 获取资源ID
      const resourceId = parseInt(req.params[resourceIdParam]);
      
      if (!resourceId || isNaN(resourceId)) {
        return res.status(400).json({
          error: 'Invalid resource ID',
          message: '资源ID无效',
          code: 'INVALID_RESOURCE_ID'
        });
      }

      // 3. 管理员可以访问任何资源
      if (req.user.role === 'admin') {
        logger.info(`管理员 ${req.user.email} 访问资源 ${resourceId}`);
        return next();
      }

      // 4. 普通用户只能访问自己的资源
      if (req.user.id === resourceId) {
        logger.info(`用户 ${req.user.email} 访问自己的资源 ${resourceId}`);
        return next();
      }

      // 5. 访问被拒绝
      logger.warn(`访问被拒绝 - 用户 ${req.user.email} (ID: ${req.user.id}) 尝试访问资源 ${resourceId}`);
      
      return res.status(403).json({
        error: 'Access denied',
        message: '您只能访问自己的资源',
        code: 'NOT_RESOURCE_OWNER'
      });
    } catch (error) {
      logger.error('资源所有权检查错误:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: '权限检查过程中发生错误',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

/**
 * 可选认证中间件
 * 
 * @description 如果提供了令牌则进行认证，但不强制要求认证
 * 用于某些既可以匿名访问又可以认证访问的端点
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
export const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies.token;

    // 如果没有令牌，直接继续 (匿名访问)
    if (!token) {
      return next();
    }

    try {
      // 如果有令牌，尝试验证
      const decoded = jwttoken.verify(token);
      req.user = decoded;
      
      logger.info(`可选认证成功: ${decoded.email} (${decoded.role})`);
    } catch (tokenError) {
      // 令牌无效时不阻止请求，但记录日志
      logger.warn('可选认证 - 令牌无效:', tokenError.message);
    }

    next();
  } catch (error) {
    logger.error('可选认证中间件错误:', error);
    // 不阻止请求继续
    next();
  }
};

/* 
使用示例:

在路由中使用这些中间件:

import express from 'express';
import { 
  authenticateToken, 
  requireRole, 
  requireAdmin, 
  requireOwnership 
} from './auth.middleware.js';

const router = express.Router();

// 需要认证的路由
router.get('/profile', authenticateToken, getProfile);

// 需要管理员权限的路由
router.get('/admin/users', authenticateToken, requireAdmin, getAllUsers);

// 需要特定角色权限的路由
router.post('/admin/posts', authenticateToken, requireRole(['admin', 'editor']), createPost);

// 需要资源所有权检查的路由 (用户只能操作自己的资源)
router.put('/users/:id', authenticateToken, requireOwnership('id'), updateUser);

// 可选认证的路由 (既支持匿名访问又支持认证访问)
router.get('/posts', optionalAuth, getPosts);

// 复合使用示例
router.delete('/users/:id', 
  authenticateToken,      // 必须认证
  requireAdmin,          // 必须是管理员
  deleteUser            // 控制器函数
);

// 错误响应示例:

认证失败响应:
{
  "error": "Authentication failed",
  "message": "登录令牌无效或已过期",
  "code": "INVALID_TOKEN"
}

权限不足响应:
{
  "error": "Access denied", 
  "message": "您没有权限访问此资源",
  "code": "INSUFFICIENT_PERMISSIONS",
  "required": ["admin"],
  "current": "user"
}

*/