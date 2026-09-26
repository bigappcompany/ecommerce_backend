import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Res,
  UseGuards,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import { UsersService } from './users.service';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Post()
  // async create(
  //   @Res() res,
  //   @Body() createUserWithEmailDto: CreateUserWithEmailDto,
  // ) {
  //   const mrUser = await this.usersService.create(createUserWithEmailDto);
  //   return res.status(HttpStatus.CREATED).json({
  //     statusCode: HttpStatus.CREATED,
  //     message: 'Created User Successfully',
  //     data: { ...mrUser },
  //   });
  // }

  @Get()
  @Roles('admin')
  async findAll(
    @Res() res,
    @Query() findAllQueryDefaultDTO: FindAllQueryDefaultDTO,
  ) {
    const data = await this.usersService.findAll(findAllQueryDefaultDTO);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Users',
      data: data,
    });
  }
  @Get('me')
  async findMe(@Req() req, @Res() res) {
    const mrUser = await this.usersService.findMe(req);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'User',
      data: { ...mrUser },
    });
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Res() res, @Param('id') id: string) {
    const mrUser = await this.usersService.findById(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'User',
      data: { ...mrUser },
    });
  }

  @Patch(':id')
  async update(
    @Req() req,
    @Res() res,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && req.user?.id !== id) {
      throw new ForbiddenException('You can only update your own account');
    }
    if (!isAdmin) {
      delete (updateUserDto as any).role;
      delete (updateUserDto as any).password;
      delete (updateUserDto as any).is_paid;
    }
    const updatedMRUser = await this.usersService.update(id, updateUserDto);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Updated User Successfully',
      data: { ...updatedMRUser },
    });
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Res() res, @Param('id') id: string) {
    await this.usersService.remove(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Deleted User Successfully',
      data: {},
    });
  }
}
