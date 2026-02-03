import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractTypeService } from './contract-type.service';
import { ContractTypeController } from './contract-type.controller';
import { ContractTypeSchema } from './schemas/contract-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'ContractType', schema: ContractTypeSchema }]),
  ],
  controllers: [ContractTypeController],
  providers: [ContractTypeService],
  exports: [ContractTypeService],
})
export class ContractTypeModule {}
