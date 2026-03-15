import * as mongoose from 'mongoose';
import * as autopopulate from 'mongoose-autopopulate';

export const LabSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  structure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Structure',
    default: null,
    autopopulate: true,
  },
  specialities: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Speciality',
    default: [],
    autopopulate: true,
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabType',
    default: null,
    autopopulate: true,
  },
  lat: {
    type: String,
    default: null,
  },
  lng: {
    type: String,
    default: null,
  },
  director: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    autopopulate: true,
    //required:true
  },
  responsible: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    autopopulate: true,
    //required:true
  },
  phoneNumber: {
    type: String,
  },
  email: {
    type: String,
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
LabSchema.plugin(autopopulate);

// Cascade delete related documents when a lab is deleted
LabSchema.pre(
  ['findOneAndDelete', 'deleteOne'],
  { query: true, document: false },
  async function (next) {
    try {
      const query = this.getQuery();
      const labId = query._id;

      if (labId) {

        // Delete related Equipments
        await mongoose.model('Equipment').deleteMany({ lab: labId });

        // Delete related EquipmentOrders
        await mongoose.model('EquipmentOrder').deleteMany({ lab: labId });

        // Delete related EquipmentStocks
        await mongoose.model('EquipmentStock').deleteMany({ lab: labId });

        // Delete related Users (staff)
        await mongoose.model('User').deleteMany({ lab: labId });
      }
      next();
    } catch (error) {
      next(error);
    }
  },
);
