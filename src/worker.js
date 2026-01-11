/**
 * Cloudflare Workers entry point
 * This adapts the Express.js backend to work with Cloudflare Workers
 * 
 * Note: This is a basic adapter. You'll need to:
 * 1. Migrate from SQLite to Cloudflare D1 database
 * 2. Update database connection to use D1
 * 3. Adapt routes to use Workers-compatible request/response handling
 */

import { Router } from 'itty-router';

// Create router
const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper to add CORS headers
const addCORS = (response) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};

// Health check endpoint
router.get('/api/health', async (request, env) => {
  const response = new Response(JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Crownzcom Investment Club API',
    environment: 'cloudflare-workers'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  return addCORS(response);
});

// Root endpoint
router.get('/', async (request, env) => {
  const response = new Response(JSON.stringify({
    message: 'Crownzcom Investment Club - Savings & Loan Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      loans: '/api/loans',
      savings: '/api/savings',
      admin: '/api/admin',
      health: '/api/health'
    }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  return addCORS(response);
});

// Handle OPTIONS requests for CORS
router.options('*', async (request) => {
  return addCORS(new Response(null, { status: 204 }));
});

// TODO: Add your route handlers here
// You'll need to adapt your Express routes to work with itty-router
// Example:
// router.post('/api/auth/login', async (request, env) => {
//   const { username, password } = await request.json();
//   // Your login logic here using env.DB (D1 database)
//   return addCORS(new Response(JSON.stringify({ token, user }), {
//     headers: { 'Content-Type': 'application/json' }
//   }));
// });

// 404 handler
router.all('*', async (request) => {
  const response = new Response(JSON.stringify({ error: 'Endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
  return addCORS(response);
});

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    try {
      // Handle the request with the router
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      const response = new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
      return addCORS(response);
    }
  },
};
