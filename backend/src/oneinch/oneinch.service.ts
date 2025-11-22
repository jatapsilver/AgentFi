import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { GetQuoteDto } from './dto/get-quote.dto';
import { BuildSwapTxDto } from './dto/build-swap-tx.dto';
import { SwapQuoteLog } from './entities/swap-quote-log.entity';

@Injectable()
export class OneInchService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly chainId: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(SwapQuoteLog)
    private readonly swapQuoteLogRepo: Repository<SwapQuoteLog>,
  ) {
    this.apiKey = this.configService.get<string>('ONEINCH_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'ONEINCH_BASE_URL',
      'https://api.1inch.dev',
    );
    this.chainId = this.configService.get<string>('ONEINCH_CHAIN_ID', '1');
  }

  private getAuthHeaders() {
    const headers: Record<string, string> = {
      accept: 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async getQuote(dto: GetQuoteDto, userId?: string) {
    const url = `${this.baseUrl}/swap/v6.0/${this.chainId}/quote`;
    const params: any = {
      src: dto.fromTokenAddress,
      dst: dto.toTokenAddress,
      amount: dto.amount,
    };
    if (dto.fromAddress) params.from = dto.fromAddress;
    if (dto.slippage) params.slippage = dto.slippage;

    console.log('1inch Request:', { url, params, chainId: this.chainId });

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params, headers: this.getAuthHeaders() }),
      );
      const data = response.data;

      const log = new SwapQuoteLog();
      log.userId = userId;
      log.chainId = String(this.chainId);
      log.fromTokenAddress = dto.fromTokenAddress;
      log.toTokenAddress = dto.toTokenAddress;
      log.amountIn = dto.amount;
      log.amountOut = data?.dstAmount ?? data?.toAmount ?? null;
      log.fromAddress = dto.fromAddress ?? null;
      log.oneInchRequestId = data?.requestId ?? data?.id ?? null;
      log.rawResponse = data ?? null;

      await this.swapQuoteLogRepo.save(log);

      return data;
    } catch (err) {
      console.error(
        '1inch API Error:',
        err?.response?.data || err?.message || err,
      );
      throw new InternalServerErrorException(
        `Error fetching quote from 1inch: ${err?.response?.data?.description || err?.message || 'Unknown error'}`,
      );
    }
  }

  async buildSwapTx(dto: BuildSwapTxDto) {
    const url = `${this.baseUrl}/swap/v6.0/${this.chainId}/swap`;
    const params: any = {
      src: dto.fromTokenAddress,
      dst: dto.toTokenAddress,
      amount: dto.amount,
      from: dto.fromAddress,
    };
    if (dto.slippage) params.slippage = dto.slippage;
    if (dto.destReceiver) params.receiver = dto.destReceiver;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params, headers: this.getAuthHeaders() }),
      );
      return response.data;
    } catch (err) {
      console.error(
        '1inch API Error:',
        err?.response?.data || err?.message || err,
      );
      throw new InternalServerErrorException(
        `Error building swap transaction with 1inch: ${err?.response?.data?.description || err?.message || 'Unknown error'}`,
      );
    }
  }

  async getWalletBalances(address: string) {
    const url = `${this.baseUrl}/balance/v1.2/${this.chainId}/balances/${address}`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.getAuthHeaders() }),
      );
      return response.data;
    } catch (err) {
      console.error(
        '1inch API Error:',
        err?.response?.data || err?.message || err,
      );
      throw new InternalServerErrorException(
        `Error fetching balances from 1inch: ${err?.response?.data?.description || err?.message || 'Unknown error'}`,
      );
    }
  }

  healthCheck() {
    return {
      ok: true,
      baseUrl: this.baseUrl,
      chainId: this.chainId,
      hasApiKey: Boolean(this.apiKey && this.apiKey.length > 0),
    };
  }

  async getQuoteLogs() {
    return this.swapQuoteLogRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getQuoteLogById(id: string) {
    const found = await this.swapQuoteLogRepo.findOneBy({ id });
    if (!found) throw new NotFoundException('Quote log not found');
    return found;
  }
}
