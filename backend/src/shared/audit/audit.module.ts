import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditChainService } from './audit-chain.service';
import { AuditController } from './audit.controller';
import { PersistenceModule } from '../../persistence/persistence.module';

@Global()
@Module({
  imports: [PersistenceModule],
  providers: [AuditService, AuditChainService],
  controllers: [AuditController],
  exports: [AuditService, AuditChainService],
})
export class AuditModule {}
