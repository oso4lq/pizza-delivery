// product-card.component.ts

import { Component, input, output } from '@angular/core';
import { IProduct } from '../../../../models/product.model';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-product-card',
  imports: [ButtonComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  product = input.required<IProduct>();

  addToCart = output<IProduct>();

  protected onAddToCart(): void {
    this.addToCart.emit(this.product());
  }
}
