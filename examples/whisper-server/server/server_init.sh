#!/bin/bash
# server_init.sh - Initializes the server for VistaCare Node.js application.
# This script:
#   1. Checks prerequisites (node, pnpm)
#   2. Installs server dependencies using pnpm
#   3. Starts the server in development mode

# Note: Requires Node.js >=14.0.0 as per package.json

# ---------------------
# Color settings for messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ---------------------
# Message functions
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

warn_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# ---------------------
# Function to check if a command exists
check_command() {
    command -v "$1" >/dev/null 2>&1 || error_exit "$1 is required but not installed."
}

# ---------------------
# Main execution for server_init.sh

echo "🔍 Checking prerequisites..."
check_command node
check_command pnpm

echo "🚀 Installing server dependencies using pnpm..."
pnpm install || error_exit "Failed to install server dependencies."
success_msg "Server dependencies installed."

echo "🌟 Starting server in development mode..."
pnpm dev || error_exit "Failed to start the server."