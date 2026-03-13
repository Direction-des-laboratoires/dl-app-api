import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EnvironmentPositionService } from './environment-position.service';
import { CreateEnvironmentPositionDto } from './dto/create-environment-position.dto';
import { UpdateEnvironmentPositionDto } from './dto/update-environment-position.dto';
import { FindEnvironmentPositionDto } from './dto/find-environment-position.dto';

@Controller('environment-positions')
export class EnvironmentPositionController {
  constructor(private readonly environmentPositionService: EnvironmentPositionService) {}

  @Post()
  create(@Body() createEnvironmentPositionDto: CreateEnvironmentPositionDto) {
    return this.environmentPositionService.create(createEnvironmentPositionDto);
  }

  @Post('bulk')
  createBulk(
    @Body('environment') environment: string,
    @Body('positions') positions: string[],
  ) {
    return this.environmentPositionService.createBulk(environment, positions);
  }

  @Get()
  findAll(@Query() query: FindEnvironmentPositionDto) {
    return this.environmentPositionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.environmentPositionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnvironmentPositionDto: UpdateEnvironmentPositionDto) {
    return this.environmentPositionService.update(id, updateEnvironmentPositionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.environmentPositionService.remove(id);
  }
}
