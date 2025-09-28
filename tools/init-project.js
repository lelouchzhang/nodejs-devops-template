#!/usr/bin/env node

/**
 * Node.js DevOps项目初始化脚本
 * 自动设置新项目的基础结构和配置
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(__dirname, '..', 'templates');

// 创建readline接口用于用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 项目配置
let projectConfig = {
  name: '',
  description: '',
  author: '',
  email: '',
  dockerUsername: '',
  githubUsername: '',
  database: 'postgresql',
  features: {
    docker: true,
    cicd: true,
    database: true,
    redis: false,
    monitoring: true,
  },
};

/**
 * 询问用户输入
 */
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * 显示欢迎信息
 */
function showWelcome() {
  console.log('🚀 Node.js DevOps Project Initializer');
  console.log('=====================================');
  console.log('This tool will help you set up a new Node.js project with DevOps best practices.');
  console.log('');
}

/**
 * 收集项目信息
 */
async function collectProjectInfo() {
  console.log('📝 Project Information');
  console.log('----------------------');

  projectConfig.name = await question('Project name: ');
  projectConfig.description =
    (await question('Project description (optional): ')) || `${projectConfig.name} - A Node.js API with DevOps practices`;
  projectConfig.author = await question('Author name: ');
  projectConfig.email = await question('Author email: ');
  projectConfig.githubUsername = await question('GitHub username: ');
  projectConfig.dockerUsername =
    (await question('Docker Hub username (optional): ')) || projectConfig.githubUsername;

  console.log('');
  console.log('🔧 Features Selection');
  console.log('---------------------');

  const dockerChoice = await question('Include Docker configuration? (y/n) [y]: ');
  projectConfig.features.docker = dockerChoice.toLowerCase() !== 'n';

  const cicdChoice = await question('Include CI/CD workflows? (y/n) [y]: ');
  projectConfig.features.cicd = cicdChoice.toLowerCase() !== 'n';

  const databaseChoice = await question('Include database configuration? (y/n) [y]: ');
  projectConfig.features.database = databaseChoice.toLowerCase() !== 'n';

  if (projectConfig.features.database) {
    const dbType = await question('Database type (postgresql/mysql/mongodb) [postgresql]: ');
    projectConfig.database = dbType || 'postgresql';
  }

  const redisChoice = await question('Include Redis configuration? (y/n) [n]: ');
  projectConfig.features.redis = redisChoice.toLowerCase() === 'y';

  const monitoringChoice = await question('Include monitoring setup? (y/n) [y]: ');
  projectConfig.features.monitoring = monitoringChoice.toLowerCase() !== 'n';
}

/**
 * 创建项目目录结构
 */
async function createProjectStructure() {
  console.log('');
  console.log('📁 Creating project structure...');

  const directories = [
    'src',
    'src/config',
    'src/controllers',
    'src/middleware',
    'src/models',
    'src/routes',
    'src/services',
    'src/utils',
    'src/validations',
    'tests',
    'tests/unit',
    'tests/integration',
    'logs',
    'scripts',
  ];

  // 添加条件目录
  if (projectConfig.features.docker) {
    directories.push('nginx');
  }

  if (projectConfig.features.cicd) {
    directories.push('.github', '.github/workflows');
  }

  // 创建目录
  for (const dir of directories) {
    await fs.mkdir(dir, { recursive: true });
    console.log(`  ✅ Created: ${dir}/`);
  }
}

/**
 * 复制和处理模板文件
 */
async function processTemplateFiles() {
  console.log('');
  console.log('📄 Processing template files...');

  // 处理package.json
  await processPackageJson();

  // 处理环境变量文件
  await processEnvFiles();

  // 处理Docker文件
  if (projectConfig.features.docker) {
    await processDockerFiles();
  }

  // 处理CI/CD文件
  if (projectConfig.features.cicd) {
    await processCICDFiles();
  }

  // 创建基础代码文件
  await createBaseCodeFiles();

  // 创建其他配置文件
  await createConfigFiles();
}

/**
 * 处理package.json
 */
