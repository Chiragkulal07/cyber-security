const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    actionType: {
      type: String,
      enum: ['login', 'sudo', 'db_query', 'file_access', 'file_download', 'config_change', 'permission_change'],
      required: true,
    },
    resource: {
      type: String,
    },
    ip: {
      type: String,
    },
    sessionId: {
      type: String,
    },
    dataVolumeMB: {
      type: Number,
      default: 0,
    },
    rawData: {
      type: String,
    },
  },
  { timestamps: true }
);

logSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);
