import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class DimensionValidationService {
  async validateDimensions(accountId: string, dimensions: any, accountMetadata: any): Promise<boolean> {
    // metadata might look like: { requiredDimensions: ['departmentId', 'costCenterId'] }
    if (accountMetadata?.requiredDimensions) {
      for (const dim of accountMetadata.requiredDimensions) {
        if (!dimensions[dim]) {
          throw new BadRequestException(`Dimension ${dim} is required for this account`);
        }
      }
    }
    return true;
  }
}
