#!/bin/bash

# Build and Deploy Script for TwineJS
# This script builds the backend and frontend separately, then packages them for deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$PROJECT_ROOT/dist"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIST="$PROJECT_ROOT/dist/web"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOY_PACKAGE="twine.zip"

echo -e "${BLUE}🚀 Starting TwineJS Build and Deploy Process${NC}"
echo "Project Root: $PROJECT_ROOT"
echo "Build Directory: $BUILD_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Build Backend
echo -e "${BLUE}🔧 Building Backend...${NC}"
cd "$BACKEND_DIR"

# Install backend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    pnpm install
fi

# Build backend
echo -e "${YELLOW}⚙️  Compiling backend...${NC}"
pnpm run build

# Check if backend build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Backend build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend build completed${NC}"

# Build Frontend
echo -e "${BLUE}🎨 Building Frontend...${NC}"
cd "$PROJECT_ROOT"

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    pnpm install
fi

# Clean previous frontend builds
echo -e "${YELLOW}🧹 Cleaning previous frontend builds...${NC}"
pnpm run clean

# Build frontend
echo -e "${YELLOW}⚙️  Compiling frontend...${NC}"
pnpm vite build

# Check if frontend build was successful
if [ ! -d "$FRONTEND_DIST" ]; then
    echo -e "${RED}❌ Frontend build failed - dist/web directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build completed${NC}"

# Package for deployment
echo -e "${BLUE}📦 Packaging for deployment...${NC}"

# Copy backend files
echo -e "${YELLOW}📁 Copying backend files...${NC}"
mkdir -p "$BUILD_DIR/backend"
cp -r "$BACKEND_DIR/dist" "$BUILD_DIR/backend/"
cp "$BACKEND_DIR/package.json" "$BUILD_DIR/backend/"
cp "$BACKEND_DIR/package-lock.json" "$BUILD_DIR/backend/" 2>/dev/null || true

# Create production package.json for backend (only production dependencies)
echo -e "${YELLOW}📝 Creating production package.json for backend...${NC}"
cd "$BACKEND_DIR"
pnpm install --production --prefix "$BUILD_DIR/backend"


# Create deployment configuration
echo -e "${YELLOW}📝 Creating deployment configuration...${NC}"
cat > "$BUILD_DIR/deploy-config.json" << EOF
{
  "buildTimestamp": "$TIMESTAMP",
  "version": "$(cd "$PROJECT_ROOT" && node -p "require('./package.json').version")",
  "backend": {
    "main": "backend/dist/main.js",
    "port": 3001,
    "env": "production"
  },
  "frontend": {
    "staticFiles": "$FRONTEND_DIST/",
    "indexFile": "$FRONTEND_DIST/index.html"
  }
}
EOF

# Create startup script
echo -e "${YELLOW}📝 Creating startup script...${NC}"
cat > "$BUILD_DIR/start.sh" << 'EOF'
#!/bin/bash

# TwineJS Deployment Startup Script

# Get the directory where this script is located
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting TwineJS Application..."
echo "Deploy Directory: $DEPLOY_DIR"

nvm use 20

# Start backend
echo "Starting backend server..."
cd "$DEPLOY_DIR/backend"
node dist/main.js &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"
echo "Frontend static files available in: $DEPLOY_DIR/static"
echo ""
echo "Application is ready!"
echo "Backend API: http://localhost:3010"
echo "Frontend files: Serve the static/ directory with your web server"
echo ""
echo "To stop the backend, run: kill $BACKEND_PID"

# Wait for backend process
wait $BACKEND_PID
EOF

chmod +x "$BUILD_DIR/start.sh"

# Create README for deployment
echo -e "${YELLOW}📝 Creating deployment README...${NC}"
cat > "$BUILD_DIR/README.md" << EOF
# TwineJS Deployment Package

Built on: $(date)
Version: $(cd "$PROJECT_ROOT" && node -p "require('./package.json').version")

## Contents

- \`backend/\` - NestJS backend application
- \`static/\` - Built React frontend application
- \`start.sh\` - Startup script for the backend
- \`deploy-config.json\` - Deployment configuration
- \`README.md\` - This file

## Deployment Instructions

### Quick Start
1. Extract this package to your server
2. Run: \`./start.sh\`

### Manual Deployment

#### Backend
1. Navigate to the \`backend/\` directory
2. Run: \`node dist/main.js\`
3. Backend will start on port 3001

#### Frontend
1. Serve the \`static/\` directory with any web server
2. Examples:
   - Nginx: Point document root to \`static/\`
   - Apache: Set DocumentRoot to \`static/\`
   - Node.js: \`npx serve static/\`

### Environment Variables
- \`PORT\` - Backend port (default: 3001)
- \`NODE_ENV\` - Environment (set to 'production')

### Requirements
- Node.js 20+ (for backend)
- Web server (for frontend static files)

## File Structure
\`\`\`
deploy/
├── backend/
│   ├── dist/           # Compiled backend code
│   ├── node_modules/   # Production dependencies
│   └── package.json    # Backend package info
├── frontend/           # Static frontend files
├── start.sh           # Startup script
├── deploy-config.json # Configuration
└── README.md          # This file
\`\`\`
EOF

# Create ZIP package
echo -e "${BLUE}🗜️  Creating deployment package...${NC}"
cd "$BUILD_DIR"
zip -r "$DEPLOY_PACKAGE" .

# Calculate package size
PACKAGE_SIZE=$(du -h "$DEPLOY_PACKAGE" | cut -f1)

echo ""
echo -e "${GREEN}🎉 Build and packaging completed successfully!${NC}"
echo -e "${GREEN}📦 Deployment package: $DEPLOY_PACKAGE ($PACKAGE_SIZE)${NC}"
echo -e "${GREEN}📁 Build directory: $BUILD_DIR${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "  ✅ Backend built and packaged"
echo "  ✅ Frontend built and packaged"
echo "  ✅ Deployment scripts created"
echo "  ✅ ZIP package created"
echo ""
echo -e "${YELLOW}🚀 Ready for deployment!${NC}"
echo "Extract $DEPLOY_PACKAGE on your server and run ./start.sh"

# Check if we should auto-deploy
if [ "$AUTO_DEPLOY" = "true" ] || [ "$1" = "--deploy" ]; then
    echo ""
    echo -e "${BLUE}🚀 Starting automatic deployment...${NC}"

    # Call the separate deploy script
    if ./deploy.sh "$DEPLOY_PACKAGE"; then
        echo -e "${GREEN}🎉 Build and deployment completed successfully!${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${BLUE}💡 To auto-deploy, run with --deploy flag or set AUTO_DEPLOY=true${NC}"
    echo -e "${BLUE}   Example: ./build-deploy.sh --deploy${NC}"
    echo -e "${BLUE}   Or: AUTO_DEPLOY=true ./build-deploy.sh${NC}"
    echo -e "${BLUE}   Or deploy manually: ./deploy.sh $DEPLOY_PACKAGE${NC}"
fi
