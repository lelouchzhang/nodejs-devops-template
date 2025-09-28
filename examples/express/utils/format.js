/**
 * 数据格式化工具函数
 * 
 * @description 提供各种数据格式化功能，包括验证错误格式化、日期格式化等
 */

/**
 * 格式化Zod验证错误
 * 
 * @description 将Zod验证错误转换为用户友好的错误信息
 * @param {Object} errors - Zod验证错误对象
 * @returns {string} 格式化后的错误信息
 */
export const formatValidationError = errors => {
  if (!errors || !errors.issues) return 'Validation failed';

  if (Array.isArray(errors.issues)) {
    return errors.issues.map(issue => issue.message).join(', ');
  }

  return JSON.stringify(errors);
};

/**
 * 格式化用户信息（移除敏感数据）
 * 
 * @description 从用户对象中移除密码等敏感信息
 * @param {Object} user - 用户对象
 * @returns {Object} 安全的用户信息
 */
export const formatUserResponse = (user) => {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
};

/**
 * 格式化日期为ISO字符串
 * 
 * @description 将日期对象转换为ISO格式的字符串
 * @param {Date} date - 日期对象
 * @returns {string|null} ISO格式的日期字符串或null
 */
export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * 格式化API响应数据
 * 
 * @description 标准化API响应格式
 * @param {boolean} success - 是否成功
 * @param {string} message - 响应消息
 * @param {any} data - 响应数据
 * @param {any} error - 错误信息
 * @returns {Object} 标准化的响应对象
 */
export const formatApiResponse = (success, message, data = null, error = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (error !== null) {
    response.error = error;
  }

  return response;
};

/**
 * 格式化错误信息（用于日志记录）
 * 
 * @description 将错误对象格式化为便于日志记录的格式
 * @param {Error} error - 错误对象
 * @param {Object} [context] - 额外的上下文信息
 * @returns {Object} 格式化的错误信息
 */
export const formatErrorForLogging = (error, context = {}) => {
  return {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    timestamp: new Date().toISOString(),
    ...context
  };
};