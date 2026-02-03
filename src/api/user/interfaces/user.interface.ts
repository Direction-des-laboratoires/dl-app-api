/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable prettier/prettier */

import { Document } from 'mongoose';

export interface User extends Document {
  firstname: string;
  lastname: string;
  phoneNumber: string;
  email: string;
  lab: any;
  role: string;
  environment: any;
  environmentPosition: any;
  contractType: any;
  specialities: string[];
  password: string;
  region: string;
  status: string;
  active: boolean;
  isFirstLogin: boolean;
  profilePhoto?: string;
  created_at: Date;
  updated_at: Date;
}
