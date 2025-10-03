// order-form.component.ts

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IOrder } from '../../../../models/order.model';
import { OrderService } from '../../../../services/order.service';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-order-form',
  imports: [FormsModule, ButtonComponent],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderFormComponent {
  private orderService = inject(OrderService);

  protected name = signal<string>('');
  protected address = signal<string>('');
  protected phone = signal<string>('');
  protected isSubmitting = signal<boolean>(false);

  protected onSubmit(): void {
    if (this.isSubmitting()) return;

    const order: IOrder = {
      name: this.name(),
      address: this.address(),
      phone: this.phone(),
      items: [], // TODO: Получить из CartService
    };

    this.isSubmitting.set(true);

    this.orderService.submitOrder(order).subscribe({
      next: (response) => {
        console.log('Заказ успешно отправлен:', response);
        alert(response.message);
        this.resetForm();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Ошибка при отправке заказа:', error);
        alert('Произошла ошибка при оформлении заказа');
        this.isSubmitting.set(false);
      },
    });
  }

  private resetForm(): void {
    this.name.set('');
    this.address.set('');
    this.phone.set('');
  }
}
