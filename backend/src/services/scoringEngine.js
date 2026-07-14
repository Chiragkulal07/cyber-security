const Baseline = require('../models/Baseline');
const Alert = require('../models/Alert');
const Log = require('../models/Log');

const deriveSeverity = (riskScore) => {
  if (riskScore <= 30) return 'low';
  if (riskScore <= 55) return 'medium';
  if (riskScore <= 80) return 'high';
  return 'critical';
};

const formatHour = (hour) => {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${hour12}${suffix}`;
};

const isHourInRange = (hour, startHour, endHour) => {
  if (startHour === undefined || endHour === undefined) return true;

  if (startHour <= endHour) {
    return hour >= startHour && hour <= endHour;
  }

  return hour >= startHour || hour <= endHour;
};

const scoreEvent = async (logDoc) => {
  const baseline = await Baseline.findOne({ userId: logDoc.userId });

  if (!baseline) {
    return {
      riskScore: 0,
      reasons: ['No baseline yet'],
      severity: 'low',
      skip: true,
    };
  }

  let riskScore = 0;
  const reasons = [];
  const timestamp = logDoc.timestamp ? new Date(logDoc.timestamp) : new Date();
  const hour = timestamp.getHours();
  const { startHour, endHour } = baseline.typicalHourRange || {};

  if (!isHourInRange(hour, startHour, endHour)) {
    riskScore += 25;
    reasons.push(`Activity outside typical hours (${formatHour(hour)})`);
  }

  const logIp = logDoc.ip || '';
  if (!baseline.typicalIPs || !baseline.typicalIPs.includes(logIp)) {
    riskScore += 20;
    reasons.push(`Unfamiliar IP address (${logIp || 'unknown'})`);
  }

  if (!baseline.typicalActionTypes || !baseline.typicalActionTypes.includes(logDoc.actionType)) {
    riskScore += 15;
    reasons.push(`Uncommon action type for this user (${logDoc.actionType})`);
  }

  if (!baseline.typicalResources || !baseline.typicalResources.includes(logDoc.resource)) {
    riskScore += 10;
    reasons.push(`Resource not typically accessed (${logDoc.resource || 'unknown'})`);
  }

  const avgDataVolumeMB = Number(baseline.avgDataVolumeMB || 0);
  const stdDevDataVolumeMB = Number(baseline.stdDevDataVolumeMB || 0);
  const dataVolumeMB = Number(logDoc.dataVolumeMB || 0);
  const anomalyThreshold = avgDataVolumeMB + 3 * stdDevDataVolumeMB;

  if (dataVolumeMB > anomalyThreshold) {
    riskScore += 30;
    reasons.push(`Data volume significantly above normal (${dataVolumeMB}mb vs avg ${avgDataVolumeMB}mb)`);
  }

  if (['permission_change', 'config_change'].includes(logDoc.actionType)) {
    riskScore += 15;
    reasons.push('Sensitive privilege-altering action');
  }

  riskScore = Math.min(100, riskScore);

  return {
    riskScore,
    reasons,
    severity: deriveSeverity(riskScore),
    skip: false,
  };
};

const scoreAndStoreEvent = async (logDoc) => {
  const scoring = await scoreEvent(logDoc);

  if (scoring.riskScore < 30 || scoring.skip) {
    return {
      log: logDoc,
      scoring,
      alertCreated: false,
    };
  }

  const alert = await Alert.create({
    logId: logDoc._id,
    userId: logDoc.userId,
    riskScore: scoring.riskScore,
    reasons: scoring.reasons,
    severity: scoring.severity,
    status: 'new',
  });

  return {
    log: logDoc,
    scoring,
    alertCreated: true,
    alert,
  };
};

const rescoreAllExistingLogs = async () => {
  const logs = await Log.find({}).sort({ timestamp: 1 });
  const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
  let alertsCreated = 0;

  for (const logDoc of logs) {
    const existingAlert = await Alert.findOne({ logId: logDoc._id });
    if (existingAlert) {
      continue;
    }

    const result = await scoreAndStoreEvent(logDoc);
    if (result.alertCreated) {
      bySeverity[result.scoring.severity] += 1;
      alertsCreated += 1;
    }
  }

  return {
    processedLogs: logs.length,
    alertsCreated,
    bySeverity,
  };
};

module.exports = {
  scoreEvent,
  scoreAndStoreEvent,
  rescoreAllExistingLogs,
};
