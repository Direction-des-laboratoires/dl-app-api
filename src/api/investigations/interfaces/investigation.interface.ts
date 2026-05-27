import { Document } from 'mongoose';
import { InvestigationStatusEnum } from 'src/utils/enums/investigation-status.enum';

export interface Investigation extends Document {
  title: string;
  description?: string;
  active: boolean;
  status: InvestigationStatusEnum;
  startDate?: Date;
  endDate?: Date;
  created_at: Date;
  updated_at: Date;
}
