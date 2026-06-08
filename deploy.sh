#!/bin/bash
# deploy.sh — push portfolio to Vultr VPS
# Usage: bash deploy.sh
# First-time: also run setup-vps.sh on the server

set -e

# ── Config — edit these ────────────────────────────────────────────────
VPS_IP="YOUR_VPS_IP"          # e.g. 123.45.67.89
VPS_USER="root"
REMOTE_DIR="/var/www/spb-club/portfolio"

echo "=== Deploying SPB Club Portfolio ==="
echo "  Target: $VPS_USER@$VPS_IP:$REMOTE_DIR"

# Sync everything except deploy scripts and nginx config
rsync -avz --delete \
  --exclude 'deploy.sh' \
  --exclude 'setup-vps.sh' \
  --exclude '.DS_Store' \
  . "$VPS_USER@$VPS_IP:$REMOTE_DIR/"

echo ""
echo "✓ Deployed. Visit: http://$VPS_IP"
