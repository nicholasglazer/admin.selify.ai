#!/bin/bash
#
# Browser Debug Local Setup Script
# ================================
# Run this on your LOCAL machine to enable remote browser debugging
# for server-side Claude Code.
#
# Usage:
#   ./browser-debug-local.sh [server-user@server-ip]
#
# Example:
#   ./browser-debug-local.sh ng@192.168.1.100
#   ./browser-debug-local.sh  # Uses localhost (for local Claude Code)
#

set -e

# Configuration
DEBUG_PORT=9222
CHROME_PROFILE="${HOME}/.chrome-debug-profile"
SERVER_HOST="${1:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Browser Debug Setup for Claude Code  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Detect Chrome/Chromium
detect_chrome() {
    if command -v chromium &> /dev/null; then
        echo "chromium"
    elif command -v chromium-browser &> /dev/null; then
        echo "chromium-browser"
    elif command -v google-chrome &> /dev/null; then
        echo "google-chrome"
    elif command -v google-chrome-stable &> /dev/null; then
        echo "google-chrome-stable"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    else
        echo ""
    fi
}

CHROME_BIN=$(detect_chrome)

if [[ -z "$CHROME_BIN" ]]; then
    echo -e "${RED}Error: Chrome/Chromium not found!${NC}"
    echo "Please install Chrome or Chromium first."
    exit 1
fi

echo -e "${GREEN}Found Chrome:${NC} $CHROME_BIN"

# Check if Chrome debug is already running
if lsof -i :$DEBUG_PORT &> /dev/null; then
    echo -e "${YELLOW}Warning: Port $DEBUG_PORT is already in use.${NC}"
    echo "Checking if it's Chrome debug port..."

    if curl -s "http://localhost:$DEBUG_PORT/json/version" &> /dev/null; then
        echo -e "${GREEN}Chrome debug server already running!${NC}"
        CHROME_RUNNING=true
    else
        echo -e "${RED}Port $DEBUG_PORT is used by another process.${NC}"
        echo "Please free the port and try again."
        exit 1
    fi
else
    CHROME_RUNNING=false
fi

# Start Chrome if not running
if [[ "$CHROME_RUNNING" == "false" ]]; then
    echo ""
    echo -e "${BLUE}Starting Chrome with remote debugging...${NC}"

    # Create profile directory
    mkdir -p "$CHROME_PROFILE"

    # Start Chrome in background
    "$CHROME_BIN" \
        --remote-debugging-port=$DEBUG_PORT \
        --user-data-dir="$CHROME_PROFILE" \
        --no-first-run \
        --no-default-browser-check \
        --remote-allow-origins=* \
        &> /dev/null &

    CHROME_PID=$!
    echo -e "${GREEN}Chrome started with PID: $CHROME_PID${NC}"

    # Wait for Chrome to be ready
    echo "Waiting for Chrome to initialize..."
    sleep 2

    for i in {1..10}; do
        if curl -s "http://localhost:$DEBUG_PORT/json/version" &> /dev/null; then
            echo -e "${GREEN}Chrome debug server is ready!${NC}"
            break
        fi
        sleep 1
    done
fi

# Verify Chrome is accessible
echo ""
echo -e "${BLUE}Verifying Chrome DevTools Protocol...${NC}"
VERSION_INFO=$(curl -s "http://localhost:$DEBUG_PORT/json/version" 2>/dev/null || echo "")

if [[ -n "$VERSION_INFO" ]]; then
    BROWSER_VERSION=$(echo "$VERSION_INFO" | grep -o '"Browser":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}Browser:${NC} $BROWSER_VERSION"
    echo -e "${GREEN}WebSocket URL:${NC} ws://localhost:$DEBUG_PORT"
else
    echo -e "${RED}Failed to connect to Chrome debug port!${NC}"
    exit 1
fi

# Set up SSH tunnel if server host provided
if [[ -n "$SERVER_HOST" ]]; then
    echo ""
    echo -e "${BLUE}Setting up SSH reverse tunnel to $SERVER_HOST...${NC}"
    echo "This will make your local Chrome accessible from the server."
    echo ""
    echo -e "${YELLOW}Command:${NC} ssh -R $DEBUG_PORT:localhost:$DEBUG_PORT $SERVER_HOST"
    echo ""
    echo "Press Ctrl+C to stop the tunnel when done."
    echo ""

    # Start SSH tunnel (this will block)
    ssh -R $DEBUG_PORT:localhost:$DEBUG_PORT -N "$SERVER_HOST"
else
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Chrome Debug Server Ready!           ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Chrome is running with remote debugging on port $DEBUG_PORT"
    echo ""
    echo -e "${BLUE}For LOCAL Claude Code:${NC}"
    echo "  The chrome-devtools MCP can now connect automatically."
    echo ""
    echo -e "${BLUE}For REMOTE Claude Code (on a server):${NC}"
    echo "  Run this command to create SSH tunnel:"
    echo ""
    echo -e "  ${YELLOW}ssh -R $DEBUG_PORT:localhost:$DEBUG_PORT user@server${NC}"
    echo ""
    echo "  Or re-run this script with the server address:"
    echo ""
    echo -e "  ${YELLOW}$0 user@server-ip${NC}"
    echo ""
    echo "Press Ctrl+C to stop Chrome debug server."
    echo ""

    # Keep script running
    wait
fi
