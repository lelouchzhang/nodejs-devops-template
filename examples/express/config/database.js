import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

/**
 * 数据库配置
 * 
 * @description 配置Neon Serverless数据库连接
 * 支持开发环境和生产环境的不同配置
 */

// 开发环境特殊配置
if (process.env.NODE_ENV === 'development') {
  // 如果使用本地Neon实例
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

// 验证必要的环境变量
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

/**
 * 创建数据库连接
 */
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

/**
 * 数据库连接测试函数
 * 
 * @description 测试数据库连接是否正常
 * @returns {Promise<boolean>} 连接是否成功
 */
export const testConnection = async () => {
  try {
    // 执行一个简单的查询来测试连接
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// 导出数据库实例
export { db, sql };