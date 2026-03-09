import { Module } from "@nestjs/common";
import { useDbPersistence } from "../../shared/persistence.mode";
import { ITController } from "./it.controller";
import { ITService } from "./it.service";
import { ITDbRepository } from "./repositories/it.db.repository";
import { IITRepository } from "./repositories/it.repository.interface";
import { ITMockRepository } from "./repositories/it.mock.repository";
import { PrismaService } from "../../persistence/prisma.service";

@Module({
  controllers: [ITController],
  providers: [
    ITService,
    PrismaService,
    {
      provide: IITRepository,
      useClass: useDbPersistence() ? ITDbRepository : ITMockRepository,
    },
  ],
  exports: [ITService],
})
export class ITModule {}
