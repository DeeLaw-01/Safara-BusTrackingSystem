import mongoose, { Document, Schema } from 'mongoose';

import { IBus } from '../../../shared/src/route.types';

export interface IBusDocument extends Omit<IBus, '_id' | 'routeId' | 'driverId'>, Document {
  routeId?: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
}

const busSchema = new Schema<IBusDocument>(
  {
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
busSchema.index({ plateNumber: 1 });
busSchema.index({ routeId: 1 });
busSchema.index({ driverId: 1 });
busSchema.index({ isActive: 1 });

const Bus = mongoose.model<IBusDocument>('Bus', busSchema);

export default Bus;
