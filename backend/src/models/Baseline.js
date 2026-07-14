const mongoose = require('mongoose');

const baselineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    typicalHourRange: {
      startHour: { type: Number },
      endHour: { type: Number },
    },
    typicalIPs: {
      type: [String],
      default: [],
    },
    typicalActionTypes: {
      type: [String],
      default: [],
    },
    avgDataVolumeMB: {
      type: Number,
      default: 0,
    },
    stdDevDataVolumeMB: {
      type: Number,
      default: 0,
    },
    typicalResources: {
      type: [String],
      default: [],
    },
    eventsAnalyzed: {
      type: Number,
      default: 0,
    },
    lastBuiltAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

baselineSchema.index({ userId: 1 });

module.exports = mongoose.model('Baseline', baselineSchema);
