import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyPortalJwt } from "@moa/shared/auth";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];
    try {
      const payload = await verifyPortalJwt(token, process.env.JWT_SECRET ?? "replace_me");
      request.user = payload;
      return true;
    } catch (e) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
