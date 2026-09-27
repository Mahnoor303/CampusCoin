const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Insight must belong to a user'],
      index: true,
    },
    month: {
      type: String,
      required: [true, 'Month is required (e.g. 2026-09)'],
      match: [/^\d{4}-\d{2}$/, 'Month format must be YYYY-MM'],
      index: true,
    },
    summaryText: {
      type: String,
      required: [true, 'Insight summary is required'],
      trim: true,
    },
    tipText: {
      type: String,
      required: [true, 'Insight actionable tip is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['spending_surge', 'budget_warning', 'saving_opportunity', 'general_summary'],
        message: '{VALUE} is not a valid insight type',
      },
      default: 'general_summary',
    },
    severity: {
      type: String,
      enum: {
        values: ['info', 'warning', 'critical', 'success'],
        message: '{VALUE} is not a valid severity level',
      },
      default: 'info',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false, // For bookmarking/pinning per SRS page 8
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

insightSchema.virtual('title')
  .get(function () { return this.summaryText; })
  .set(function (v) { this.summaryText = v; });

insightSchema.virtual('message')
  .get(function () { return this.tipText; })
  .set(function (v) { this.tipText = v; });

insightSchema.index({ user: 1, month: 1 });
insightSchema.index({ user: 1, generatedAt: -1 });

const Insight = mongoose.model('Insight', insightSchema);

module.exports = Insight;
