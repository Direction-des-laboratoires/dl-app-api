import * as mongoose from 'mongoose';
import autopopulate from 'mongoose-autopopulate';
import { HandoverStatus } from '../interfaces/responsible-handover.interface';

const NewResponsibleSchema = new mongoose.Schema(
  {
    firstname: { type: String, default: null },
    lastname: { type: String, default: null },
    email: { type: String, default: null },
    phoneNumber: { type: String, default: null },
  },
  { _id: false },
);

export const ResponsibleHandoverSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
    autopopulate: true,
  },
  previousResponsible: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    autopopulate: {
      select: 'firstname lastname email phoneNumber role active lab',
    },
  },
  // true = toujours responsable, false = signale un changement
  stillResponsible: {
    type: Boolean,
    default: false,
  },
  newResponsible: {
    type: NewResponsibleSchema,
    default: () => ({}),
  },
  status: {
    type: String,
    enum: HandoverStatus,
    default: HandoverStatus.Pending,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  newResponsibleUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
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

ResponsibleHandoverSchema.plugin(autopopulate);
