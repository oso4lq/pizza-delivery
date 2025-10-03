// cart.model.ts

import { IProduct } from "./product.model";

export interface ICartItem {
  ID: string;
  quantity: number;
}

export interface ICartItemWithProduct extends ICartItem {
  product: IProduct;
  totalPrice: number;
}
