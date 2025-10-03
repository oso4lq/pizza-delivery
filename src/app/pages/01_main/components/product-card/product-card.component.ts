// product-card.component.ts

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IProduct } from '../../../../models/product.model';
import { ButtonComponent } from '../../../../shared/button/button.component';
import {
  GalleryComponent,
  IGalleryConfig,
} from '../../../../shared/gallery/gallery.component';

@Component({
  selector: 'app-product-card',
  imports: [ButtonComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  public product = input.required<IProduct>();

  public addToCart = output<IProduct>();

  protected onAddToCart(): void {
    this.addToCart.emit(this.product());
  }

  // Открытие изображения в галерее
  protected openImage(): void {
    const product = this.product();

    if (!product.imageUrl) return;

    const config: IGalleryConfig = {
      images: [
        {
          ID: product.ID,
          url: product.imageUrl,
          name: product.name,
          description: product.description,
        },
      ],
      startIndex: 0,
    };

    GalleryComponent.show(config);
  }
}
