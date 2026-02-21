import { Module } from '@nestjs/common';
import { useDbPersistence } from '../../shared/persistence.mode';
import { PersistenceModule } from '../../persistence/persistence.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentDbRepository } from './repositories/payment.db.repository';
import { PaymentMockRepository } from './repositories/payment.mock.repository';
import { IPaymentRepository } from './repositories/payment.repository.interface';

@Module({
  imports: [PersistenceModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: IPaymentRepository,
      useClass: useDbPersistence() ? PaymentDbRepository : PaymentMockRepository,
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}

