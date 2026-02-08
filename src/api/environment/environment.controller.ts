import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { EnvironmentService } from './environment.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { FindEnvironmentDto } from './dto/find-environment.dto';

@Controller('environments')
export class EnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  @Post()
  create(@Body() createEnvironmentDto: CreateEnvironmentDto) {
    return this.environmentService.create(createEnvironmentDto);
  }

  @Get()
  findAll(@Query() query: FindEnvironmentDto, @Req() req: any) {
    const userRole = req.user?.role;
    return this.environmentService.findAll(query, userRole);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.environmentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnvironmentDto: UpdateEnvironmentDto) {
    return this.environmentService.update(id, updateEnvironmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.environmentService.remove(id);
  }
}
