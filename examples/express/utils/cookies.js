/**
 * Cookie管理工具
 * 
 * @description 提供安全的Cookie操作功能，包括设置、获取和清除Cookie
 */
export const cookies = {
  /**
   * 获取Cookie默认选项
   * 
   * @description 返回安全的Cookie配置选项
   * @returns {Object} Cookie配置选项
   */
  getOptions: () => ({
    // 防止JavaScript访问，只能通过HTTP传输（防止XSS攻击）
    httpOnly: true,
    // 仅在HTTPS连接中传输（生产环境）
    secure: process.env.NODE_ENV === 'production',
    // 同源策略，防止CSRF攻击
    sameSite: 'strict',
    // Cookie有效期：15分钟
    maxAge: 15 * 60 * 1000,
    // Cookie路径
    path: '/',
  }),

  /**
   * 设置Cookie
   * 
   * @param {Object} res - Express响应对象
   * @param {string} name - Cookie名称
   * @param {string} value - Cookie值
   * @param {Object} options - 额外的Cookie选项
   */
  set: (res, name, value, options = {}) => {
    const finalOptions = { ...cookies.getOptions(), ...options };
    res.cookie(name, value, finalOptions);
  },

  /**
   * 清除Cookie
   * 
   * @param {Object} res - Express响应对象
   * @param {string} name - Cookie名称
   * @param {Object} options - 额外的Cookie选项
   */
  clear: (res, name, options = {}) => {
    const finalOptions = { ...cookies.getOptions(), ...options };
    res.clearCookie(name, finalOptions);
  },

  /**
   * 获取Cookie值
   * 
   * @param {Object} req - Express请求对象
   * @param {string} name - Cookie名称
   * @returns {string|undefined} Cookie值
   */
  get: (req, name) => {
    return req.cookies[name];
  },

  /**
   * 设置长期Cookie（用于记住登录状态）
   * 
   * @param {Object} res - Express响应对象
   * @param {string} name - Cookie名称
   * @param {string} value - Cookie值
   * @param {number} days - 有效天数，默认30天
   */
  setLongTerm: (res, name, value, days = 30) => {
    cookies.set(res, name, value, {
      maxAge: days * 24 * 60 * 60 * 1000, // 转换为毫秒
    });
  },

  /**
   * 设置会话Cookie（浏览器关闭时过期）
   * 
   * @param {Object} res - Express响应对象
   * @param {string} name - Cookie名称
   * @param {string} value - Cookie值
   */
  setSession: (res, name, value) => {
    cookies.set(res, name, value, {
      maxAge: undefined, // 不设置maxAge使其成为会话Cookie
    });
  },
};