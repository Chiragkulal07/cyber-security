const mongoose = require('mongoose');

const severityFromScore = (score) => {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
};

const alertSchema = new mongoose.Schema(
  {
    logId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Log',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    reasons: {
      type: [String],
      default: [],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'acknowledged', 'dismissed'],
      required: true,
      default: 'new',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

alertSchema.pre('validate', function (next) {
  if (!this.severity || this.isModified('riskScore')) {
    this.severity = severityFromScore(this.riskScore);
  }
  next();
});

alertSchema.index({ riskScore: -1, timestamp: -1 });
alertSchema.index({ status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
