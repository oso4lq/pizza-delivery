// app.routes.ts

import { Routes } from '@angular/router';

export enum PageRoute {
  Main = 'main', // Главная
  Drinks = 'drinks', // Статьи
  Delivery = 'delivery', // Объекты
  Contacts = 'contacts', // Контакты
}

// Angular маршруты
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      // Главная страница (redirect)
      {
        path: '',
        pathMatch: 'full',
        redirectTo: PageRoute.Main,
      },

      // Главная страница (пиццы)
      {
        path: PageRoute.Main,
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/01_main/main-page.component').then(
            (m) => m.MainPageComponent
          ),
        data: {
          title: 'Pizza Cheff',
          description: 'Самая вкусная пицца в мире только в Pizza Cheff ',
          keywords: ['pizza', 'cheff', 'delivery'],
        },
      },

    //   // Напитки
    //   {
    //     path: PageRoute.Drinks,
    //     pathMatch: 'full',
    //     loadComponent: () =>
    //       import('./pages/02_drinks/drinks-page.component').then(
    //         (m) => m.DrinksPageComponent
    //       ),
    //     data: {},
    //   },

    //   // Доставка
    //   {
    //     path: PageRoute.Delivery,
    //     pathMatch: 'full',
    //     loadComponent: () =>
    //       import('./pages/03_delivery/delivery-page.component').then(
    //         (m) => m.DeliveryPageComponent
    //       ),
    //     data: {},
    //   },

    //   // Контакты
    //   {
    //     path: PageRoute.Contacts,
    //     pathMatch: 'full',
    //     loadComponent: () =>
    //       import('./pages/04_contacts/contacts.component').then(
    //         (m) => m.ContactsComponent
    //       ),
    //     data: {},
    //   },

      // Редирект для несуществующих маршрутов
      {
        path: '**',
        redirectTo: PageRoute.Main,
      },
    ],
  },
];
