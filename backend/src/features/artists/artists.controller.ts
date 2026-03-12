import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { QueryArtistsDto } from './dto/query-artists.dto';
import { UpdateArtistLocationDto } from './dto/update-artist-location.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { UpsertArtistAvailabilityDto } from './dto/upsert-artist-availability.dto';

@Controller('artists')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.MANAGER)
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Post()
  create(@Body() dto: CreateArtistDto) {
    return this.artistsService.create(dto);
  }

  @Get()
  getArtists(@Query() query: QueryArtistsDto) {
    return this.artistsService.findAll(query);
  }

  @Get(':id')
  getArtist(@Param('id', ParseUUIDPipe) id: string) {
    return this.artistsService.findByIdOrThrow(id);
  }

  @Patch(':id')
  updateArtist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArtistDto,
  ) {
    return this.artistsService.update(id, dto);
  }

  @Patch(':id/location')
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArtistLocationDto,
  ) {
    return this.artistsService.updateLocation(id, dto);
  }

  @Put(':id/availability')
  upsertAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertArtistAvailabilityDto,
  ) {
    return this.artistsService.upsertAvailability(id, dto);
  }

  @Delete(':id')
  removeArtist(@Param('id', ParseUUIDPipe) id: string) {
    return this.artistsService.remove(id);
  }

  @Post(':id/photos')
  async uploadArtistPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: MultipartRequest,
  ) {
    const file = await request.file();
    const image = await parseUploadedImage(file);

    return this.artistsService.uploadPhoto(id, image);
  }

  @Get(':id/photos')
  listArtistPhotos(@Param('id', ParseUUIDPipe) id: string) {
    return this.artistsService.listPhotos(id);
  }

  @Delete(':id/photos/:mediaId')
  deleteArtistPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    return this.artistsService.deletePhoto(id, mediaId);
  }
}
