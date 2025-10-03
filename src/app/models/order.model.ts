// order.model.ts

import { ICartItem } from './cart.model';

export interface IOrder {
  name: string;
  address: string;
  phone: string;
  items: ICartItem[];
  totalAmount?: number;
}
