const Log = require('./models/Log');
const User = require('./models/User');

const normalActions = ['db_query', 'file_access', 'file_download', 'login'];
const unusualActions = ['permission_change', 'config_change', 'sudo'];
const normalResources = ['customer_table', 'prod-db-01', '/var/log/auth.log', 'orders_2026', 'app-config.yml'];
const unusualResources = ['/etc/passwd', '/etc/sudoers', 'db-users', 'auth-config'];
const privateIps = ['10.0.0.5', '10.0.0.12', '10.0.0.18', '10.0.0.27', '10.0.0.41'];
const unusualIps = ['203.0.113.10', '203.0.113.24', '203.0.113.77'];

const seedLogs = async () => {
  try {
    const count = await Log.countDocuments();
    if (count > 0) {
      return { inserted: 0, total: count };
    }

    const privilegedUsers = await User.find({ isPrivileged: true });
    if (!privilegedUsers.length) {
      return { inserted: 0, total: 0 };
    }

    const now = new Date();
    const events = [];

    const targetEventsPerUser = 30;
    const unusualTarget = 6;

    privilegedUsers.forEach((user) => {
      for (let i = 0; i < targetEventsPerUser; i += 1) {
        const isUnusual = i < unusualTarget;
        const date = new Date(now);
        date.setDate(now.getDate() - Math.floor(Math.random() * 14));

        if (isUnusual) {
          date.setHours(2 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
        } else {
          const hour = 9 + Math.floor(Math.random() * 9);
          date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        }

        const actionType = isUnusual
          ? unusualActions[Math.floor(Math.random() * unusualActions.length)]
          : normalActions[Math.floor(Math.random() * normalActions.length)];

        const resource = isUnusual
          ? unusualResources[Math.floor(Math.random() * unusualResources.length)]
          : normalResources[Math.floor(Math.random() * normalResources.length)];

        const ip = isUnusual
          ? unusualIps[Math.floor(Math.random() * unusualIps.length)]
          : privateIps[Math.floor(Math.random() * privateIps.length)];

        const dataVolumeMB = isUnusual
          ? Number((500 + Math.random() * 1500).toFixed(2))
          : Number((1 + Math.random() * 50).toFixed(2));

        events.push({
          userId: user._id,
          timestamp: date,
          actionType,
          resource,
          ip,
          sessionId: `sess-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          dataVolumeMB,
          rawData: isUnusual
            ? `Unusual ${actionType} activity detected on ${resource}`
            : `Normal ${actionType} activity on ${resource}`,
        });
      }
    });

    const inserted = await Log.insertMany(events);
    console.log(`Seeded ${inserted.length} historical log events for privileged users.`);
    return { inserted: inserted.length, total: inserted.length };
  } catch (error) {
    console.error('Log seed error:', error);
    return { inserted: 0, total: 0 };
  }
};

module.exports = seedLogs;
