import logger from '../config/logger.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../models/user.model.js';

/**
 * 密码加密函数
 * 
 * @description 使用bcrypt对密码进行加密处理
 * @param {string} password - 原始密码
 * @returns {Promise<string>} 加密后的密码哈希值
 */
export const hashPassword = async password => {
  try {
    // 使用10轮加盐加密，安全性和性能的平衡点
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error(`加密密码时发生错误: ${error}`);
    throw new Error('Password hashing failed');
  }
};

/**
 * 密码验证函数
 * 
 * @description 验证原始密码与加密密码是否匹配
 * @param {string} password - 原始密码
 * @param {string} hashedPassword - 加密后的密码哈希值
 * @returns {Promise<boolean>} 密码是否匹配
 */
export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error(`密码验证过程发生错误: ${error}`);
    throw new Error('Password comparison failed');
  }
};

/**
 * 创建新用户服务
 * 
 * @description 创建新用户，包括邮箱唯一性检查和密码加密
 * @param {Object} userData - 用户数据
 * @param {string} userData.name - 用户姓名
 * @param {string} userData.email - 用户邮箱
 * @param {string} userData.password - 用户密码
 * @param {string} [userData.role='user'] - 用户角色
 * @returns {Promise<Object>} 创建的用户信息（不含密码）
 */
export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    // 1. 检查邮箱是否已存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // 2. 加密密码
    const hashedPassword = await hashPassword(password);

    // 3. 创建新用户记录
    const [newUser] = await db
      .insert(users)
      .values({ 
        name, 
        email, 
        password: hashedPassword, 
        role 
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      });

    // 4. 记录日志
    logger.info(`用户 ${newUser.email} 注册成功!`);

    return newUser;
  } catch (error) {
    logger.error(`创建新用户时发生错误: ${error}`);
    throw error;
  }
};

/**
 * 用户身份验证服务
 * 
 * @description 验证用户登录凭据（邮箱和密码）
 * @param {Object} credentials - 登录凭据
 * @param {string} credentials.email - 用户邮箱
 * @param {string} credentials.password - 用户密码
 * @returns {Promise<Object>} 验证通过的用户信息（不含密码）
 */
export const authenticateUser = async ({ email, password }) => {
  try {
    // 1. 根据邮箱查找用户
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // 2. 检查用户是否存在
    if (!existingUser) {
      throw new Error('User not found');
    }

    // 3. 验证密码
    const isPasswordValid = await comparePassword(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // 4. 记录登录日志
    logger.info(`用户 ${existingUser.email} 登录成功!`);

    // 5. 返回用户信息（不包含密码）
    return {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      created_at: existingUser.created_at,
    };
  } catch (error) {
    logger.error(`用户认证失败: ${error}`);
    throw error;
  }
};

/**
 * 根据ID获取用户信息服务
 * 
 * @description 通过用户ID获取用户信息，用于JWT令牌验证后获取完整用户信息
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 用户信息（不含密码）
 */
export const getUserById = async (userId) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    logger.error(`获取用户信息失败: ${error}`);
    throw error;
  }
};

/**
 * 检查用户是否存在服务
 * 
 * @description 根据邮箱检查用户是否已存在
 * @param {string} email - 用户邮箱
 * @returns {Promise<boolean>} 用户是否存在
 */
export const userExists = async (email) => {
  try {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return !!existingUser;
  } catch (error) {
    logger.error(`检查用户是否存在时发生错误: ${error}`);
    throw error;
  }
};

/**
 * 更新用户最后登录时间服务
 * 
 * @description 更新用户的最后登录时间戳
 * @param {number} userId - 用户ID
 * @returns {Promise<void>}
 */
export const updateLastLogin = async (userId) => {
  try {
    await db
      .update(users)
      .set({ 
        updated_at: new Date(),
        // 如果有 last_login 字段，也可以更新
        // last_login: new Date()
      })
      .where(eq(users.id, userId));

    logger.info(`更新用户 ${userId} 最后登录时间`);
  } catch (error) {
    logger.error(`更新最后登录时间失败: ${error}`);
    // 这个错误不应该阻止登录流程，所以不抛出异常
  }
};