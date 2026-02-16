import mongoose, { Document, Schema } from 'mongoose';

import { ILocationUpdate } from '../../../shared/src/route.types';

export interface ILocationUpdateDocument extends Omit<ILocationUpdate, '_id' | 'tripId' | 'busId'>, Document {
  tripId: mongoose.Types.ObjectId;
  busId: mongoose.Types.ObjectId;
}

const locationUpdateSchema = new Schema<ILocationUpdateDocument>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,
    },
    heading: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes for efficient querying
locationUpdateSchema.index({ tripId: 1, timestamp: 1 });
locationUpdateSchema.index({ busId: 1, timestamp: -1 });
locationUpdateSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // TTL: 7 days

const LocationUpdate = mongoose.model<ILocationUpdateDocument>('LocationUpdate', locationUpdateSchema);

export default LocationUpdate;
