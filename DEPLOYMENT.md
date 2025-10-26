# 🚀 Production Deployment Guide

Your Shift Bidding System is now **production-ready** with full Docker containerization!

## 🎯 What's Been Set Up

### **Complete Docker Stack:**
- ✅ **Next.js App** - Optimized multi-stage Docker build
- ✅ **PostgreSQL Database** - Persistent data with automatic backups
- ✅ **Redis Cache** - Session storage and performance
- ✅ **WebSocket Server** - Real-time communications
- ✅ **Nginx Reverse Proxy** - SSL termination and load balancing
- ✅ **Automated Backups** - Daily database dumps
- ✅ **Health Monitoring** - Service health checks

### **Security Features:**
- ✅ SSL/HTTPS encryption
- ✅ Rate limiting on API routes
- ✅ Security headers
- ✅ Non-root container users
- ✅ Environment isolation

## 🏃‍♂️ Quick Start

### **1. Deploy in 30 Seconds:**
```bash
cd shift-bidding-system

# Copy and configure environment
cp .env.production .env.local
# Edit .env.local with your settings

# Deploy everything
./scripts/deploy.sh
```

### **2. Access Your Application:**
- **🌐 Web App**: https://localhost
- **🏥 Health Check**: https://localhost/api/health
- **👤 Login**: admin@example.com / admin123

## ⚙️ Configuration

### **Environment Variables (.env.local):**
```bash
# Required - Change these!
DB_PASSWORD=your_strong_database_password
NEXTAUTH_SECRET=your_32_character_secret_key
NEXTAUTH_URL=https://yourdomain.com

# Optional - Email notifications
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### **Custom Domain Setup:**
1. Point your domain to your server
2. Update `NEXTAUTH_URL` in `.env.local`
3. Replace SSL certificates in `docker/ssl/`
4. Restart: `docker-compose restart nginx`

## 🛠️ Management Commands

### **Deployment & Updates:**
```bash
./scripts/deploy.sh          # Full deployment
docker-compose restart app   # Restart app only
docker-compose pull && docker-compose up -d --build  # Update
```

### **Database Operations:**
```bash
./scripts/backup.sh          # Manual backup
./scripts/restore.sh backups/file.sql.gz  # Restore backup
docker-compose exec postgres psql -U shift_user shift_bidding  # Direct DB access
```

### **Monitoring:**
```bash
docker-compose ps            # Service status
docker-compose logs -f app   # App logs
docker-compose logs -f websocket  # WebSocket logs
curl -k https://localhost/api/health  # Health check
```

### **Scaling:**
```bash
# Scale app instances
docker-compose up -d --scale app=3

# View resource usage
docker stats
```

## 📊 Service Ports

| Service | Internal | External | Description |
|---------|----------|----------|-------------|
| Nginx | 80, 443 | 80, 443 | Web server, SSL |
| App | 3000 | - | Next.js application |
| WebSocket | 3001 | - | Real-time server |
| PostgreSQL | 5432 | 5432* | Database |
| Redis | 6379 | 6379* | Cache |

*Only exposed in development

## 🔧 Production Checklist

### **Before Going Live:**
- [ ] Change all default passwords in `.env.local`
- [ ] Set strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Configure your domain in `NEXTAUTH_URL`
- [ ] Install real SSL certificates (replace self-signed)
- [ ] Set up email service (Resend/SendGrid)
- [ ] Configure firewall (allow 80, 443, SSH only)
- [ ] Set up monitoring (optional)
- [ ] Test all user roles and features

### **Security Hardening:**
- [ ] Remove/secure database port exposure
- [ ] Set up fail2ban for SSH protection
- [ ] Configure automated security updates
- [ ] Set up log rotation
- [ ] Configure backup offsite storage

## 🏗️ Architecture Overview

```
                    Internet
                        ↓
                   Nginx (SSL)
                   Port 80/443
                   /          \
                  /            \
           Next.js App     WebSocket Server  
           Port 3000        Port 3001
                |               |
                ↓               ↓
           PostgreSQL ←→ Redis Cache
           Port 5432      Port 6379
```

## 🎯 Performance Optimizations

### **Already Configured:**
- Multi-stage Docker builds (smaller images)
- Nginx gzip compression
- Static file caching
- Database connection pooling
- Redis session storage

### **For High Traffic:**
- Scale app containers: `--scale app=N`
- Add database read replicas
- Configure CDN (CloudFlare)
- Set up load balancing

## 🔄 Backup Strategy

### **Automated Daily Backups:**
- Location: `./backups/`
- Retention: 7 days
- Schedule: 2 AM daily
- Compression: gzip

### **Manual Operations:**
```bash
# Create backup
./scripts/backup.sh my_backup_name

# List backups
ls -la backups/

# Restore backup
./scripts/restore.sh backups/backup_file.sql.gz
```

## 🚨 Troubleshooting

### **Application Won't Start:**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

### **Database Connection Issues:**
```bash
# Check database
docker-compose exec postgres pg_isready -U shift_user

# View database logs  
docker-compose logs postgres

# Reset database (⚠️  DANGER - loses data)
docker-compose down
docker volume rm shift-bidding-system_postgres_data
./scripts/deploy.sh
```

### **SSL Certificate Issues:**
```bash
# Regenerate self-signed certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/ssl/private.key \
  -out docker/ssl/cert.pem \
  -subj "/C=CA/ST=ON/L=Toronto/O=ShiftBidding/CN=yourdomain.com"

# Restart nginx
docker-compose restart nginx
```

## 🎉 What's Next?

Your system is **production-ready**! Here's what you can do now:

1. **🎯 Go Live**: Update DNS, SSL certs, and announce to users
2. **📊 Monitor**: Set up alerts and monitoring dashboards  
3. **🚀 Scale**: Add more app instances as usage grows
4. **🔧 Customize**: Add your organization's branding
5. **📱 Mobile**: Consider a mobile app or PWA
6. **🔗 Integrate**: Connect with existing HR/payroll systems

## 📞 Support

- **🐛 Issues**: Check logs first, then Docker documentation  
- **💡 Features**: Modify code and rebuild containers
- **🔒 Security**: Keep Docker and base images updated
- **📈 Performance**: Monitor with `docker stats` and application logs

---

**🎉 Congratulations!** Your bilingual, real-time Shift Bidding System is ready for production use!