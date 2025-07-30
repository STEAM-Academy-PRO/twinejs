#!/bin/bash

# Deploy Script for TwineJS
# This script deploys a pre-built package to the target server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_HOST="${DEPLOY_HOST:-tmpx}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/symunona/wwwroot/twine}"
DEPLOY_USER="${DEPLOY_USER:-${USER}}"

# Function to show usage
show_usage() {
    echo "Usage: $0"
    echo ""
    echo "Deploy TwineJS package (deploy-build/twine.zip) to the target server."
    echo ""
    echo "Environment Variables:"
    echo "  DEPLOY_HOST     Target hostname (default: tmpx)"
    echo "  DEPLOY_PATH     Target path on server (default: /home/symunona/wwwroot/twine)"
    echo "  DEPLOY_USER     SSH username (default: current user)"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  DEPLOY_HOST=myserver $0"
    echo "  DEPLOY_USER=admin DEPLOY_PATH=/var/www/twine $0"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

# Use default package file
DEPLOY_PACKAGE="deploy-build/twine.zip"

# Check if package file exists
if [ ! -f "$DEPLOY_PACKAGE" ]; then
    echo -e "${RED}❌ Package file not found: $DEPLOY_PACKAGE${NC}"
    exit 1
fi

REMOTE_PACKAGE="/tmp/$(basename "$DEPLOY_PACKAGE")"

echo -e "${BLUE}🚀 Starting TwineJS Deployment${NC}"
echo "Package: $DEPLOY_PACKAGE"
echo "Target: ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
echo ""

# Upload package to server
echo -e "${YELLOW}📤 Uploading package to ${DEPLOY_HOST}:${REMOTE_PACKAGE}...${NC}"
if scp "$DEPLOY_PACKAGE" "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_PACKAGE}"; then
    echo -e "${GREEN}✅ Package uploaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to upload package${NC}"
    exit 1
fi

# SSH to server and deploy
echo -e "${YELLOW}🔧 Deploying on remote server...${NC}"
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
set -e

# Use Node.js 20
echo "Setting up Node.js 20..."
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
nvm use 20

# Create deployment directory
mkdir -p "${DEPLOY_PATH}"
cd "${DEPLOY_PATH}"

# Extract new package
echo "Extracting package..."
unzip -o -q "${REMOTE_PACKAGE}"

# Clean up
rm "${REMOTE_PACKAGE}"

echo "Deployment completed successfully!"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}🌐 Service should now be running on ${DEPLOY_HOST}${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
