import { Controller, Post, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../common/decorators/user.decorator';
import { PaymentResponseDto } from './dto/responses/payment-response.dto';
import { ResponseDto } from '../common/dto/responses/Response.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

@Post('create-intent/:orderId')
  createPaymentIntent(@Param('orderId') orderId: string, @CurrentUser() user: any) : Promise<ResponseDto<PaymentResponseDto>> {
    return this.paymentsService.createPaymentIntent(orderId, user?.id);
  }
}