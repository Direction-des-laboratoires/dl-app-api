import { Document } from 'mongoose';

export interface Message extends Document {
  subject: string;
  content: string;
  canal: 'EMAIL' | 'SMS' | 'WHATSAPP';
  emails?: string[];
  phoneNumbers?: string[];
  sentBy: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  errorMessage?: string;
  attachments?: string[];
  created_at: Date;
  updated_at: Date;
}
