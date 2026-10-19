const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🎵 Audira Music API server running on port ${PORT}`);
  console.log(`📡 Base API contract: http://localhost:${PORT}/api/v1`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/v1/health`);
});
