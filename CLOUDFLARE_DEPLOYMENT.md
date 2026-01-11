# Cloudflare Workers Deployment Guide

This guide explains how to deploy your backend to Cloudflare Workers.

## Important Notes

⚠️ **Your current Express.js backend uses SQLite, which is not compatible with Cloudflare Workers.** You'll need to:

1. **Migrate from SQLite to Cloudflare D1** (Cloudflare's SQL database)
2. **Adapt your routes** from Express.js to Workers-compatible format
3. **Update database queries** to use D1 instead of better-sqlite3

## Prerequisites

1. Install Wrangler CLI (Cloudflare's deployment tool):
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

## Setup Steps

### 1. Create D1 Database

Create a D1 database in Cloudflare:
```bash
wrangler d1 create investment-club-db
```

This will output a database ID. Update `wrangler.toml` with the `database_id`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "investment-club-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 2. Initialize Database Schema

You'll need to create a script to initialize your D1 database with the schema from `src/database/init.js`. D1 uses SQLite-compatible syntax, so your existing SQL should work with minor modifications.

Create a migration script or use:
```bash
wrangler d1 execute investment-club-db --file=./schema.sql
```

### 3. Update Database Connection

Update `src/database/connection.js` to work with D1:
- Instead of `better-sqlite3`, use the D1 binding from `env.DB`
- D1 uses async/await, so you'll need to update your repository methods

### 4. Adapt Routes

The `src/worker.js` file provides a basic structure using `itty-router`. You'll need to:
- Convert Express route handlers to Workers-compatible handlers
- Update request/response handling (Workers use Fetch API)
- Pass `env.DB` to your repositories

### 5. Update Environment Variables

Set secrets in Cloudflare:
```bash
wrangler secret put JWT_SECRET
wrangler secret put NODE_ENV
```

### 6. Deploy

Once everything is set up:
```bash
npm run deploy:cloudflare
```

Or use Wrangler directly:
```bash
wrangler deploy
```

## Development

Test locally with:
```bash
npm run dev:cloudflare
```

This will start a local development server that mimics the Cloudflare Workers environment.

## Current Status

- ✅ `wrangler.toml` configuration created
- ✅ Basic `worker.js` entry point created
- ✅ Package.json scripts added
- ⚠️ Database migration to D1 needed
- ⚠️ Route adaptation needed
- ⚠️ Repository updates needed

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [itty-router Docs](https://github.com/kwhitley/itty-router)
