import { Module } from '@nestjs/common';
import { SubSpecialityService } from './sub-speciality.service';
import { SubSpecialityController } from './sub-speciality.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SubSpecialitySchema } from './schemas/sub-speciality.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SubSpeciality', schema: SubSpecialitySchema },
    ]),
  ],
  controllers: [SubSpecialityController],
  providers: [SubSpecialityService],
})
export class SubSpecialityModule {}
