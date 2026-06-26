import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RegionPoleService } from './region-pole.service';
import { CreateRegionPoleDto } from './dto/create-region-pole.dto';
import { UpdateRegionPoleDto } from './dto/update-region-pole.dto';
import { FindRegionPoleDto } from './dto/find-region-pole.dto';

@Controller('region-poles')
export class RegionPoleController {
  constructor(private readonly regionPoleService: RegionPoleService) {}

  @Post()
  create(@Body() createRegionPoleDto: CreateRegionPoleDto) {
    return this.regionPoleService.create(createRegionPoleDto);
  }

  @Get()
  findAll(@Query() query: FindRegionPoleDto) {
    return this.regionPoleService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionPoleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRegionPoleDto: UpdateRegionPoleDto) {
    return this.regionPoleService.update(id, updateRegionPoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.regionPoleService.remove(id);
  }
}
