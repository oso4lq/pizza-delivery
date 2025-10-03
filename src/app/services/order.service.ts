// order.service.ts

import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { IOrder } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly requestDelay = 1000; // Имитация задержки отправки

  constructor() {}

  submitOrder(
    order: IOrder
  ): Observable<{ success: boolean; message: string }> {
    // Имитация отправки заказа на сервер
    console.log('Отправка заказа:', order);

    return of({
      success: true,
      message: 'Спасибо за заказ!',
    }).pipe(delay(this.requestDelay));
  }
}
