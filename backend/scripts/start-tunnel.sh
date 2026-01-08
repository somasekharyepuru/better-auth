#!/bin/bash

# Start Cloudflare Tunnel and extract the public URL
# Usage: ./scripts/start-tunnel.sh

set -e

echo "Starting Cloudflare Tunnel..."

# Check if running in Docker or locally
if command -v docker &> /dev/null && docker ps &> /dev/null; then
    # Start tunnel container
    docker compose up -d tunnel

    echo "Waiting for tunnel to initialize..."
    sleep 5

    # Extract URL from logs
    TUNNEL_URL=$(docker logs daymark-tunnel 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1)
else
    # Run cloudflared directly (install: brew install cloudflared)
    if ! command -v cloudflared &> /dev/null; then
        echo "cloudflared not found. Install with: brew install cloudflared"
        exit 1
    fi

    # Start tunnel in background and capture output
    cloudflared tunnel --url http://localhost:3002 2>&1 | tee /tmp/tunnel.log &
    TUNNEL_PID=$!

    echo "Waiting for tunnel to initialize..."
    sleep 5

    # Extract URL from logs
    TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/tunnel.log | head -1)
fi

if [ -z "$TUNNEL_URL" ]; then
    echo "Failed to get tunnel URL. Check logs:"
    if [ -n "$TUNNEL_PID" ]; then
        cat /tmp/tunnel.log
    else
        docker logs daymark-tunnel 2>&1 | tail -20
    fi
    exit 1
fi

echo ""
echo "=========================================="
echo "Tunnel URL: $TUNNEL_URL"
echo "=========================================="
echo ""

# Update .env file
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    if grep -q "^WEBHOOK_BASE_URL=" "$ENV_FILE"; then
        # Update existing
        sed -i.bak "s|^WEBHOOK_BASE_URL=.*|WEBHOOK_BASE_URL=$TUNNEL_URL|" "$ENV_FILE"
        rm -f "$ENV_FILE.bak"
        echo "Updated WEBHOOK_BASE_URL in .env"
    else
        # Add new
        echo "WEBHOOK_BASE_URL=$TUNNEL_URL" >> "$ENV_FILE"
        echo "Added WEBHOOK_BASE_URL to .env"
    fi
else
    echo "WEBHOOK_BASE_URL=$TUNNEL_URL" > "$ENV_FILE"
    echo "Created .env with WEBHOOK_BASE_URL"
fi

echo ""
echo "Next steps:"
echo "1. Restart your backend: docker compose restart backend"
echo "2. Re-connect your calendars (Settings -> Calendars -> Disconnect & Reconnect)"
echo "   OR trigger a manual sync to refresh webhooks"
echo ""
echo "Webhooks will now work! Events created in Gmail will sync instantly."
