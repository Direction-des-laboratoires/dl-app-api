import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentStockDto } from './create-equipment-stock.dto';

export class UpdateEquipmentStockDto extends PartialType(CreateEquipmentStockDto) {}
