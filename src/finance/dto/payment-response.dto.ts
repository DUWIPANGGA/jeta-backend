// src/finance/dto/payment-response.dto.ts
export class PaymentResponseDto {
    message: string;
    payment_id: number;
    total_amount?: number;
    proof?: string;
}