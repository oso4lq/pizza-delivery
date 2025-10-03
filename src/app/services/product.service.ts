// product.service.ts

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, delay } from 'rxjs';
import { IProduct } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly dataUrl = 'assets/data/products.json';
  private readonly requestDelay = 500; // Имитация задержки сети

  constructor(private http: HttpClient) {}

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
