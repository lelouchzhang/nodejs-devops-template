import logger from '../config/logger.js';
import { db } from '../config/database.js';
import { users } from '../models/user.model.js';
import { eq } from 'drizzle-orm';

/**
 * 获取所有用户服务
 * 
 * @description 从数据库获取所有用户的信息（不包含密码）
 * @returns {Promise<Array>} 用户列表
 */
export const getAllUsers = async () => {
  try {
    logger.info('开始获取所有用户列表');

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .orderBy(users.created_at); // 按创建时间排序

    logger.info(`成功获取 ${allUsers.length} 个用户`);
    return allUsers;
  } catch (error) {
    logger.error('获取用户列表失败:', error);
    throw error;
  }
};

/**
 * 根据ID获取用户服务
 * 
 * @description 根据用户ID获取单个用户的详细信息
 * @param {number} id - 用户ID
 * @returns {Promise<Object>} 用户信息
 * @throws {Error} 用户不存在时抛出错误
 */
export const getUserById = async (id) => {
  try {
    logger.info(`开始获取用户信息 - ID: ${id}`);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      logger.warn(`用户不存在 - ID: ${id}`);
      throw new Error('User not found');
    }

    logger.info(`成功获取用户信息 - ${user.email} (ID: ${id})`);
    return user;
  } catch (error) {
    logger.error(`获取用户信息失败 - ID: ${id}:`, error);
    throw error;
  }
};

/**
 * 更新用户信息服务
 * 
 * @description 更新用户信息，包括邮箱唯一性检查
 * @param {number} id - 用户ID
 * @param {Object} updates - 更新数据
 * @param {string} [updates.name] - 新用户名
 * @param {string} [updates.email] - 新邮箱
 * @param {string} [updates.role] - 新角色
 * @returns {Promise<Object>} 更新后的用户信息
 * @throws {Error} 用户不存在或邮箱已被使用时抛出错误
 */
export const updateUser = async (id, updates) => {
  try {
    logger.info(`开始更新用户信息 - ID: ${id}`, { updates });

    // 1. 检查用户是否存在
    const existingUser = await getUserById(id);

    // 2. 如果要更新邮箱，检查新邮箱是否已被其他用户使用
    if (updates.email && updates.email !== existingUser.email) {
      logger.info(`检查邮箱唯一性 - 新邮箱: ${updates.email}`);
      
      const [emailExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, updates.email))
        .limit(1);

      if (emailExists) {
        logger.warn(`邮箱已存在 - ${updates.email} (属于用户ID: ${emailExists.id})`);
        throw new Error('Email already exists');
      }
    }

    // 3. 准备更新数据，添加更新时间戳
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };

    // 4. 执行更新操作
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`用户信息更新成功 - ${updatedUser.email} (ID: ${id})`);
    return updatedUser;
  } catch (error) {
    logger.error(`更新用户信息失败 - ID: ${id}:`, error);
    throw error;
  }
};

/**
 * 删除用户服务
 * 
 * @description 删除指定ID的用户
 * @param {number} id - 用户ID
 * @returns {Promise<Object>} 被删除的用户信息
 * @throws {Error} 用户不存在时抛出错误
 */
export const deleteUser = async (id) => {
  try {
    logger.info(`开始删除用户 - ID: ${id}`);

    // 1. 检查用户是否存在
    await getUserById(id);

    // 2. 执行删除操作
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
      });

    logger.info(`用户删除成功 - ${deletedUser.email} (ID: ${id})`);
    return deletedUser;
  } catch (error) {
    logger.error(`删除用户失败 - ID: ${id}:`, error);
    throw error;
  }
};

/**
 * 根据邮箱获取用户服务 (内部使用)
 * 
 * @description 根据邮箱获取用户信息，主要用于内部验证
 * @param {string} email - 用户邮箱
 * @returns {Promise<Object|null>} 用户信息或null
 */
