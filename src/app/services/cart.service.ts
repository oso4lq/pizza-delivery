// cart.service.ts

import { computed, Injectable, signal } from '@angular/core';
import { ICartItem } from '../models/cart.model';

const CART_STORAGE_KEY = 'pizza_cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // Приватный сигнал с товарами в корзине
  private _items = signal<ICartItem[]>(this.loadFromStorage());

  // Публичный readonly сигнал
  public items = this._items.asReadonly();

  // Вычисляемое количество товаров
  public totalCount = computed(() => {
    return this._items().reduce((sum, item) => sum + item.quantity, 0);
  });

  // Вычисляемая общая сумма (требует информацию о продуктах)
  // Для этого нужно будет передавать список продуктов или хранить цену в ICartItem

  constructor() {
    // При изменении корзины сохраняем в LocalStorage
  }

  /**
   * Добавить товар в корзину
   */
  addItem(productId: string): void {
    const currentItems = [...this._items()];
    const existingItem = currentItems.find((item) => item.ID === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      currentItems.push({
        ID: productId,
        quantity: 1,
      });
    }

    this._items.set(currentItems);
    this.saveToStorage(currentItems);
  }

  /**
   * Удалить товар из корзины
   */
  removeItem(productId: string): void {
    const currentItems = this._items().filter((item) => item.ID !== productId);
    this._items.set(currentItems);
    this.saveToStorage(currentItems);
  }

  /**
   * Изменить количество товара
   */
  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const currentItems = [...this._items()];
    const item = currentItems.find((i) => i.ID === productId);

    if (item) {
      item.quantity = quantity;
      this._items.set(currentItems);
      this.saveToStorage(currentItems);
    }
  }

  /**
   * Очистить корзину
   */
  clear(): void {
    this._items.set([]);
    this.saveToStorage([]);
  }

  /**
   * Проверить, есть ли товар в корзине
   */
  hasItem(productId: string): boolean {
    return this._items().some((item) => item.ID === productId);
  }

  /**
   * Получить количество конкретного товара
   */
  getItemQuantity(productId: string): number {
    const item = this._items().find((i) => i.ID === productId);
    return item?.quantity || 0;
  }

  // ---------------------------------------------------
  // Работа с LocalStorage

  private loadFromStorage(): ICartItem[] {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      if (!data) return [];

      const items = JSON.parse(data) as ICartItem[];
      return Array.isArray(items) ? items : [];
    } catch (error) {
      console.error('Ошибка загрузки корзины из LocalStorage:', error);
      return [];
    }
  }

  private saveToStorage(items: ICartItem[]): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Ошибка сохранения корзины в LocalStorage:', error);
    }
  }
}
