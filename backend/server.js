require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/db');
const seedUsers = require('./src/seed');
const seedLogs = require('./src/seedLogs');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const logRoutes = require('./src/routes/logs');
const baselineRoutes = require('./src/routes/baseline');
const alertRoutes = require('./src/routes/alerts');
const caseRoutes = require('./src/routes/cases');
const reportRoutes = require('./src/routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/baseline', baselineRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/reports', reportRoutes);

const startServer = async () => {
  await connectDB();
  await seedUsers();
  await seedLogs();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
