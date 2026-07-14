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
    const count = await User.countDocuments();
    if (count > 0) {
      return;
    }

    const hashedUsers = await Promise.all(
      demoUsers.map(async (user) => ({
        ...user,
        passwordHash: await bcrypt.hash(user.password, 10),
      }))
    );

    await User.insertMany(hashedUsers);

    console.log('Demo users seeded successfully.');
    console.log('Demo credentials:');
    demoUsers.forEach((user) => {
      console.log(`${user.email} / ${user.password} (${user.role})`);
    });
  } catch (error) {
    console.error('Seed error:', error);
  }
};

module.exports = seedUsers;
