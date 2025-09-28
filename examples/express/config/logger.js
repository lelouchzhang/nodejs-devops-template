import winston from 'winston';

/**
 * Winston日志配置
 * 
 * @description 配置Winston日志记录器，支持不同环境的日志级别和输出格式
 */

const logger = winston.createLogger({
  // 日志级别，可通过环境变量设置
  level: process.env.LOG_LEVEL || 'info',
  
  // 日志格式配置
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  
  // 默认元数据
  defaultMeta: { 
    service: 'express-api',
    version: process.env.npm_package_version || '1.0.0'
  },
  
  // 传输配置（文件输出）
  transports: [
    // 错误日志文件
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 综合日志文件
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
  ],
});

/**
 * 开发环境添加控制台输出
 */
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/**
 * 生产环境添加额外的安全性配置
 */
if (process.env.NODE_ENV === 'production') {
  // 在生产环境中，可以添加更多传输方式
  // 例如：发送到日志聚合服务、监控系统等
}

export default logger;