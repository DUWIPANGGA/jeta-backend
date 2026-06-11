import { Expose, Type } from 'class-transformer';

class ProductOrderItemDto {
  @Expose()
  product_name: string;

  @Expose()
  quantity: number;

  @Expose()
  price: number;
}

class ProductOrderDto {
  @Expose()
  order_id: number;

  @Expose()
  order_number: string;

  @Expose()
  total_amount: number;

  @Expose()
  status: string;

  @Expose()
  created_at: Date;

  @Expose()
  @Type(() => ProductOrderItemDto)
  items: ProductOrderItemDto[];
}

class CustomOrderItemDto {
  @Expose()
  id: number;

  @Expose()
  quantity: number;

  @Expose()
  deskripsi: string;
}

class CustomOrderDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  total_amount: number;

  @Expose()
  deadline: Date;

  @Expose()
  accept_status: string;

  @Expose()
  payment_status: boolean;

  @Expose()
  created_at: Date;

  @Expose()
  @Type(() => CustomOrderItemDto)
  items: CustomOrderItemDto[];
}

class UserDetailDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  address: string;

  @Expose()
  image: string;

  @Expose()
  created_at: Date;
}

class OrdersWrapperDto {
  @Expose()
  @Type(() => ProductOrderDto)
  products: ProductOrderDto[];

  @Expose()
  @Type(() => CustomOrderDto)
  custom_orders: CustomOrderDto[];
}

export class CustomerDetailResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  @Type(() => UserDetailDto)
  user: UserDetailDto;

  @Expose()
  @Type(() => OrdersWrapperDto)
  orders: OrdersWrapperDto;
}