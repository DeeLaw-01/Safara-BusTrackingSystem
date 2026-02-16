import mongoose, { Document, Schema } from 'mongoose';

import { IRoute } from '../../../shared/src/route.types';

export interface IRouteDocument extends Omit<IRoute, '_id' | 'stops'>, Document {
  stops: mongoose.Types.ObjectId[];
}

const routeSchema = new Schema<IRouteDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for stops
routeSchema.virtual('stops', {
  ref: 'Stop',
  localField: '_id',
  foreignField: 'routeId',
  options: { sort: { sequence: 1 } },
});

// Indexes
routeSchema.index({ name: 1 });
routeSchema.index({ isActive: 1 });

const Route = mongoose.model<IRouteDocument>('Route', routeSchema);

export default Route;
