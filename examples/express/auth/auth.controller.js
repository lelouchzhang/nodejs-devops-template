import logger from '../config/logger.js';
import { signupSchema, signinSchema } from './auth.validation.js';
import { formatValidationError } from '../utils/format.js';
import { createUser, authenticateUser } from './auth.service.js';
import { jwttoken } from '../utils/jwt.js';
import { cookies } from '../utils/cookies.js';

/**
 * 用户注册控制器
 * POST /api/auth/sign-up
 * 
 * @description 处理用户注册请求，包括数据验证、用户创建和JWT令牌生成
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象  
 * @param {Function} next - Express下一个中间件函数
 */
export const signup = async (req, res, next) => {
  try {
    // 1. 数据验证 - 使用Zod验证请求体数据
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { name, email, password, role } = validationResult.data;

    // 2. 业务逻辑 - 创建新用户
    const user = await createUser({ name, email, password, role });

    // 3. 生成JWT令牌
    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 4. 设置安全Cookie
    cookies.set(res, 'token', token);

    // 5. 记录日志
    logger.info(`User registered successfully: ${email}`);

    // 6. 返回成功响应
    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // 错误处理
    logger.error('注册失败, 原因:', error);

    // 处理特定业务错误
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ 
        error: 'Email already exists',
        message: '该邮箱已被注册' 
      });
    }

    // 传递给全局错误处理中间件
    next(error);
  }
};

/**
 * 用户登录控制器
 * POST /api/auth/sign-in
 * 
 * @description 处理用户登录请求，验证凭据并生成访问令牌
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
export const signIn = async (req, res, next) => {
  try {
    // 1. 数据验证
    const validationResult = signinSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: '登录失败',
        details: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    // 2. 身份验证
    const user = await authenticateUser({ email, password });

    // 3. 生成JWT令牌
    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 4. 设置安全Cookie
    cookies.set(res, 'token', token);

    // 5. 记录日志
    logger.info(`User signed in successfully: ${email}`);

    // 6. 返回成功响应
    res.status(200).json({
      message: '用户登录成功!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // 错误处理
    logger.error('Sign in error', error);

    // 处理认证失败
    if (error.message === 'User not found' || error.message === 'Invalid password') {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: '邮箱或密码错误' 
      });
    }

    next(error);
  }
};

/**
 * 用户登出控制器
 * POST /api/auth/sign-out
 * 
 * @description 处理用户登出请求，清除认证令牌
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
export const signOut = async (req, res, next) => {
  try {
    // 1. 清除Cookie中的JWT令牌
    cookies.clear(res, 'token');

    // 2. 记录日志
    logger.info('User signed out successfully');

    // 3. 返回成功响应
    res.status(200).json({
      message: '登出成功',
    });
  } catch (error) {
    logger.error('登出失败!', error);
    next(error);
  }
};

/**
 * 获取当前用户信息
 * GET /api/auth/me
 * 
 * @description 返回当前已认证用户的信息
 * @param {Object} req - Express请求对象 (需要包含用户信息)
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    // req.user 由认证中间件设置
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: '请先登录'
      });
    }

    // 返回用户信息 (不包含敏感数据)
    res.status(200).json({
      message: '获取用户信息成功',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      }
    });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    next(error);
  }
};