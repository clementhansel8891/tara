import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TenantInterceptor } from '../../gateway/tenant.interceptor';
import { TenantContext } from '../../gateway/tenant-context.interface';

// Extend Express Request to include tenantContext
interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

/**
 * Finance Controller
 * REST API endpoints for finance operations
 * All endpoints require x-tenant-id header (enforced by TenantInterceptor)
 */
@Controller('finance')
@UseInterceptors(TenantInterceptor)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  /**
   * GET /finance/ledger
   * Get ledger entries for the authenticated tenant
   * Optional query param: locationId
   */
  @Get('ledger')
  async getLedger(
    @Req() request: RequestWithTenant,
    @Query('locationId') locationId?: string,
  ) {
    const { tenantId } = request.tenantContext;
    const ledger = await this.financeService.getLedger(tenantId, locationId);

    return {
      success: true,
      tenantId,
      locationId: locationId || 'all',
      count: ledger.length,
      data: ledger,
    };
  }

  /**
   * POST /finance/transactions
   * Create a new transaction for the authenticated tenant
   */
  @Post('transactions')
  async createTransaction(
    @Req() request: RequestWithTenant,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    const { tenantId, locationId } = request.tenantContext;

    // If locationId is in context but not in DTO, use context locationId
    if (locationId && !createTransactionDto.locationId) {
      createTransactionDto.locationId = locationId;
    }

    const transaction = await this.financeService.createTransaction(
      tenantId,
      createTransactionDto,
    );

    return {
      success: true,
      tenantId,
      message:
        transaction.status === 'pending'
          ? 'Transaction created and pending approval (amount > $5000)'
          : 'Transaction created and approved',
      data: transaction,
    };
  }

  /**
   * GET /finance/balance
   * Get current balance for the authenticated tenant
   */
  @Get('balance')
  async getBalance(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const balance = await this.financeService.getBalance(tenantId);

    return {
      success: true,
      tenantId,
      data: balance,
    };
  }

  /**
   * GET /finance/transactions/:id
   * Get a specific transaction by ID
   */
  @Get('transactions/:id')
  async getTransaction(
    @Req() request: RequestWithTenant,
    @Param('id') transactionId: string,
  ) {
    const { tenantId } = request.tenantContext;
    const transaction = await this.financeService.getTransactionById(tenantId, transactionId);

    if (!transaction) {
      return {
        success: false,
        tenantId,
        message: 'Transaction not found',
        data: null,
      };
    }

    return {
      success: true,
      tenantId,
      data: transaction,
    };
  }
}
