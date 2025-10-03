// header.component.ts

import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PageRoute } from '../../../app.routes';
import { CartService } from '../../../services/cart.service';
import { IconComponent } from '../../../shared/icon/icon.component';

interface NavLink {
  path: PageRoute;
  label: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private cartService = inject(CartService);

  protected readonly PageRoute = PageRoute;
  protected readonly cartTotalCount = this.cartService.totalCount;

  // Состояние мобильного меню
  protected isMenuOpen = signal(false);

  protected readonly navLinks: NavLink[] = [
    { path: PageRoute.Main, label: 'Пиццы' },
    { path: PageRoute.Drinks, label: 'Напитки' },
    { path: PageRoute.Delivery, label: 'Доставка и оплата' },
    { path: PageRoute.Contacts, label: 'Контакты' },
  ];

  protected toggleMenu(): void {
    this.isMenuOpen.update((state) => !state);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
