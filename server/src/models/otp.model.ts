import mongoose, { Document, Schema } from 'mongoose'

export type OtpType = 'register' | 'forgot-password'

export interface IOtpDocument extends Document {
  email: string
  otp: string
  type: OtpType
  expiresAt: Date
  createdAt: Date
}

const otpSchema = new Schema<IOtpDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['register', 'forgot-password'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

// MongoDB TTL index – automatically removes expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
otpSchema.index({ email: 1, type: 1 })

const Otp = mongoose.model<IOtpDocument>('Otp', otpSchema)
export default Otp
