#!/bin/bash
# setup-vps.sh — first-time VPS setup for SPB Club
# Run this ONCE on your Vultr VPS:
#   scp setup-vps.sh root@YOUR_VPS_IP:~/
#   ssh root@YOUR_VPS_IP "bash setup-vps.sh"

set -e

echo "=== SPB Club VPS Setup ==="

# Update system
apt-get update -y && apt-get upgrade -y

# Install Nginx & Certbot
apt-get install -y nginx certbot python3-certbot-nginx ufw

# Create web root
mkdir -p /var/www/spb-club/portfolio

# Copy Nginx config (assumes nginx.conf was uploaded alongside)
if [ -f ~/nginx.conf ]; then
  cp ~/nginx.conf /etc/nginx/sites-available/spb-club
  ln -sf /etc/nginx/sites-available/spb-club /etc/nginx/sites-enabled/spb-club
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  echo "✓ Nginx configured"
else
  echo "NOTE: nginx.conf not found — manually copy it to /etc/nginx/sites-available/spb-club"
fi

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "=== VPS setup complete ==="
echo "Next steps:"
echo "  1. Edit portfolio/deploy.sh with this VPS IP"
echo "  2. Run: bash deploy.sh   (from your local machine)"
echo "  3. Optional (needs domain): certbot --nginx -d YOUR_DOMAIN"
