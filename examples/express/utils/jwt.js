import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

/**
 * JWT配置
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-please-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * JWT工具对象
 * 
 * @description 提供JWT令牌的生成和验证功能
 */
export const jwttoken = {
  /**
   * 生成JWT令牌
   * 
   * @param {Object} payload - 令牌载荷数据
   * @returns {string} JWT令牌字符串
   */
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (error) {
      logger.error('Failed to sign token', error);
      throw new Error('Failed to authenticate token');
    }
  },

  /**
   * 验证JWT令牌
   * 
   * @param {string} token - JWT令牌字符串
   * @returns {Object} 解码后的载荷数据
   */
  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error('Failed to verify token', error);
      throw new Error('Failed to authenticate token');
    }
  },
};