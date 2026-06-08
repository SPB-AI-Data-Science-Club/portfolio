# Club Portfolio Website

Static HTML/CSS/JS site — the public face of SPB AI & Data Science Club.

## Local Preview

```bash
# Python built-in server
python3 -m http.server 8080
# → http://localhost:8080
```

## Deploying to Vultr VPS

### First-time server setup

```bash
# 1. Upload setup files to VPS
scp setup-vps.sh nginx.conf root@YOUR_VPS_IP:~/

# 2. SSH in and run setup
ssh root@YOUR_VPS_IP "bash setup-vps.sh"
```

### Deploying updates

```bash
# Edit deploy.sh to set your VPS_IP, then:
bash deploy.sh
```

This rsyncs all portfolio files to `/var/www/spb-club/portfolio/` on the VPS.

## Adding a New Project

Edit `index.html` — copy an existing `<article class="project-card">` block and update:
- Title, description, icon
- Tech stack tags
- GitHub link
- Status badge (`status-live` or `status-dev`)

## SSL / HTTPS (requires a domain)

```bash
ssh root@YOUR_VPS_IP
certbot --nginx -d yourdomain.com
```

Then uncomment the HTTPS block in `nginx.conf`.
