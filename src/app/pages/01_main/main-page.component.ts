// main-page.component.ts

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { IProduct } from '../../models/product.model';
import { ProductsService } from '../../services/product.service';
import { HeroComponent } from './components/hero/hero.component';
import { OrderFormComponent } from './components/order-form/order-form.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';

@Component({
  selector: 'app-main-page',
  imports: [HeroComponent, ProductGridComponent, OrderFormComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  private productsService = inject(ProductsService);

  protected products = signal<IProduct[]>([]);
  protected isLoading = signal<boolean>(true);

  constructor() {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.productsService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Ошибка загрузки продуктов:', error);
        this.isLoading.set(false);
      },
    });
  }
}
