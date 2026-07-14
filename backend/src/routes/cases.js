const express = require('express');
const Alert = require('../models/Alert');
const Case = require('../models/Case');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const severityRank = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

const priorityFromSeverity = (severity) => {
  if (severity === 'critical') return 'critical';
  if (severity === 'high') return 'high';
  if (severity === 'medium') return 'medium';
  return 'low';
};

router.post('/', requireAuth, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { alertIds = [], title } = req.body;

    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({ message: 'At least one alertId is required' });
    }

    const alerts = await Alert.find({ _id: { $in: alertIds } }).populate('userId', 'name email');
    if (!alerts.length) {
      return res.status(404).json({ message: 'No alerts found' });
    }

    const primaryAlert = alerts[0];
    if (!primaryAlert.userId) {
      return res.status(404).json({ message: 'Alert user not found' });
    }

    const topAlert = alerts.reduce((current, candidate) => {
      if (!current) return candidate;
      return severityRank[candidate.severity] > severityRank[current.severity] ? candidate : current;
    }, null);

    const topReason = (topAlert.reasons && topAlert.reasons[0]) || 'unusual activity';
    const userName = primaryAlert.userId.name || 'Unknown user';
    const generatedTitle = title || `Investigation: ${userName} - ${topReason}`;

    await Alert.updateMany(
      { _id: { $in: alertIds }, status: 'new' },
      { $set: { status: 'acknowledged' } }
    );

    const createdCase = await Case.create({
      title: generatedTitle,
      alertIds,
      userId: primaryAlert.userId._id || primaryAlert.userId,
      assignedTo: req.user._id,
      status: 'open',
      priority: priorityFromSeverity(topAlert.severity),
    });

    const populatedCase = await Case.findById(createdCase._id)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')
      .populate({ path: 'alertIds', populate: [{ path: 'userId', select: 'name email' }, { path: 'logId' }] });

    res.status(201).json(populatedCase);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, page = '1', limit = '25' } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const filters = {};
    if (status) filters.status = status;

    const total = await Case.countDocuments(filters);
    const cases = await Case.find(filters)
      .sort({ updatedAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email');

    res.json({
      cases,
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')
      .populate({ path: 'alertIds', populate: [{ path: 'userId', select: 'name email' }, { path: 'logId' }] })
      .populate({ path: 'notes.authorId', select: 'name email' });

    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json(caseDoc);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', requireAuth, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { status, priority, resolution } = req.body;
    const updates = {};

    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (resolution !== undefined) updates.resolution = resolution;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided' });
    }

    const updatedCase = await Case.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')
      .populate({ path: 'alertIds', populate: [{ path: 'userId', select: 'name email' }, { path: 'logId' }] });

    if (!updatedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json(updatedCase);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/notes', requireAuth, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Note text is required' });
    }

    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      {
        $push: { notes: { authorId: req.user._id, text: String(text).trim(), createdAt: new Date() } },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')
      .populate({ path: 'alertIds', populate: [{ path: 'userId', select: 'name email' }, { path: 'logId' }] })
      .populate({ path: 'notes.authorId', select: 'name email' });

    if (!updatedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json(updatedCase);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
