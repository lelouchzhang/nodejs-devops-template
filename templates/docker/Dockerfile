# Node.js 应用的多阶段 Dockerfile
# 针对开发和生产环境优化

# 基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 复制package文件（利用Docker缓存层）
COPY package*.json ./

# 安装生产依赖并清理缓存
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 创建非root用户（安全最佳实践）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改应用目录所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# 开发阶段
FROM base AS development
USER root
# 安装所有依赖（包括devDependencies）
RUN npm ci && npm cache clean --force
USER nodejs
CMD ["npm", "run", "dev"]

# 生产阶段
FROM base AS production
CMD ["npm", "start"]