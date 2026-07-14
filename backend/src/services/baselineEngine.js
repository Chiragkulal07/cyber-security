const Log = require('../models/Log');
const Baseline = require('../models/Baseline');
const User = require('../models/User');

const getPercentile = (values, percentile) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
};

const buildBaselineForUser = async (userId) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  const logs = await Log.find({ userId, timestamp: { $gte: cutoff } }).sort({ timestamp: 1 });

  if (logs.length < 10) {
    return { status: 'insufficient_data', eventsAnalyzed: logs.length };
  }

  const hours = logs.map((log) => new Date(log.timestamp).getHours());
  const hourValues = hours.sort((a, b) => a - b);
  const lowerBound = getPercentile(hourValues, 0.1);
  const upperBound = getPercentile(hourValues, 0.9);

  const ipFrequency = {};
  const actionFrequency = {};
  const resourceFrequency = {};
  const dataVolumes = logs.map((log) => Number(log.dataVolumeMB || 0));

  logs.forEach((log) => {
    ipFrequency[log.ip] = (ipFrequency[log.ip] || 0) + 1;
    actionFrequency[log.actionType] = (actionFrequency[log.actionType] || 0) + 1;
    resourceFrequency[log.resource] = (resourceFrequency[log.resource] || 0) + 1;
  });

  const threshold = logs.length * 0.05;
  const typicalIPs = Object.entries(ipFrequency)
    .filter(([, count]) => count > threshold)
    .map(([ip]) => ip);
  const typicalActionTypes = Object.entries(actionFrequency)
    .filter(([, count]) => count > threshold)
    .map(([actionType]) => actionType);
  const typicalResources = Object.entries(resourceFrequency)
    .filter(([, count]) => count > threshold)
    .map(([resource]) => resource);

  const avg = dataVolumes.reduce((sum, value) => sum + value, 0) / dataVolumes.length;
  const variance = dataVolumes.reduce((sum, value) => sum + (value - avg) ** 2, 0) / dataVolumes.length;
  const stdDev = Math.sqrt(variance);

  const baseline = {
    userId,
    typicalHourRange: {
      startHour: Math.floor(lowerBound),
      endHour: Math.ceil(upperBound),
    },
    typicalIPs,
    typicalActionTypes,
    avgDataVolumeMB: Number(avg.toFixed(2)),
    stdDevDataVolumeMB: Number(stdDev.toFixed(2)),
    typicalResources,
    eventsAnalyzed: logs.length,
    lastBuiltAt: new Date(),
  };

  const savedBaseline = await Baseline.findOneAndUpdate(
    { userId },
    { $set: baseline },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return savedBaseline;
};

const buildBaselinesForAllPrivilegedUsers = async () => {
  const privilegedUsers = await User.find({ isPrivileged: true });
  const results = [];

  for (const user of privilegedUsers) {
    const result = await buildBaselineForUser(user._id);
    results.push(result);
  }

  return results;
};

module.exports = {
  buildBaselineForUser,
  buildBaselinesForAllPrivilegedUsers,
};
