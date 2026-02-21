import mongoose, { Document, Schema } from 'mongoose'

export interface IInvitation {
  _id: string
  email: string
  invitedBy: mongoose.Types.ObjectId
  token: string
  expiresAt: Date
  status: 'pending' | 'accepted' | 'revoked'
  createdAt: Date
  updatedAt: Date
}

export interface IInvitationDocument extends Omit<IInvitation, '_id'>, Document {}

const invitationSchema = new Schema<IInvitationDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
invitationSchema.index({ email: 1, status: 1 })
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const Invitation = mongoose.model<IInvitationDocument>('Invitation', invitationSchema)

export default Invitation
