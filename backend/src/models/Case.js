const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    alertIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
      required: true,
      default: [],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'escalated'],
      required: true,
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      default: 'medium',
    },
    notes: {
      type: [noteSchema],
      default: [],
    },
    resolution: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

caseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

caseSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

caseSchema.index({ status: 1 });
caseSchema.index({ userId: 1 });

module.exports = mongoose.model('Case', caseSchema);
