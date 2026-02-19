/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable prettier/prettier */

import { Document } from 'mongoose';

export interface User extends Document {
  firstname: string;
  lastname: string;
  phoneNumber: string;
  email: string;
  gender?: string;
  identificationNumber?: string;
  disabled?: boolean;
  disabledDetails?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  numberOfWives?: number;
  lab: any;
  role: string;
  environment: any;
  environmentPosition: any;
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
  videoPresentation?: string;
  created_at: Date;
  updated_at: Date;
}
