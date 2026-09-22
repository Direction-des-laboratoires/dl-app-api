import { Document } from 'mongoose';

export enum HandoverStatus {
  Pending = 'pending', // Changement signalé, en attente de traitement
  Confirmed = 'confirmed', // Le responsable a confirmé être toujours en poste
  Processed = 'processed', // Le remplacement a été effectué par un admin
}

export interface NewResponsibleInfo {
  firstname?: string;
  lastname?: string;
  email?: string;
  phoneNumber?: string;
}

export interface ResponsibleHandover extends Document {
  lab: string;
  previousResponsible: string;
  stillResponsible: boolean;
  newResponsible: NewResponsibleInfo;
  status: HandoverStatus;
  processedBy?: string;
  newResponsibleUser?: string;
  created_at: Date;
  updated_at: Date;
}
