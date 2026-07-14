const express = require('express');
const Baseline = require('../models/Baseline');
const { requireAuth, requireRole } = require('../middleware/auth');
const { buildBaselineForUser, buildBaselinesForAllPrivilegedUsers } = require('../services/baselineEngine');

const router = express.Router();

router.post('/build/:userId', requireAuth, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const baseline = await buildBaselineForUser(req.params.userId);
    res.json(baseline);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/build-all', requireAuth, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const baselines = await buildBaselinesForAllPrivilegedUsers();
    res.json(baselines);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const baselines = await Baseline.find({}).populate('userId', 'name email').sort({ lastBuiltAt: -1 });
    res.json(baselines);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const baseline = await Baseline.findOne({ userId: req.params.userId }).populate('userId', 'name email');

    if (!baseline) {
      return res.json({ status: 'not_built' });
    }

    return res.json(baseline);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
