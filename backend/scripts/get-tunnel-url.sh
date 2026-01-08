#!/bin/bash

# Get the current Cloudflare Tunnel URL
# Usage: ./scripts/get-tunnel-url.sh

TUNNEL_URL=$(docker logs daymark-tunnel 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1)

if [ -z "$TUNNEL_URL" ]; then
    echo "Tunnel not running or URL not found."
    echo "Start tunnel with: docker compose up -d tunnel"
    exit 1
fi

echo "$TUNNEL_URL"
