const path = require('path');
const http = require('http');
const app = require('./app');
const { initWebSocketServer } = require('./websocket');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize real-time WebSockets for presence and listening activity
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`🎵 Linear Music API & WebSocket server running on port ${PORT}`);
  console.log(`📡 Base API contract: http://localhost:${PORT}/api/v1`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/v1/health`);
});
