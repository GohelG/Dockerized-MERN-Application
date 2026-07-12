const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Proxy configuration routing to internal Kubernetes service DNS names
app.use('/api/hello', createProxyMiddleware({
  target: 'http://hello-service-svc:5001',
  changeOrigin: true
}));

app.use('/api/profile', createProxyMiddleware({
  target: 'http://profile-service-svc:5002',
  changeOrigin: true
}));

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
