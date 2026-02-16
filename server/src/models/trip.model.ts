import mongoose, { Document, Schema } from 'mongoose';

import { ITrip } from '../../../shared/src/route.types';

export interface ITripDocument extends Omit<ITrip, '_id' | 'busId' | 'driverId' | 'routeId'>, Document {
  busId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
}

const tripSchema = new Schema<ITripDocument>(
  {
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed'],
      default: 'ongoing',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
tripSchema.index({ busId: 1, status: 1 });
tripSchema.index({ driverId: 1, status: 1 });
tripSchema.index({ routeId: 1, status: 1 });
tripSchema.index({ status: 1, startTime: -1 });

const Trip = mongoose.model<ITripDocument>('Trip', tripSchema);

export default Trip;
