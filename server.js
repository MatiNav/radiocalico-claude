const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const FLASK_PORT = process.env.FLASK_PORT || 5001;

// Proxy API requests to Flask backend
app.use('/api', createProxyMiddleware({
  target: `http://localhost:${FLASK_PORT}`,
  changeOrigin: true,
  logLevel: 'debug'
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(PORT, () => {
  console.log(`✓ Express server running on http://localhost:${PORT}`);
  console.log(`✓ Serving static files from: ${path.join(__dirname, 'public')}`);
  console.log(`✓ Proxying /api/* requests to Flask at http://localhost:${FLASK_PORT}`);
});
