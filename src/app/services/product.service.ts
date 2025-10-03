// product.service.ts

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { delay, Observable } from 'rxjs';
import { IProduct } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private http = inject(HttpClient);

  private readonly dataUrl = 'assets/data/pizza-products.json';
  private readonly requestDelay = 500;

  getProducts(): Observable<IProduct[]> {
    return this.http
      .get<IProduct[]>(this.dataUrl)
      .pipe(delay(this.requestDelay));
  }

  getProductById(id: string): Observable<IProduct | undefined> {
    return new Observable((observer) => {
      this.getProducts().subscribe((products) => {
        const product = products.find((p) => p.ID === id);
        observer.next(product);
        observer.complete();
      });
    });
  }
}
