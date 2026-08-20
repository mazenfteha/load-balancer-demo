const express = require('express');

const app = express();

const INSTANCE_ID = process.env.INSTANCE_ID || 'api-1';

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${INSTANCE_ID}] ${req.method} ${req.path} ${res.statusCode}`);
  });
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Node.js',
    instance: INSTANCE_ID,
    hostname: require('os').hostname(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;