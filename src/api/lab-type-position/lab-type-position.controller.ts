import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LabTypePositionService } from './lab-type-position.service';
import { CreateLabTypePositionDto } from './dto/create-lab-type-position.dto';
import { FindLabTypePositionDto } from './dto/find-lab-type-position.dto';
import { UpdateLabTypePositionDto } from './dto/update-lab-type-position.dto';

@Controller('lab-type-positions')
export class LabTypePositionController {
  constructor(private readonly labTypePositionService: LabTypePositionService) {}

  @Post()
  create(@Body() createLabTypePositionDto: CreateLabTypePositionDto) {
    return this.labTypePositionService.create(createLabTypePositionDto);
  }

  @Post('bulk')
  createBulk(
    @Body('labType') labType: string,
    @Body('positions') positions: string[],
  ) {
    return this.labTypePositionService.createBulk(labType, positions);
  }

  @Get()
  findAll(@Query() query: FindLabTypePositionDto) {
    return this.labTypePositionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.labTypePositionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLabTypePositionDto: UpdateLabTypePositionDto) {
    return this.labTypePositionService.update(id, updateLabTypePositionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.labTypePositionService.remove(id);
  }
}
