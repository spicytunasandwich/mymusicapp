const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

router.get('/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'ok',
      service: 'Audira Music API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected',
      db_time: dbRes.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'degraded',
      service: 'Audira Music API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;
