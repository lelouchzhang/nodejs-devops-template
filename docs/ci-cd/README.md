# CI/CD流水线详解 🚀

> 学习如何构建自动化的持续集成和持续部署流水线

## CI/CD基础概念

### 持续集成 (Continuous Integration - CI)
持续集成是一种开发实践，要求开发人员频繁地将代码集成到共享分支中。每次集成都通过自动化构建和测试来验证，以便尽早发现集成错误。

### 持续部署 (Continuous Deployment - CD)
持续部署是持续集成的延伸，将通过测试的代码自动部署到生产环境。确保软件能够快速、可靠地发布。

## GitHub Actions工作流详解

### 1. 代码质量检查工作流

```yaml path=null start=null
name: Code Quality Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
```

**关键特性:**
- **触发条件**: 推送到主要分支或创建PR时自动运行
- **环境一致性**: 使用Ubuntu Latest确保环境一致
- **缓存优化**: 利用npm缓存加速构建
- **失败快速反馈**: 代码质量问题立即暴露

### 2. 自动化测试工作流

```yaml path=null start=null
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci
      - run: npm test
        env:
          NODE_ENV: test
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          JWT_SECRET: test-secret
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-reports
          path: coverage/
```

**最佳实践:**
- **环境变量管理**: 使用GitHub Secrets存储敏感信息
- **测试覆盖率**: 自动生成和上传覆盖率报告
- **失败诊断**: 详细的错误信息和日志输出

### 3. Docker构建和推送工作流

```yaml path=null start=null
name: Docker Build and Push

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: docker.io
  IMAGE_NAME: ${{ secrets.DOCKER_USERNAME }}/your-app

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        with:
          platforms: linux/amd64,linux/arm64
          
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
          
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            ${{ env.IMAGE_NAME }}:latest
            ${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**高级特性:**
- **多架构构建**: 支持AMD64和ARM64架构
- **智能标签**: 基于分支和提交SHA的标签策略
- **缓存优化**: 使用GitHub Actions缓存加速构建

## 工作流触发策略

### 事件触发
```yaml path=null start=null
on:
  push:
    branches: [main, develop]
    paths: ['src/**', 'package*.json']
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # 每周一凌晨2点
  workflow_dispatch:      # 手动触发
```

### 条件执行
```yaml path=null start=null
jobs:
  deploy:
    if: github.ref == 'refs/heads/main' && success()
    steps:
      - name: Deploy to production
        if: github.event_name == 'push'
        run: echo "Deploying to production"
```

## 环境管理

### GitHub Secrets配置
在仓库设置中配置以下secrets：

```
DOCKER_USERNAME       # Docker Hub用户名
DOCKER_PASSWORD       # Docker Hub密码
DATABASE_URL          # 生产数据库URL
TEST_DATABASE_URL     # 测试数据库URL
JWT_SECRET           # JWT密钥
```

### 环境变量最佳实践
```yaml path=null start=null
env:
  NODE_ENV: production
  LOG_LEVEL: info
  
jobs:
  deploy:
    environment: production  # GitHub环境保护
    env:
      DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
    steps:
      - name: Deploy with environment variables
        run: |
          echo "Deploying to $NODE_ENV environment"
          echo "Database: ${DATABASE_URL:0:20}..."
```

## 并行化和优化

### 并行任务执行
```yaml path=null start=null
jobs:
  test:
    strategy:
      matrix:
        node-version: [18.x, 20.x, 21.x]
        os: [ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

### 构建时间优化
```yaml path=null start=null
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    
- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
```

## 失败处理和通知

### 错误处理策略
```yaml path=null start=null
jobs:
  test:
    continue-on-error: false
    steps:
      - name: Run tests
        id: tests
        run: npm test
        
      - name: Handle test failure
        if: failure() && steps.tests.outcome == 'failure'
        run: |
          echo "::error::Tests failed - please check the output above"
          echo "::notice::Run 'npm test' locally to reproduce"
```

### 状态检查和通知
```yaml path=null start=null
- name: Generate summary
  if: always()
  run: |
    echo "## Build Summary 📊" >> $GITHUB_STEP_SUMMARY
    echo "- **Status**: ${{ job.status }}" >> $GITHUB_STEP_SUMMARY
    echo "- **Branch**: ${{ github.ref_name }}" >> $GITHUB_STEP_SUMMARY
    echo "- **Commit**: ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
```

## 部署策略

### 蓝绿部署
```yaml path=null start=null
jobs:
  deploy:
    steps:
      - name: Deploy to staging
        run: |
          docker-compose -f docker-compose.staging.yml up -d
          
      - name: Health check
        run: |
          curl -f http://staging.example.com/health || exit 1
          
      - name: Switch to production
        run: |
          docker-compose -f docker-compose.prod.yml up -d
          docker-compose -f docker-compose.staging.yml down
```

### 金丝雀部署
```yaml path=null start=null
- name: Deploy canary
  run: |
    kubectl set image deployment/app app=${{ env.IMAGE_NAME }}:${{ github.sha }}
    kubectl rollout status deployment/app --timeout=300s
    
- name: Run smoke tests
  run: |
    npm run smoke-tests
    
- name: Promote or rollback
  run: |
    if [ "${{ steps.smoke.outcome }}" == "success" ]; then
      kubectl scale deployment/app --replicas=10
    else
      kubectl rollout undo deployment/app
    fi
```

## 监控和指标

### 构建时间监控
```yaml path=null start=null
- name: Track build time
  run: |
    START_TIME=$(date +%s)
    # ... 构建步骤 ...
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "Build took ${DURATION} seconds"
    echo "build-duration=${DURATION}" >> $GITHUB_OUTPUT
```

### 成功率追踪
```yaml path=null start=null
- name: Report metrics
  if: always()
  run: |
    curl -X POST https://metrics.example.com/api/builds \
      -d "status=${{ job.status }}" \
      -d "duration=${{ steps.build.outputs.build-duration }}" \
      -d "branch=${{ github.ref_name }}"
```

## 安全最佳实践

### 依赖扫描
```yaml path=null start=null
- name: Run security audit
  run: npm audit --audit-level=high
  
- name: Check for vulnerabilities
  uses: actions/dependency-review-action@v3
  if: github.event_name == 'pull_request'
```

### 镜像安全扫描
```yaml path=null start=null
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.IMAGE_NAME }}:${{ github.sha }}
    format: 'sarif'
    output: 'trivy-results.sarif'
```

## 故障排查指南

### 常见问题

**1. 构建失败 - 依赖安装错误**
```bash
# 解决方案
rm package-lock.json node_modules/
npm install
npm ci  # 在CI中使用
```

**2. 测试超时**
```yaml path=null start=null
- name: Run tests with timeout
  run: timeout 300s npm test
  timeout-minutes: 10
```

**3. Docker构建缓存失效**
```yaml path=null start=null
- name: Clear build cache
  run: docker builder prune -f
```

### 调试技巧
```yaml path=null start=null
- name: Debug info
  run: |
    echo "Node version: $(node -v)"
    echo "NPM version: $(npm -v)"
    echo "Working directory: $(pwd)"
    echo "Environment: $NODE_ENV"
    ls -la
```

## 下一步学习

1. **[容器化实践](../docker/README.md)** - 深入学习Docker容器化
2. **[监控和日志](../monitoring/README.md)** - 建立可观测性
3. **[安全最佳实践](../security/README.md)** - 加强应用安全
4. **[故障排查](../troubleshooting/README.md)** - 解决常见问题

---

**💡 提示**: CI/CD是一个渐进的过程，从简单的自动化测试开始，逐步完善你的流水线。