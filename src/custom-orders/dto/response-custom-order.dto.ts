import { Expose, Type } from 'class-transformer';

class VariantOptionResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  custom_variant_id: number;

  @Expose()
  custom_variant?: {
    id: number;
    name: string;
  };
}

class CustomOrderItemOptionResponseDto {
  @Expose()
  id: number;

  @Expose()
  variant_option_id: number;

  @Expose()
  @Type(() => VariantOptionResponseDto)
  variant_option: VariantOptionResponseDto;
}

class CustomOrderItemResponseDto {
  @Expose()
  id: number;

  @Expose()
  quantity: number;

  @Expose()
  @Type(() => CustomOrderItemOptionResponseDto)
  selected_options: CustomOrderItemOptionResponseDto[];
}

class PaymentResponseDto {
  @Expose()
  id: number;

  @Expose()
  amount: number;

  @Expose()
  payment_status: string;
}

class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  phone?: string;
}

class ProjectResponseDto {
  @Expose()
  id: number;

  @Expose()
  status: boolean;
}

export class CustomOrderResponseDto {
  @Expose()
  id: number;

  @Expose()
  user_id: number;

  @Expose()
  name: string;

  @Expose()
  phone: string;

  @Expose()
  email: string;

  @Expose()
  deadline: Date;

  @Expose()
  catatan_tambahan?: string;

  @Expose()
  images?: string[] | null;

  @Expose()
  dp_amount?: number;

  @Expose()
  remaining_amount?: number;

  @Expose()
  total_amount?: number;

  @Expose()
  accept_status: boolean;

  @Expose()
  payment_status: boolean;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  @Expose()
  @Type(() => UserResponseDto)
  user?: UserResponseDto;

  @Expose()
  @Type(() => PaymentResponseDto)
  payment?: PaymentResponseDto;

  @Expose()
  @Type(() => ProjectResponseDto)
  projects?: ProjectResponseDto[];

  @Expose()
  @Type(() => CustomOrderItemResponseDto)
  items: CustomOrderItemResponseDto[];
}