const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[${process.env.INSTANCE_ID || 'api-1'}] listening on port ${PORT}`);
});