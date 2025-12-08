import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * Database Module
 *
 * Provides Prisma ORM access to the entire application.
 * Global module - no need to import in feature modules.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
