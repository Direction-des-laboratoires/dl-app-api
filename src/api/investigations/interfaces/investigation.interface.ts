import { Document } from 'mongoose';
import { InvestigationStatusEnum } from 'src/utils/enums/investigation-status.enum';
import { InvestigationType } from 'src/utils/enums/investigation-type.enum';

export interface Investigation extends Document {
  title: string;
  description?: string;
  active: boolean;
  type: InvestigationType;
  status: InvestigationStatusEnum;
  startDate?: Date;
  endDate?: Date;
  created_at: Date;
  updated_at: Date;
}
