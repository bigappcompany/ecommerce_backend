import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Res,
  Query,
  HttpStatus,
  Req,
  Patch,
} from '@nestjs/common';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import { AuthGuard } from '@nestjs/passport';
import { WebCrawlerService } from './web-crawler.service';
import { CreateWebCrawlerDto } from './dto/create-web-crawler.dto';
import { UpdateWebCrawlerDto } from './dto/update-web-crawler.dto';

@ApiTags('Web Crawler')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard)
@Controller('web-crawler')
export class WebCrawlerController {
  constructor(private readonly webcrawlerService: WebCrawlerService) {}

  @Post()
  async create(
    @Res() res,
    @Req() req,
    @Body() createWebCrawlerDto: CreateWebCrawlerDto,
  ) {
    const webCrawlers = await this.webcrawlerService.create(
      req,
      createWebCrawlerDto,
    );
    return res.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      message: 'Created Successfully',
      data: { ...webCrawlers },
    });
  }

  @Patch(':id')
  async update(
    @Res() res,
    @Param('id') id: string,
    @Body() updateUserAPIKeyDto: UpdateWebCrawlerDto,
  ) {
    const webCrawlers = await this.webcrawlerService.update(
      id,
      updateUserAPIKeyDto,
    );
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Updated Successfully',
      data: { ...webCrawlers },
    });
  }

  @Get()
  async findAll(
    @Res() res,
    @Query() findAllQueryDefaultDTO: FindAllQueryDefaultDTO,
  ) {
    const data = await this.webcrawlerService.findAll(findAllQueryDefaultDTO);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'UserAPIKeys',
      data: data,
    });
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webcrawlerService.findOne(+id);
  }

  @Delete(':id')
  remove(@Res() res, @Param('id') id: string) {
    const webCrawlers = this.webcrawlerService.remove(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Deleted Successfully',
      data: { ...webCrawlers },
    });
  }
}
