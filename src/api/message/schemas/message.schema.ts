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
  source: {
    type: String,
    enum: ['DATABASE', 'FILE'],
    default: 'DATABASE',
  },
  emails: {
    type: [String],
    default: [],
  },
  phoneNumbers: {
    type: [String],
    default: [],
  },
  exclusions: {
    type: [String],
    default: [],
  },
  region: {
    type: mongoose.Schema.ObjectId,
    ref: 'Region',
    default: null,
  },
  excludedRegions: {
    type: [{ type: mongoose.Schema.ObjectId, ref: 'Region' }],
    default: [],
  },
  excludedLabs: {
    type: [{ type: mongoose.Schema.ObjectId, ref: 'Lab' }],
    default: [],
  },
  excludedStructures: {
    type: [{ type: mongoose.Schema.ObjectId, ref: 'Structure' }],
    default: [],
  },
  cc: {
    type: [String],
    default: [],
  },
  cci: {
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
