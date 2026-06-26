/* eslint-disable prettier/prettier */
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/utils/enums/roles.enum';
import { Gender } from 'src/utils/enums/gender.enum';
import { MaritalStatus } from 'src/utils/enums/marital-status.enum';
import { ExperienceRange } from 'src/utils/enums/experience-range.enum';
export const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    default: null,
  },
  phoneNumber2: {
    type: String,
    default: null,
  },
  whatsappNumber: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  birthday: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: Gender,
    default: null,
  },
  nationality: {
    type: String,
    default: null,
  },
  regionOrigine: {
    type: String,
    default: null,
  },
  identificationType: {
    type: String,
    default: null,
  },
  identificationNumber: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  disabilityDetails: {
    type: String,
  },
  maritalStatus: {
    type: String,
    enum: MaritalStatus,
    default: MaritalStatus.SINGLE,
  },
  numberOfChildren: {
    type: Number,
    default: 0,
  },
  numberOfWives: {
    type: Number,
    default: 0,
  },
  bloodGroup: {
    type: String,
  },
  experienceDuration: {
    type: String,
    enum: ExperienceRange,
    default: null,
  },
  // laborDuration: {
  //   type: String,
  //   enum: ExperienceRange,
  //   default: null,
  // },
  contractProjet: {
    type: String,
    default: null,
  },
  matricule: {
    type: String,
    default: null,
  },
  isLucrative: {
    type: Boolean,
  },
  entryDate: {
    type: Date,
  },
  lab: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lab',
  },
  region: {
    type: mongoose.Schema.ObjectId,
    ref: 'Region',
  },
  role: {
    type: String,
    enum: Role,
    required: true,
    default: Role.LabStaff,
  },
  level: {
    type: mongoose.Schema.ObjectId,
    ref: 'StaffLevel',
    // required: function () {
    //   return ![Role.SdrAdmin, Role.SuperAdmin].includes(this.role);
    // },
    default: null,
  },
  environment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Environment',
    default: null,
  },
  environmentPosition: {
    type: mongoose.Schema.ObjectId,
    ref: 'EnvironmentPosition',
    default: null,
  },
  position: {
    type: mongoose.Schema.ObjectId,
    ref: 'Position',
    default: null,
  },
  contractType: {
    type: mongoose.Schema.ObjectId,
    ref: 'ContractType',
    default: null,
  },
  specialities: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Speciality',
    default: [],
    autopopulate: true,
  },
  subSpecialities: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'SubSpeciality',
    default: [],
    autopopulate: true,
  },
  password: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  isFirstLogin: {
    type: Boolean,
    default: true,
  },
  profilePhoto: {
    type: String,
    default: null,
  },
  cv: {
    type: String,
    default: null,
  },
  presentationVideo: {
    type: String,
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

// Unicité uniquement si le numéro est renseigné (permet plusieurs null/vides)
UserSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phoneNumber: { $type: 'string', $ne: '' },
    },
  },
);

UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }
    const hashed = await bcrypt.hash(this['password'], 10);
    this['password'] = hashed;

    if (this.role === Role.SuperAdmin) {
      this.region = null;
      this.lab = null;
    }

    if (this.role === Role.RegionAdmin) {
      this.lab = null;
      if (!this.region) {
        throw new Error('Un responsable de region doit avoir un region');
      }
    }

    if (this.role === Role.SdrAdmin) {
      this.lab = null;
      this.region = null;
    }

    if (
      [Role.LabAdmin.toString(), Role.LabStaff.toString()].includes(this.role)
    ) {
      if (!this.lab) {
        throw new Error(
          'Un personnel de laboratoire doit avoir un laboratoryId',
        );
      }
      // if (!this.entryDate) {
      //   throw new Error(
      //     "Un personnel de laboratoire doit avoir une date d'entrée",
      //   );
      // }
    }

    return next();
  } catch (error) {
    throw next(error);
  }
});
