import { Document } from 'mongoose';

export interface Message extends Document {
  subject: string;
  content: string;
  canal: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'ALL';
  source?: 'DATABASE' | 'FILE';
  emails?: string[];
  phoneNumbers?: string[];
  exclusions?: string[];
  region?: string;
  excludedRegions?: string[];
  excludedLabs?: string[];
  excludedStructures?: string[];
  cc?: string[];
  cci?: string[];
  sentBy: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  errorMessage?: string;
  attachments?: string[];
  created_at: Date;
  updated_at: Date;
}
