import mongoose, { Document, Schema } from 'mongoose';

import { IReminder } from '../../../shared/src/route.types';

export interface IReminderDocument extends Omit<IReminder, '_id' | 'userId' | 'stopId' | 'routeId'>, Document {
  userId: mongoose.Types.ObjectId;
  stopId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
}

const reminderSchema = new Schema<IReminderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stopId: {
      type: Schema.Types.ObjectId,
      ref: 'Stop',
      required: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    minutesBefore: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
      default: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationType: {
      type: String,
      enum: ['push', 'sms', 'both'],
      default: 'push',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reminderSchema.index({ userId: 1, isActive: 1 });
reminderSchema.index({ routeId: 1, stopId: 1, isActive: 1 });

const Reminder = mongoose.model<IReminderDocument>('Reminder', reminderSchema);

export default Reminder;
