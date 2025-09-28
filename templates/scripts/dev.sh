#!/bin/bash

# Node.js DevOps项目开发环境启动脚本
# 支持本地开发和Docker开发两种模式

echo "🚀 Starting Node.js App in Development Mode"
echo "============================================="

# 检查.env文件是否存在
check_env_file() {
    if [ ! -f .env ]; then
        echo "⚠️  Warning: .env file not found!"
        if [ -f .env.example ]; then
            echo "📝 Copying .env.example to .env..."
            cp .env.example .env
            echo "✅ Created .env file. Please update it with your configuration."
        else
            echo "❌ Error: Neither .env nor .env.example found!"
            echo "   Please create a .env file with your configuration."
            exit 1
        fi
    fi
}

# 检查Node.js和npm版本
check_node_version() {
    if ! command -v node &> /dev/null; then
        echo "❌ Error: Node.js is not installed!"
        echo "   Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "❌ Error: Node.js version must be 18 or higher!"
        echo "   Current version: $(node -v)"
        exit 1
    fi
    
    echo "✅ Node.js version: $(node -v)"
}

# 安装依赖
install_dependencies() {
    if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
        echo "📦 Installing dependencies..."
        npm ci
    else
        echo "✅ Dependencies already installed"
    fi
}

# 检查Docker环境
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "⚠️  Docker not found. Using local development mode."
        return 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        echo "⚠️  Docker is not running. Using local development mode."
        return 1
    fi
    
    echo "✅ Docker is available and running"
    return 0
}

# 数据库迁移
run_migrations() {
    echo "📜 Checking database migrations..."
    if command -v npm &> /dev/null && npm run db:migrate --silent 2>/dev/null; then
        echo "✅ Database migrations completed"
    else
        echo "⚠️  Database migrations skipped (not configured or failed)"
    fi
}

# 主函数
main() {
    check_env_file
    check_node_version
    install_dependencies
    
    # 询问用户选择开发模式
    echo ""
    echo "Please select development mode:"
    echo "1) Local development (requires database setup)"
    echo "2) Docker development (includes database)"
    echo "3) Auto-select (prefer Docker if available)"
    
    read -p "Enter your choice (1-3) [3]: " choice
    choice=${choice:-3}
    
    case $choice in
        1)
            echo "🔧 Starting local development mode..."
            run_migrations
            echo "🎉 Starting application with hot reload..."
            npm run dev
            ;;
        2)
            if check_docker; then
                echo "🐳 Starting Docker development environment..."
                npm run dev:docker
            else
                echo "❌ Docker is not available. Please install Docker or choose local development."
                exit 1
            fi
            ;;
        3)
            if check_docker; then
                echo "🐳 Auto-selected Docker development environment..."
                npm run dev:docker
            else
                echo "🔧 Auto-selected local development mode..."
                run_migrations
                echo "🎉 Starting application with hot reload..."
                npm run dev
            fi
            ;;
        *)
            echo "❌ Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
}

# 错误处理
trap 'echo "❌ Script interrupted. Cleaning up..."; docker-compose down 2>/dev/null; exit 1' INT TERM

# 执行主函数
main "$@"