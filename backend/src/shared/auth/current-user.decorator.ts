import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from './jwt-payload.type';

type RequestWithUser = {
  user?: JwtPayload;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
