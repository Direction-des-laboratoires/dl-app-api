import * as mongoose from 'mongoose';
import { CanalEnum } from '../dto/create-message.dto';

export const MessageSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  canal: {
    type: String,
    required: true,
    enum: CanalEnum,
  },
  emails: {
    type: [String],
    default: [],
  },
  phoneNumbers: {
    type: [String],
    default: [],
  },
  sentBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
  sentAt: {
    type: Date,
    default: null,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  attachments: {
    type: [String],
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
  updated_at: {
    type: Date,
    default: Date.now(),
  },
});
