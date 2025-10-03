// hero.component.ts

import { Component } from '@angular/core';

interface HeroFeature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  protected readonly features: HeroFeature[] = [
    {
      icon: '🍕',
      title: 'ЛУЧШЕЕ ТЕСТО',
      description:
        'Мы создаём тесто только из отборной итальянской муки наивысшего качества',
    },
    {
      icon: '👨‍🍳',
      title: 'ЛУЧШИЕ ПОВАРА',
      description: 'Пиццы готовят самые профессиональные итальянские повара',
    },
    {
      icon: '✓',
      title: 'ГАРАНТИЯ КАЧЕСТВА',
      description:
        'Наша пиццерия получила множество наград и признаний по всему миру',
    },
    {
      icon: '📋',
      title: 'ОТБОРНЫЕ РЕЦЕПТЫ',
      description:
        'Мы используем рецепты от мировых лидеров в итальянской пицце',
    },
  ];

  protected scrollToProducts(): void {
    const productsSection = document.querySelector('.main-page__products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
