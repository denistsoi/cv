# cv

A Next.js project for a personal CV/portfolio.

## Microbit Kids Class

This project includes a simple classroom link manager for Micro:bit kids classes. It allows the host to set a weekly classroom URL, which is then displayed for kids to join from their own devices.

### Features
- **Admin page** (`/admin`): Host can set or update the classroom URL for the week. The URL is stored in Upstash Redis for persistence.
- **Classroom page** (`/classroom`): Kids can visit this page to see and click the current classroom link.

### How it Works
- The admin sets the classroom URL via the `/admin` page. This updates the value in Upstash Redis.
- The `/classroom` page fetches the current URL from the backend and displays it as a clickable link.
- All users see the same link, regardless of device or browser.

### Setup Instructions
1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Install Upstash Redis client:**
   ```sh
   npm install @upstash/redis
   ```
3. **Add Upstash Redis to your Vercel project:**
   - Go to the [Vercel Upstash Integration page](https://vercel.com/integrations/upstash).
   - Add the integration to your project and environment.
   - This will automatically set the required environment variables.
4. **Deploy to Vercel.**

### Usage
- **Admin:** Go to `/admin` to set or update the classroom URL.
- **Kids:** Go to `/classroom` to see and click the current week’s link.

---
For more information on Upstash Redis, see the [Upstash Redis Docs](https://upstash.com/docs/redis/quick-start/nextjs).

### author
Denis Tsoi 