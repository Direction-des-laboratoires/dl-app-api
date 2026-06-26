/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable prettier/prettier */

import { Document } from 'mongoose';
import { ExperienceRange } from 'src/utils/enums/experience-range.enum';

export interface User extends Document {
  firstname: string;
  lastname: string;
  phoneNumber: string;
  phoneNumber2?: string;
  whatsappNumber?: string;
  email: string;
  birthday?: Date;
  nationality?: string;
  regionOrigine?: string;
  gender?: string;
  identificationType?: string;
  identificationNumber?: string;
  bloodGroup?: string;
  experienceDuration?: ExperienceRange | string;
  // dureeLabo?: ExperienceRange | string;
  contractProjet?: string;
  matricule?: string;
  isLucrative?: boolean;
  disabled?: boolean;
  disabilityDetails?: string;
  disabledDetails?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  numberOfWives?: number;
  lab: any;
  role: string;
  environment: any;
  environmentPosition: any;
  position?: any;
  contractType: any;
  specialities: string[];
  subSpecialities?: string[];
  password: string;
  region: string;
  status: string;
  active: boolean;
  isFirstLogin: boolean;
  profilePhoto?: string;
  cv?: string;
  presentationVideo?: string;
  created_at: Date;
  updated_at: Date;
}
