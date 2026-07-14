const express = require('express');
const Log = require('../models/Log');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { scoreAndStoreEvent } = require('../services/scoringEngine');

const router = express.Router();

const actionTypes = ['login', 'sudo', 'db_query', 'file_access', 'file_download', 'config_change', 'permission_change'];
const resources = ['prod-db-01', 'customer_table', '/etc/passwd', '/var/log/auth.log', 'app-config.yml', 'reports-export-2026'];
const ips = ['10.0.0.5', '192.168.1.42', '172.16.2.9', '203.0.113.17'];

router.post('/ingest', requireAuth, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { userId, actionType, resource, ip, sessionId, dataVolumeMB, rawData } = req.body;

    if (!userId || !actionType) {
      return res.status(400).json({ message: 'userId and actionType are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const log = await Log.create({
      userId,
      actionType,
      resource,
      ip,
      sessionId,
      dataVolumeMB: Number(dataVolumeMB) || 0,
      rawData,
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId, actionType, from, to, page = '1', limit = '25' } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const filters = {};

    if (userId) filters.userId = userId;
    if (actionType) filters.actionType = actionType;

    if (from || to) {
      filters.timestamp = {};
      if (from) filters.timestamp.$gte = new Date(from);
      if (to) filters.timestamp.$lte = new Date(to);
    }

    const total = await Log.countDocuments(filters);
    const logs = await Log.find(filters)
      .sort({ timestamp: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate('userId', 'name email');

    res.json({
      logs,
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/simulate', requireAuth, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const privilegedUsers = await User.find({ isPrivileged: true });

    if (!privilegedUsers.length) {
      return res.status(404).json({ message: 'No privileged users found' });
    }

    const selectedUser = privilegedUsers[Math.floor(Math.random() * privilegedUsers.length)];
    const selectedAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    const selectedResource = resources[Math.floor(Math.random() * resources.length)];
    const selectedIp = ips[Math.floor(Math.random() * ips.length)];
    const dataVolumeMB = Number((Math.random() * 40).toFixed(2));

    const log = await Log.create({
      userId: selectedUser._id,
      actionType: selectedAction,
      resource: selectedResource,
      ip: selectedIp,
      sessionId: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dataVolumeMB,
      rawData: `Simulated ${selectedAction} activity for ${selectedResource}`,
    });

    const populatedLog = await Log.findById(log._id).populate('userId', 'name email');
    const scoringResult = await scoreAndStoreEvent(populatedLog);

    res.status(201).json({
      ...populatedLog.toObject(),
      scoring: scoringResult.scoring,
      alertCreated: scoringResult.alertCreated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
