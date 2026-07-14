const express = require('express');
const Alert = require('../models/Alert');
const Case = require('../models/Case');
const Log = require('../models/Log');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const getDateRange = (from, to) => {
  const endDate = to ? new Date(to) : new Date();
  const startDate = from ? new Date(from) : new Date(endDate);

  if (!from) {
    startDate.setDate(endDate.getDate() - 30);
  }

  return { startDate, endDate };
};

const escapeCsvValue = (value) => {
  const stringValue = value == null ? '' : String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const { startDate, endDate } = getDateRange(from, to);

    const logFilter = { timestamp: { $gte: startDate, $lte: endDate } };
    const alertFilter = { timestamp: { $gte: startDate, $lte: endDate } };
    const caseFilter = { createdAt: { $gte: startDate, $lte: endDate } };

    const [totalLogs, totalAlerts, alertsBySeverityRaw, totalCases, casesByStatusRaw, resolvedCases] = await Promise.all([
      Log.countDocuments(logFilter),
      Alert.countDocuments(alertFilter),
      Alert.aggregate([
        { $match: alertFilter },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Case.countDocuments(caseFilter),
      Case.aggregate([
        { $match: caseFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Case.find({
        status: 'resolved',
        createdAt: { $gte: startDate, $lte: endDate },
      }).select('createdAt updatedAt'),
    ]);

    const alertsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    alertsBySeverityRaw.forEach((entry) => {
      alertsBySeverity[entry._id] = entry.count;
    });

    const casesByStatus = { open: 0, investigating: 0, resolved: 0, escalated: 0 };
    casesByStatusRaw.forEach((entry) => {
      casesByStatus[entry._id] = entry.count;
    });

    const topRiskyUsers = await Alert.aggregate([
      { $match: alertFilter },
      { $group: { _id: '$userId', alertCount: { $sum: 1 }, avgRiskScore: { $avg: '$riskScore' } } },
      { $sort: { alertCount: -1, avgRiskScore: -1 } },
      { $limit: 5 },
    ]);

    const userIds = topRiskyUsers.map((entry) => entry._id);
    const userDetails = await require('../models/User').find({ _id: { $in: userIds } }).select('name');
    const usersById = Object.fromEntries(userDetails.map((user) => [String(user._id), user.name]));

    const formattedTopRiskyUsers = topRiskyUsers.map((entry) => ({
      userId: entry._id,
      userName: usersById[String(entry._id)] || 'Unknown user',
      alertCount: entry.alertCount,
      avgRiskScore: Number(entry.avgRiskScore.toFixed(2)),
    }));

    const resolutionHours = resolvedCases.reduce((total, entry) => {
      if (!entry.createdAt || !entry.updatedAt) return total;
      const diffMs = new Date(entry.updatedAt) - new Date(entry.createdAt);
      return total + diffMs / (1000 * 60 * 60);
    }, 0);

    res.json({
      totalLogs,
      totalAlerts,
      alertsBySeverity,
      totalCases,
      casesByStatus,
      topRiskyUsers: formattedTopRiskyUsers,
      avgResolutionTimeHours: resolvedCases.length ? Number((resolutionHours / resolvedCases.length).toFixed(2)) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/export', requireAuth, requireRole('admin', 'auditor'), async (req, res) => {
  try {
    const { from, to, format = 'json' } = req.query;
    const { startDate, endDate } = getDateRange(from, to);

    const alerts = await Alert.find({
      timestamp: { $gte: startDate, $lte: endDate },
    })
      .populate('userId', 'name email')
      .populate('logId')
      .sort({ timestamp: -1 });

    const alertIds = alerts.map((alert) => alert._id);
    const cases = await Case.find({ alertIds: { $in: alertIds } }).select('_id alertIds status');
    const casesByAlertId = Object.fromEntries(
      cases.flatMap((caseItem) => caseItem.alertIds.map((alertId) => [String(alertId), { caseId: caseItem._id, caseStatus: caseItem.status }]))
    );

    if (format === 'csv') {
      const headers = ['Timestamp', 'User', 'ActionType', 'Resource', 'RiskScore', 'Severity', 'Reasons', 'AlertStatus', 'CaseStatus', 'CaseId'];
      const rows = alerts.map((alert) => {
        const caseInfo = casesByAlertId[String(alert._id)] || {};
        return [
          new Date(alert.timestamp).toISOString(),
          alert.userId?.name || 'Unknown',
          alert.logId?.actionType || '',
          alert.logId?.resource || '',
          alert.riskScore,
          alert.severity,
          (alert.reasons || []).join(' | '),
          alert.status,
          caseInfo.caseStatus || '',
          caseInfo.caseId || '',
        ];
      });

      const csvContent = [headers, ...rows].map((row) => row.map((value) => escapeCsvValue(value)).join(',')).join('\n');
      const fromValue = from || startDate.toISOString().slice(0, 10);
      const toValue = to || endDate.toISOString().slice(0, 10);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="insider-threat-report-${fromValue}-to-${toValue}.csv"`);
      return res.send(csvContent);
    }

    res.json({
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      alerts: alerts.map((alert) => {
        const caseInfo = casesByAlertId[String(alert._id)] || {};
        return {
          timestamp: alert.timestamp,
          user: alert.userId ? { id: alert.userId._id, name: alert.userId.name, email: alert.userId.email } : null,
          actionType: alert.logId?.actionType || null,
          resource: alert.logId?.resource || null,
          riskScore: alert.riskScore,
          severity: alert.severity,
          reasons: alert.reasons || [],
          alertStatus: alert.status,
          caseStatus: caseInfo.caseStatus || null,
          caseId: caseInfo.caseId || null,
        };
      }),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
