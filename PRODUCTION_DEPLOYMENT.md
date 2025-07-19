# Production Deployment Guide

## Current Implementation
The student list is now stored using **file-based storage** in `/data/students.json`. This works for small to medium deployments but has limitations for high-traffic applications.

## Production Storage Options

### 1. PostgreSQL with Prisma (Recommended)

**Best for:** Most production applications, especially with user authentication and complex data relationships.

#### Setup Steps:
```bash
# Install dependencies
npm install prisma @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init
```

#### Database Schema (`prisma/schema.prisma`):
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Classroom {
  id        Int       @id @default(autoincrement())
  students  Student[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Student {
  id          Int       @id @default(autoincrement())
  name        String
  classroomId Int
  classroom   Classroom @relation(fields: [classroomId], references: [id])
  createdAt   DateTime  @default(now())
}
```

#### Environment Variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/classroom_db"
# For production: use connection pooling
# DATABASE_URL="postgresql://username:password@host:5432/classroom_db?connection_limit=20&pool_timeout=20"
```

#### Deploy Commands:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 2. Redis (High Performance)

**Best for:** High-traffic applications, real-time features, caching.

#### Setup:
```bash
npm install @upstash/redis
# or for self-hosted: npm install redis
```

#### Environment Variables:
```env
# For Upstash (managed Redis)
UPSTASH_REDIS_REST_URL="https://your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-token"

# For self-hosted Redis
REDIS_URL="redis://localhost:6379"
```

### 3. MongoDB

**Best for:** Document-based storage, flexible schemas.

#### Setup:
```bash
npm install mongodb
```

#### Environment Variables:
```env
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/classroom"
```

### 4. Supabase (PostgreSQL + Real-time)

**Best for:** Rapid development with real-time features.

#### Setup:
```bash
npm install @supabase/supabase-js
```

#### Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

## Deployment Platforms

### Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
```

### Railway
```bash
# Connect your GitHub repo
# Add environment variables in dashboard
# Automatic deployments on push
```

### Heroku
```bash
# Install Heroku CLI
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Migration Steps

### From Current File Storage to Database:

1. **Backup current data:**
```bash
cp data/students.json students-backup.json
```

2. **Choose your storage option** and update `/pages/api/student-list.ts`

3. **Migrate existing data:**
```javascript
// Create a migration script
const fs = require('fs');
const students = JSON.parse(fs.readFileSync('data/students.json', 'utf-8'));
// Insert into your chosen database
```

## Environment Variables for Production

```env
# Database (choose one)
DATABASE_URL="postgresql://..."
MONGODB_URI="mongodb://..."
REDIS_URL="redis://..."

# Security
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Optional: Admin password
ADMIN_PASSWORD="secure-password"
```

## Performance Considerations

### File Storage (Current)
- ✅ Simple setup
- ✅ No external dependencies
- ❌ Not suitable for multiple instances
- ❌ No concurrent write protection
- ❌ Limited scalability

### Database Storage
- ✅ ACID compliance
- ✅ Concurrent access
- ✅ Backup and recovery
- ✅ Scalable
- ❌ Requires setup and maintenance

### Redis Storage
- ✅ Extremely fast
- ✅ Built-in data structures
- ✅ Pub/Sub for real-time features
- ❌ Data persistence configuration needed
- ❌ Memory-based (more expensive)

## Recommended Production Stack

**Small to Medium Apps:**
- **Database:** PostgreSQL with Prisma
- **Hosting:** Vercel
- **Database Hosting:** Supabase or Railway

**High-Traffic Apps:**
- **Database:** PostgreSQL with connection pooling
- **Cache:** Redis
- **Hosting:** Multiple instances behind load balancer
- **Database Hosting:** AWS RDS or Google Cloud SQL

## Security Checklist

- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting
- [ ] Add input validation and sanitization
- [ ] Use connection pooling for databases
- [ ] Regular backups
- [ ] Monitor error logs
- [ ] Implement proper authentication

## Monitoring and Logging

```javascript
// Add to your API routes
console.log(`[${new Date().toISOString()}] ${method} ${req.url}`, {
  body: req.body,
  userAgent: req.headers['user-agent']
});
```

Consider using:
- **Vercel Analytics** for basic metrics
- **Sentry** for error tracking
- **LogRocket** for user session recording
- **DataDog** for comprehensive monitoring