export const getUserByEmail = async (email) => {
  try {
    logger.info(`根据邮箱获取用户信息 - ${email}`);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      logger.info(`找到用户 - ${user.email} (ID: ${user.id})`);
    } else {
      logger.info(`未找到邮箱为 ${email} 的用户`);
    }

    return user || null;
  } catch (error) {
    logger.error(`根据邮箱获取用户信息失败 - ${email}:`, error);
    throw error;
  }
};

/**
 * 获取用户数量统计服务
 * 
 * @description 获取系统中用户的统计信息
 * @returns {Promise<Object>} 用户统计信息
 */
export const getUserCount = async () => {
  try {
    logger.info('开始获取用户统计信息');

    const allUsers = await getAllUsers();
    
    // 按角色统计用户数量
    const roleStats = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // 计算最近注册的用户数量 (30天内)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = allUsers.filter(user => 
      new Date(user.created_at) > thirtyDaysAgo
    );

    const stats = {
      totalUsers: allUsers.length,
      roleDistribution: roleStats,
      recentRegistrations: recentUsers.length,
      oldestUser: allUsers.length > 0 ? allUsers[0] : null,
      newestUser: allUsers.length > 0 ? allUsers[allUsers.length - 1] : null,
    };

    logger.info('用户统计信息获取成功', stats);
    return stats;
  } catch (error) {
    logger.error('获取用户统计信息失败:', error);
    throw error;
  }
};

/**
 * 批量删除用户服务 (可选功能)
 * 
 * @description 批量删除多个用户，通常用于管理员批量操作
 * @param {Array<number>} userIds - 要删除的用户ID数组
 * @returns {Promise<Array>} 被删除的用户列表
 */
export const deleteMultipleUsers = async (userIds) => {
  try {
    logger.info(`开始批量删除用户`, { userIds });

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('Invalid user IDs provided');
    }

    // 获取要删除的用户信息 (用于日志记录)
    const usersToDelete = await Promise.all(
      userIds.map(id => getUserById(id))
    );

    // 执行批量删除
    const deletedUsers = await db
      .delete(users)
      .where(
        // 构建 WHERE id IN (id1, id2, ...) 条件
        userIds.reduce((condition, id, index) => {
          const newCondition = eq(users.id, id);
          return index === 0 ? newCondition : or(condition, newCondition);
        })
      )
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    logger.info(`批量删除用户成功 - 共删除 ${deletedUsers.length} 个用户`);
    return deletedUsers;
  } catch (error) {
    logger.error('批量删除用户失败:', error);
    throw error;
  }
};

/**
 * 更新用户角色服务 (管理员专用)
 * 
 * @description 批量更新用户角色，仅管理员可用
 * @param {Array<{id: number, role: string}>} updates - 角色更新列表
 * @returns {Promise<Array>} 更新后的用户列表
 */
export const updateUserRoles = async (updates) => {
  try {
    logger.info('开始批量更新用户角色', { updates });

    const updatedUsers = [];

    // 逐个更新用户角色
    for (const { id, role } of updates) {
      const updatedUser = await updateUser(id, { role });
      updatedUsers.push(updatedUser);
    }

    logger.info(`批量更新用户角色成功 - 共更新 ${updatedUsers.length} 个用户`);
    return updatedUsers;
  } catch (error) {
    logger.error('批量更新用户角色失败:', error);
    throw error;
  }
};

/* 
使用示例:

在控制器中调用这些服务:

import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserCount
} from './users.service.js';

// 获取所有用户
const users = await getAllUsers();

// 获取特定用户
const user = await getUserById(123);

// 更新用户信息
const updatedUser = await updateUser(123, {
  name: '新名字',
  email: 'new@email.com'
});

// 删除用户
const deletedUser = await deleteUser(123);

// 获取统计信息
const stats = await getUserCount();

错误处理:

try {
  const user = await getUserById(999);
} catch (error) {
  if (error.message === 'User not found') {
    // 处理用户不存在的情况
  } else {
    // 处理其他错误
    throw error;
  }
}

*/