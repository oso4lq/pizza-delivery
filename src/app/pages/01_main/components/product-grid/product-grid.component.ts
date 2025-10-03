// product-grid.component.ts

import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { IProduct } from '../../../../models/product.model';
import { CartService } from '../../../../services/cart.service';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-grid',
  imports: [ProductCardComponent],
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent {
  private cartService = inject(CartService);

  products = input.required<IProduct[]>();

  protected onAddToCart(product: IProduct): void {
    // TODO: Реализовать добавление в корзину через CartService
    console.log('Добавление в корзину:', product);
  }
}
