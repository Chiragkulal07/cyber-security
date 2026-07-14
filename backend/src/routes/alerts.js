const express = require('express');
const Alert = require('../models/Alert');
const { requireAuth, requireRole } = require('../middleware/auth');
const { rescoreAllExistingLogs } = require('../services/scoringEngine');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const { severity, status, page = '1', limit = '25' } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const filters = {};
    if (severity) filters.severity = severity;
    if (status) filters.status = status;

    const total = await Alert.countDocuments(filters);
    const alerts = await Alert.find(filters)
      .sort({ riskScore: -1, timestamp: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate('userId', 'name email')
      .populate('logId');

    res.json({
      alerts,
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', requireAuth, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['acknowledged', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be acknowledged or dismissed' });
    }

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('logId');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/rescore-all', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const summary = await rescoreAllExistingLogs();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
