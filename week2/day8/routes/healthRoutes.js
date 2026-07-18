'use strict';

const express = require('express');
const { monitor } = require('../middleware/performance');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

router.get('/metrics', (req, res) => {
  res.json({ success: true, data: monitor.getSnapshot() });
});

module.exports = router;
