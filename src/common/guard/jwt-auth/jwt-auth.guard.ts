  import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    Logger,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';

  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(private jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean {
      this.logger.log('🛡️🛡️🛡️ STEP 0: JwtAuthGuard.canActivate() START 🛡️🛡️🛡️');

      const request = context.switchToHttp().getRequest();

      // ============ STEP 1: Cek Cookies ============
      this.logger.log('🔍 STEP 1: Checking for token in cookies...');
      this.logger.log(`   - Request cookies: ${JSON.stringify(request.cookies, null, 2)}`);

      let token = request.cookies?.token;

      if (token) {
        this.logger.log(`✅ STEP 1a: Token found in cookies! (length: ${token.length})`);
        this.logger.log(`   - Token preview: ${token.substring(0, 20)}...`);
      } else {
        this.logger.warn('⚠️ STEP 1a: No token found in cookies');
      }

      // ============ STEP 2: Cek Authorization Header ============
      if (!token) {
        this.logger.log('🔍 STEP 2: Checking Authorization header...');
        const authHeader = request.headers.authorization;
        this.logger.log(`   - Authorization header: ${authHeader ? authHeader.substring(0, 30) + '...' : 'NOT PRESENT'}`);

        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.substring(7);
          this.logger.log(`✅ STEP 2a: Token found in Authorization header! (length: ${token.length})`);
          this.logger.log(`   - Token preview: ${token.substring(0, 20)}...`);
        } else {
          this.logger.warn('⚠️ STEP 2a: No Bearer token in Authorization header');
        }
      }

      // ============ STEP 3: Final token check ============
      if (!token) {
        this.logger.error('❌ STEP 3: NO TOKEN FOUND in cookies OR Authorization header!');
        this.logger.error('   - Available sources checked:');
        this.logger.error('     • request.cookies.token');
        this.logger.error('     • request.headers.authorization (Bearer)');
        throw new UnauthorizedException('Token not found');
      }
      this.logger.log('✅ STEP 3: Token found successfully');

      // ============ STEP 4: Verify token ============
      this.logger.log('🔍 STEP 4: Verifying JWT token...');
      this.logger.log(`   - JWT_SECRET exists: ${process.env.JWT_SECRET ? 'YES' : 'NO'}`);

      try {
        const payload = this.jwtService.verify(token);
        this.logger.log('✅ STEP 4a: Token verification SUCCESS!');
        this.logger.log('   - Verified payload:', payload);
        this.logger.log(`   - Payload keys: ${Object.keys(payload).join(', ')}`);

        // ============ STEP 5: Normalize user object ============
        this.logger.log('🔍 STEP 5: Normalizing user object...');
        this.logger.log(`   - payload.sub: ${payload.sub || 'NOT FOUND'}`);
        this.logger.log(`   - payload.id: ${payload.id || 'NOT FOUND'}`);
        this.logger.log(`   - payload.email: ${payload.email || 'NOT FOUND'}`);

        const userId = payload.sub || payload.id;
        if (!userId) {
          this.logger.error('❌ STEP 5a: No user ID found in payload! (missing sub or id field)');
          this.logger.error('   - Payload must contain either "sub" or "id" field');
          throw new UnauthorizedException('Invalid token payload: missing user ID');
        }

        request.user = {
          id: userId,
          email: payload.email,
          ...payload
        };

        this.logger.log('✅ STEP 5b: User object normalized and set to request.user');
        this.logger.log('   - request.user:', {
          id: request.user.id,
          email: request.user.email,
          hasExtraFields: Object.keys(request.user).length > 2
        });

        // ============ FINAL ============
        this.logger.log('🎉 FINAL: JwtAuthGuard PASSED! User authenticated successfully.');
        this.logger.log('🛡️🛡️🛡️ JwtAuthGuard COMPLETE - Proceeding to next guard/controller 🛡️🛡️🛡️');
        return true;

      } catch (err) {
        this.logger.error('❌ STEP 4b: Token verification FAILED!');
        this.logger.error(`   - Error name: ${err.name}`);
        this.logger.error(`   - Error message: ${err.message}`);

        if (err.name === 'TokenExpiredError') {
          this.logger.error('   - Token has EXPIRED');
        } else if (err.name === 'JsonWebTokenError') {
          this.logger.error('   - Invalid JWT format or signature');
        }

        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  }