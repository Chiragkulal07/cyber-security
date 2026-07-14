const bcrypt = require('bcryptjs');
const User = require('./models/User');

const demoUsers = [
  {
    name: 'Admin Demo',
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
    isPrivileged: false,
  },
  {
    name: 'Analyst Demo',
    email: 'analyst@demo.com',
    password: 'analyst123',
    role: 'analyst',
    isPrivileged: false,
  },
  {
    name: 'Auditor Demo',
    email: 'auditor@demo.com',
    password: 'auditor123',
    role: 'auditor',
    isPrivileged: false,
  },
  {
    name: 'Raj DBA',
    email: 'raj.dba@demo.com',
    password: 'raj12345',
    role: 'analyst',
    isPrivileged: true,
  },
  {
    name: 'Neha Sysadmin',
    email: 'neha.sysadmin@demo.com',
    password: 'neha1234',
    role: 'analyst',
    isPrivileged: true,
  },
];

const seedUsers = async () => {
  try {
    const created = [];
    const alreadyPresent = [];

    for (const user of demoUsers) {
      const existingUser = await User.findOne({ email: user.email.toLowerCase() });

      if (existingUser) {
        alreadyPresent.push(user.email);
        continue;
      }

      const passwordHash = await bcrypt.hash(user.password, 10);
      await User.create({
        ...user,
        email: user.email.toLowerCase(),
        passwordHash,
      });

      created.push(user.email);
    }

    console.log('Demo user seed summary:');
    if (created.length > 0) {
      console.log('Created:');
      created.forEach((email) => console.log(`- ${email}`));
    }

    if (alreadyPresent.length > 0) {
      console.log('Already present:');
      alreadyPresent.forEach((email) => console.log(`- ${email}`));
    }

    if (created.length === 0 && alreadyPresent.length === 0) {
      console.log('No demo users processed.');
    }

    console.log('Demo credentials:');
    demoUsers.forEach((user) => {
      console.log(`${user.email} / ${user.password} (${user.role})`);
    });
  } catch (error) {
    console.error('Seed error:', error);
  }
};

module.exports = seedUsers;
