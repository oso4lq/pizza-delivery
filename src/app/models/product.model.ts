// product.model.ts

export enum ProductType {
  pizza = 1,
  drink = 2,
  cutlery = 3,
}

export interface IProduct {
  ID: string;
  type: ProductType;
  price: number;
  name: string;
  description: string;
  imageUrl?: string; // Путь к изображению
}