async function processPackageJson() {
  const templatePath = path.join(templateDir, 'config', 'package.json');
  const packageTemplate = JSON.parse(await fs.readFile(templatePath, 'utf8'));

  packageTemplate.name = projectConfig.name;
  packageTemplate.description = projectConfig.description;
  packageTemplate.author = `${projectConfig.author} <${projectConfig.email}>`;
  packageTemplate.repository.url = `git+https://github.com/${projectConfig.githubUsername}/${projectConfig.name}.git`;
  packageTemplate.bugs.url = `https://github.com/${projectConfig.githubUsername}/${projectConfig.name}/issues`;
  packageTemplate.homepage = `https://github.com/${projectConfig.githubUsername}/${projectConfig.name}#readme`;

  // 根据功能调整依赖
  if (!projectConfig.features.database) {
    delete packageTemplate.dependencies['drizzle-orm'];
    delete packageTemplate.dependencies['@neondatabase/serverless'];
    delete packageTemplate.devDependencies['drizzle-kit'];
    delete packageTemplate.scripts['db:generate'];
    delete packageTemplate.scripts['db:migrate'];
    delete packageTemplate.scripts['db:studio'];
  }

  await fs.writeFile('package.json', JSON.stringify(packageTemplate, null, 2));
  console.log('  ✅ Created: package.json');
}

/**
 * 处理环境变量文件
 */
async function processEnvFiles() {
  const templatePath = path.join(templateDir, 'config', '.env.example');
  let envTemplate = await fs.readFile(templatePath, 'utf8');

  // 替换项目名称
  envTemplate = envTemplate.replace(/your-app-name/g, projectConfig.name);
  envTemplate = envTemplate.replace(/your-docker-username/g, projectConfig.dockerUsername);

  await fs.writeFile('.env.example', envTemplate);
  await fs.writeFile('.env', envTemplate);
  console.log('  ✅ Created: .env.example');
  console.log('  ✅ Created: .env');
}

/**
 * 处理Docker文件
 */
async function processDockerFiles() {
  // 复制Dockerfile
  const dockerfilePath = path.join(templateDir, 'docker', 'Dockerfile');
  await fs.copyFile(dockerfilePath, 'Dockerfile');
  console.log('  ✅ Created: Dockerfile');

  // 处理docker-compose文件
  const devComposePath = path.join(templateDir, 'docker', 'docker-compose.dev.yml');
  let devCompose = await fs.readFile(devComposePath, 'utf8');
  devCompose = devCompose.replace(/\\$\\{PROJECT_NAME:-app\\}/g, `\${PROJECT_NAME:-${projectConfig.name}}`);
  await fs.writeFile('docker-compose.dev.yml', devCompose);
  console.log('  ✅ Created: docker-compose.dev.yml');

  const prodComposePath = path.join(templateDir, 'docker', 'docker-compose.prod.yml');
  let prodCompose = await fs.readFile(prodComposePath, 'utf8');
  prodCompose = prodCompose.replace(/\\$\\{PROJECT_NAME:-app\\}/g, `\${PROJECT_NAME:-${projectConfig.name}}`);
  await fs.writeFile('docker-compose.prod.yml', prodCompose);
  console.log('  ✅ Created: docker-compose.prod.yml');

  // 创建.dockerignore
  const dockerignore = `node_modules
npm-debug.log
.env
.env.local
.env.development
.env.production
logs/
coverage/
.nyc_output
.git
.gitignore
README.md
Dockerfile
.dockerignore
docker-compose*.yml`;
  await fs.writeFile('.dockerignore', dockerignore);
  console.log('  ✅ Created: .dockerignore');
}

/**
 * 处理CI/CD文件
 */
async function processCICDFiles() {
  const workflows = ['lint-and-format.yml', 'tests.yml', 'docker-build-and-push.yml'];

  for (const workflow of workflows) {
    const srcPath = path.join(templateDir, 'ci-cd', workflow);
    const destPath = path.join('.github', 'workflows', workflow);

    let content = await fs.readFile(srcPath, 'utf8');
    // 替换镜像名称
    content = content.replace(/your-app-name/g, projectConfig.name);
    content = content.replace(/\\$\\{\\{ secrets\\.DOCKER_USERNAME \\}\\}\\/your-app-name/g, 
      `\${{ secrets.DOCKER_USERNAME }}/${projectConfig.name}`);

    await fs.writeFile(destPath, content);
    console.log(`  ✅ Created: .github/workflows/${workflow}`);
  }
}

/**
 * 创建基础代码文件
 */
async function createBaseCodeFiles() {
  // 创建主入口文件
  const indexJs = `import 'dotenv/config';
import server from './server.js';

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📊 Environment: \${process.env.NODE_ENV || 'development'}\`);
  console.log(\`🔗 Local URL: http://localhost:\${PORT}\`);
});
`;
  await fs.writeFile('src/index.js', indexJs);
  console.log('  ✅ Created: src/index.js');

  // 创建服务器文件
  const serverJs = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
}));

