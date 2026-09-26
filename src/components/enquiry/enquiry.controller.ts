import {
  Controller,
  Get,
  Body,
  Param,
  HttpStatus,
  Res,
  Query,
  Post,
  Req,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { EnquiryService } from './enquiry.service';
import { UpdateEnquiryDto } from './dto/update-contact.dto';

@ApiTags('Enquiry')
@Controller('enquiry')
export class EnquiryController {
  constructor(private readonly enquiryService: EnquiryService) {}

  @Post()
  async create(@Res() res, @Body() createEnquiryDto: CreateEnquiryDto) {
    const contact = await this.enquiryService.create(createEnquiryDto);
    return res.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      message: 'Created Enquiry Successfully',
      data: { ...contact },
    });
  }

  @Get()
  async findAll(
    @Res() res,
    @Query() findAllQueryDefaultDTO: FindAllQueryDefaultDTO,
  ) {
    const data = await this.enquiryService.findAll(findAllQueryDefaultDTO);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Enquiries',
      data: data,
    });
  }

  @Patch(':id')
  async update(
    @Res() res,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateEnquiryDto,
  ) {
    const updatedMRUser = await this.enquiryService.update(id, updateUserDto);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Updated Enquiry Successfully',
      data: { ...updatedMRUser },
    });
  }

  @Get(':id')
  async findOne(@Res() res, @Param('id') id: string) {
    const mrUser = await this.enquiryService.findById(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Enquiries',
      data: { ...mrUser },
    });
  }
}
