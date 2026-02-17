import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LabTypeService } from './lab-type.service';
import { CreateLabTypeDto } from './dto/create-lab-type.dto';
import { FindLabTypeDto } from './dto/find-lab-type.dto';
import { UpdateLabTypeDto } from './dto/update-lab-type.dto';

@Controller('lab-types')
export class LabTypeController {
  constructor(private readonly labTypeService: LabTypeService) {}

  @Post()
  create(@Body() createLabTypeDto: CreateLabTypeDto) {
    return this.labTypeService.create(createLabTypeDto);
  }

  @Get()
  findAll(@Query() query: FindLabTypeDto) {
    return this.labTypeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.labTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLabTypeDto: UpdateLabTypeDto) {
    return this.labTypeService.update(id, updateLabTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.labTypeService.remove(id);
  }
}