// 日志中间件
app.use(morgan('combined'));

// 请求解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ${projectConfig.name} API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

export default app;
`;
  await fs.writeFile('src/server.js', serverJs);
  console.log('  ✅ Created: src/server.js');
}

/**
 * 创建配置文件
 */
async function createConfigFiles() {
  // 创建.gitignore
  const gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development
.env.production

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker
.docker/

# Database
*.db
*.sqlite
`;
  await fs.writeFile('.gitignore', gitignore);
  console.log('  ✅ Created: .gitignore');

  // 创建README.md
  const readme = `# ${projectConfig.name}

${projectConfig.description}

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
${projectConfig.features.docker ? '- Docker & Docker Compose (optional)' : ''}

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/${projectConfig.githubUsername}/${projectConfig.name}.git
cd ${projectConfig.name}

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Update .env with your configuration

# Start development server
npm run dev
\`\`\`

${projectConfig.features.docker ? `### Docker Development

\`\`\`bash
# Start with Docker
npm run dev:docker

# Stop containers
npm run docker:down
\`\`\`
` : ''}

## 📚 Available Scripts

- \`npm run dev\` - Start development server with hot reload
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run lint:fix\` - Fix ESLint issues
- \`npm run format\` - Format code with Prettier
- \`npm run test\` - Run tests
${projectConfig.features.docker ? `- \`npm run dev:docker\` - Start development with Docker
- \`npm run prod:docker\` - Start production with Docker` : ''}

## 🏗️ Project Structure

\`\`\`
${projectConfig.name}/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Data models
│   ├── routes/         # Route definitions
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── validations/    # Input validation schemas
├── tests/              # Test files
├── logs/               # Application logs
└── scripts/            # Build and deployment scripts
\`\`\`

## 📦 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Validation**: Zod
- **Testing**: Jest
- **Code Quality**: ESLint + Prettier
${projectConfig.features.database ? `- **Database**: ${projectConfig.database.charAt(0).toUpperCase() + projectConfig.database.slice(1)}` : ''}
${projectConfig.features.docker ? '- **Containerization**: Docker' : ''}
${projectConfig.features.cicd ? '- **CI/CD**: GitHub Actions' : ''}

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**${projectConfig.author}**
- Email: ${projectConfig.email}
- GitHub: [@${projectConfig.githubUsername}](https://github.com/${projectConfig.githubUsername})
`;
  await fs.writeFile('README.md', readme);
  console.log('  ✅ Created: README.md');
}

/**
 * 安装依赖
 */
async function installDependencies() {
  console.log('');
  console.log('📦 Installing dependencies...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('  ✅ Dependencies installed successfully');
  } catch (error) {
    console.error('  ❌ Failed to install dependencies:', error.message);
    console.log('  ℹ️  You can install them manually later with: npm install');
  }
}

/**
 * 初始化Git仓库
 */
async function initializeGit() {
  console.log('');
  console.log('🔄 Initializing Git repository...');
  
  try {
    execSync('git init', { stdio: 'inherit' });
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Initial commit: Project setup with DevOps template"', { stdio: 'inherit' });
    console.log('  ✅ Git repository initialized');
  } catch (error) {
    console.error('  ❌ Failed to initialize Git:', error.message);
    console.log('  ℹ️  You can initialize it manually later with: git init');
  }
}

/**
 * 显示完成信息
 */
function showCompletion() {
  console.log('');
  console.log('🎉 Project initialization completed!');
  console.log('===================================');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update .env file with your configuration');
  console.log('2. Review and customize the generated files');
  
  if (projectConfig.features.cicd) {
    console.log('3. Set up GitHub repository secrets:');
    console.log('   - DOCKER_USERNAME');
    console.log('   - DOCKER_PASSWORD');
    if (projectConfig.features.database) {
      console.log('   - DATABASE_URL');
      console.log('   - TEST_DATABASE_URL');
    }
    console.log('   - JWT_SECRET');
  }
  
  console.log('');
  console.log('Start development:');
  if (projectConfig.features.docker) {
    console.log('  npm run dev:docker  # With Docker');
  }
  console.log('  npm run dev         # Local development');
  console.log('');
  console.log('Happy coding! 🚀');
}

/**
 * 主函数
 */
async function main() {
  try {
    showWelcome();
    await collectProjectInfo();
    await createProjectStructure();
    await processTemplateFiles();
    await installDependencies();
    await initializeGit();
    showCompletion();
  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 运行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}