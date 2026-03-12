import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { parseUploadedImage } from '../../shared/http/uploaded-image.util';
import type { MultipartRequest } from '../../shared/http/multipart-request.type';
import { CreatePointDto } from './dto/create-point.dto';
import { QueryPointsDto } from './dto/query-points.dto';
import { UpdatePointLocationDto } from './dto/update-point-location.dto';
import { UpdatePointDto } from './dto/update-point.dto';
import { PointsService } from './points.service';

@Controller('points')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.MANAGER)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Post()
  createPoint(@Body() dto: CreatePointDto) {
    return this.pointsService.create(dto);
  }

  @Get()
  getPoints(@Query() query: QueryPointsDto) {
    return this.pointsService.findAll(query);
  }

  @Get(':id')
  getPoint(@Param('id', ParseUUIDPipe) id: string) {
    return this.pointsService.findByIdOrThrow(id);
  }

  @Patch(':id')
  updatePoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePointDto,
  ) {
    return this.pointsService.update(id, dto);
  }

  @Patch(':id/location')
  updatePointLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePointLocationDto,
  ) {
    return this.pointsService.updateLocation(id, dto);
  }

  @Delete(':id')
  deletePoint(@Param('id', ParseUUIDPipe) id: string) {
    return this.pointsService.remove(id);
  }

  @Post(':id/photos')
  async uploadPointPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: MultipartRequest,
  ) {
    const file = await request.file();
    const image = await parseUploadedImage(file);

    return this.pointsService.uploadPhoto(id, image);
  }

  @Get(':id/photos')
  listPointPhotos(@Param('id', ParseUUIDPipe) id: string) {
    return this.pointsService.listPhotos(id);
  }

  @Delete(':id/photos/:mediaId')
  deletePointPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    return this.pointsService.deletePhoto(id, mediaId);
  }
}
