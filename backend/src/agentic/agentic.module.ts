import { Module } from "@nestjs/common";
import { AgenticLayerService } from "./agentic-layer.service";

@Module({
  providers: [AgenticLayerService],
  exports: [AgenticLayerService],
})
export class AgenticModule {}
