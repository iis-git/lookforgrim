import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { MapMarkersQueryDto } from './dto/map-markers-query.dto';
import { NearestArtistsDto } from './dto/nearest-artists.dto';
import { MapSearchService } from './map-search.service';

@Controller('map')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.OPERATOR,
  UserRole.MANAGER,
  UserRole.MAKEUP_ARTIST,
)
export class MapSearchController {
  constructor(private readonly mapSearchService: MapSearchService) {}

  @Get('markers')
  getMarkers(@Query() query: MapMarkersQueryDto) {
    return this.mapSearchService.getMarkers(query);
  }

  @Post('nearest-artists')
  getNearestArtists(@Body() dto: NearestArtistsDto) {
    return this.mapSearchService.getNearestArtists(dto);
  }
}
