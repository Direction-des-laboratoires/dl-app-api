import { Document } from 'mongoose';

export interface Lab extends Document {
  name: string;
  structure: string;
  type?: string;
  lat: string;
  lng: string;
  director: string;
  responsible: string;
  phoneNumber: string;
  email: string;
  specialities: string[];
  updated_at: Date;
}
