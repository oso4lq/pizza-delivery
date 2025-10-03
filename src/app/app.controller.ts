// app.controller.ts

import { Injectable, signal } from '@angular/core';
import { IGalleryConfig } from './shared/gallery/gallery.component';

@Injectable({ providedIn: 'root' })
export class AppController {
  constructor() {
    AppController.shared = this;
  }

  static shared: AppController; // <- Singleton Instance

  // ---------------------------
  // Галерея
  public gallery = signal<IGalleryConfig | null>(null);
}
