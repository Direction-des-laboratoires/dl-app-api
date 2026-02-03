import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ContractTypeService } from './contract-type.service';
import { CreateContractTypeDto } from './dto/create-contract-type.dto';
import { UpdateContractTypeDto } from './dto/update-contract-type.dto';
import { FindContractTypeDto } from './dto/find-contract-type.dto';

@Controller('contract-types')
export class ContractTypeController {
  constructor(private readonly contractTypeService: ContractTypeService) {}

  @Post()
  create(@Body() createContractTypeDto: CreateContractTypeDto) {
    return this.contractTypeService.create(createContractTypeDto);
  }

  @Get()
  findAll(@Query() query: FindContractTypeDto) {
    return this.contractTypeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContractTypeDto: UpdateContractTypeDto) {
    return this.contractTypeService.update(id, updateContractTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractTypeService.remove(id);
  }
}
