import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

import { IUser, UserRole } from '../../../shared/src/user.types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.RIDER,
    },
    homeStop: {
      type: Schema.Types.ObjectId,
      ref: 'Stop',
    },
    isApproved: {
      type: Boolean,
      default: function(this: IUserDocument) {
        // Riders are auto-approved, drivers need admin approval
        return this.role === UserRole.RIDER;
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      type: String,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
// Note: email already has unique: true which creates an index automatically
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });

const User = mongoose.model<IUserDocument>('User', userSchema);

export default User;
