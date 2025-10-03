// app.component.ts

import { Component, inject, signal } from '@angular/core';
import { AppController } from './app.controller';
import { LayoutComponent } from './layout/layout.component';
import { GalleryComponent } from './shared/gallery/gallery.component';

@Component({
  selector: 'app-root',
  imports: [GalleryComponent, LayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly appCtrl = inject(AppController);
  protected readonly title = signal('pizza-delivery');
  protected gallery = this.appCtrl.gallery;
}
