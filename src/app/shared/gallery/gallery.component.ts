// gallery.component.ts

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import Swiper from 'swiper';
import { Keyboard, Navigation, Thumbs, Zoom } from 'swiper/modules';
import { AppController } from '../../app.controller';
import { IconComponent } from '../icon/icon.component';

export interface IGalleryImage {
  ID: string;
  url: string;
  name?: string;
  description?: string;
}

export interface IGalleryConfig {
  images: IGalleryImage[];
  startIndex?: number;
}

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.entering]': 'animationState() === "entering"',
    '[class.visible]': 'animationState() === "visible"',
    '[class.leaving]': 'animationState() === "leaving"',
    '(window:keydown)': 'handleKeydown($event)',
  },
})
export class GalleryComponent {
  private appCtrl = inject(AppController);

  // Статический метод для открытия галереи
  static show(config: IGalleryConfig): void {
    AppController.shared.gallery.set(config);
  }

  // Конфигурация галереи
  config = input.required({
    transform: (config: IGalleryConfig) => {
      if (!config.images || config.images.length === 0) {
        this.close();
        return config;
      }

      const startIndex = config.startIndex || 0;
      this.currentIndex.set(startIndex);
      this.$currentIndex = startIndex;
      this.images.set(config.images);

      return config;
    },
  });

  // Данные
  protected currentIndex = signal<number>(0);
  private $currentIndex = 0;
  protected images = signal<IGalleryImage[]>([]);
  protected currentImage = computed<IGalleryImage>(
    () => this.images()[this.currentIndex()]!
  );

  // UI состояние
  protected animationState = signal<'entering' | 'visible' | 'leaving'>(
    'entering'
  );

  // Ссылки на элементы
  private galleryRef = viewChild<ElementRef<HTMLElement>>('galleryContainer');
  private thumbsRef = viewChild<ElementRef<HTMLElement>>('thumbsContainer');

  // Swiper экземпляры
  swiperGallery!: Swiper;
  swiperThumbs: Swiper | null = null;

  // Инициализация Swiper
  private $gallerySetup = effect(() => {
    const config = this.config();
    const galleryRef = this.galleryRef();
    const thumbsRef = this.thumbsRef();

    if (!galleryRef || !config) return;

    // Блокируем скролл страницы
    this.disableBodyScroll();

    Swiper.use([Navigation, Thumbs, Keyboard, Zoom]);

    // Thumbnails
    this.swiperThumbs = thumbsRef
      ? new Swiper(thumbsRef.nativeElement, {
          slidesPerView: 'auto',
          spaceBetween: 12,
          watchSlidesProgress: true,
          slideToClickedSlide: true,
          initialSlide: this.$currentIndex,
        })
      : null;

    // Основная галерея
    this.swiperGallery = new Swiper(galleryRef.nativeElement, {
      zoom: true,
      slidesPerView: 'auto',
      centeredSlides: true,
      spaceBetween: 0,
      slideToClickedSlide: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      initialSlide: this.$currentIndex,
      thumbs: this.swiperThumbs ? { swiper: this.swiperThumbs } : undefined,
    });

    this.swiperGallery.on('slideChange', (e) => {
      this.currentIndex.set(this.swiperGallery.activeIndex);
    });

    // Фокус для клавиатуры
    const galleryEl = this.galleryRef()!.nativeElement;
    galleryEl.setAttribute('tabindex', '0');
    galleryEl.focus();

    // Анимация появления
    setTimeout(() => this.animationState.set('visible'), 100);
  });

  // Закрытие галереи
  public close(): void {
    this.animationState.set('leaving');
    setTimeout(() => {
      this.enableBodyScroll();
      this.appCtrl.gallery.set(null);
    }, 300);
  }

  // Блокировка скролла страницы
  private disableBodyScroll(): void {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

  // Разблокировка скролла страницы
  private enableBodyScroll(): void {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  // Обработка клавиш
  public handleKeydown(event: KeyboardEvent) {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }
}
