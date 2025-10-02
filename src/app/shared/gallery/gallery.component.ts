// gallery-modal.component.ts

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
import { Keyboard, Navigation, Pagination, Thumbs, Zoom } from 'swiper/modules';
import { AppController } from '../../app.controller';
import { LayoutService } from '../../services/layout.service';
import { IconComponent } from '../icon/icon.component';

// TODO: Убрать лишнее, адаптировать под этот проект
export interface IFile {
  /** ID компании, которой принадлежит файл. */
  cID?: string;
  /** ID родительской сущности, к которой прикреплен файл. */
  parentID?: string | null;
  /** Уникальный идентификатор файла. */
  ID: string;

  /** Тип файла. */
  type: 'image' | 'audio' | 'video' | 'doc' | null;

  /** MIME-тип файла. */
  mimeType?: string;

  /** Имя файла. */
  name: string;
  /** Расширение файла. */
  ext: string;
  /** Размер файла в байтах. */
  size: number;
  /** Дата создания/модификации файла. */
  dt: string;
  /** Дополнительные метаданные файла. */
  meta?: Record<string, any> | null;

  /** Флаг готовности файла к использованию. */
  ready?: boolean;
  /** Флаг наличия превью для файла. */
  preview?: boolean;
  /** Флаг скрытия файла из общего доступа. */
  hide?: boolean;
  /** Сообщение об ошибке, если произошла ошибка при обработке файла. */
  error?: string | null;

  /**
   * Статус вложения:
   * - 'ready' — файл готов к использованию;
   * - 'error' — произошла ошибка при обработке или загрузке;
   * - 'processing' — файл в процессе обработки или загрузки.
   */
  state?: 'ready' | 'error' | 'processing';

  /** Дата и время загрузки файла. */
  uplDt: string;
  /** ID пользователя, загрузившего файл. */
  uplUID: string;
}

/**
 * Интерфейс вложения (attachment) для файловых и медиа-документов.
 * Используется для представления файлов, прикрепленных к сущностям системы (например, сообщениям, задачам и т.д.).
 */
interface IGallerySlide extends IFile {
  sizeStr: string;
  /** Описание или комментарий к файлу (опционально). */
  description?: string;

  /** URL для предпросмотр файла (например, миниатюра или уменьшенное изображение). */
  previewUrl?: string;

  /** URL иконки файла (например, для отображения типа файла). */
  iconUrl?: string;

  /** Data URL (base64) для быстрого отображения содержимого файла (опционально). */
  dataUrl?: string;
}

/**
 * Конфигурация для открытия галереи
 */
export interface IGalleryConfig {
  /** ID группы файлов (опционально) */
  groupID?: string;
  /** Массив файлов для отображения в галереи */
  files: IFile[];
  /** ID файла, с которого начинается просмотр галереи */
  showFID?: string | null;
  /** Исключить документы из отображения (только изображения и видео) */
  noDocuments?: boolean;
  /** Скрыть панель превью (thumbnails) */
  hideThumbs?: boolean;
}

/**
 * Компонент галереи для просмотра изображений и видео
 * Поддерживает полноэкранный режим, навигацию клавишами, предзагрузку соседних файлов
 */
@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.gallery-show-ui]': 'isFullScreenMode() && showUI()',
    '[class.entering]': 'animationState() === "entering"',
    '[class.visible]': 'animationState() === "visible"',
    '[class.leaving]': 'animationState() === "leaving"',
    '(window:keydown)': 'handleKeydown( $event )',
    '(window:mousemove)': 'onMouseMove()',
  },
})
export class GalleryComponent {
  private layoutService = inject(LayoutService);
  private appCtrl = inject(AppController);

  //================================================================================
  // Публичные методы
  //================================================================================

  /**
   * Статический метод для открытия галереи с заданной конфигурацией
   * @param config - конфигурация галереи
   */
  static show(config: IGalleryConfig): void {
    AppController.shared.gallery.set(config);
  }

  /**
   * Входной параметр конфигурации галереи с трансформацией данных
   * Обрабатывает массив файлов и подготавливает их для отображения
   */
  config = input.required({
    transform: (config: IGalleryConfig) => {
      let currentIndex = 0;
      let items: IGallerySlide[] = [];

      // Обрабатываем каждый файл из конфигурации
      for (const attach of config.files) {
        // Пропускаем документы если включен режим noDocuments
        if (
          config.noDocuments &&
          attach.type &&
          ['image', 'video', 'audio'].includes(attach.type)
        )
          continue;
        // Запоминаем индекс файла для начального отображения
        if (attach.ID === config.showFID) currentIndex = items.length;

        // TODO: доделать для ссылок под этот проект
        // // Создаем элемент галереи с дополнительными свойствами
        // items.push({
        // 	...attach,
        //   sizeStr: Utill.fileSize( attach.size ),
        // 	iconUrl: API.fileUrl( attach.ID, 'icon'),
        // 	previewUrl: API.fileUrl(attach.ID, 'preview'),
        // 	dataUrl: API.fileUrl(attach.ID, 'data'),
        // })
      }

      // Если нет файлов для отображения, закрываем галерею
      if (items.length === 0) {
        this.close();
        return config;
      }

      // Устанавливаем начальный индекс и элементы
      this.currentIndex.set(currentIndex);
      this.$currentIndex = currentIndex;
      this.items.set(items);

      return config;
    },
  });

  //================================================================================
  // Внутренние данные и состояние
  //================================================================================
  /** Флаг мобильного устройства */
  public isMobile = this.layoutService.isMobile;

  /** Текущий индекс активного слайда */
  protected currentIndex = signal<number>(0);
  /** Синхронная копия текущего индекса для использования в эффектах */
  private $currentIndex = 0;

  /** Массив элементов галереи */
  protected items = signal<IGallerySlide[]>([]);
  /** Текущий активный элемент галереи */
  protected currentItem = computed<IGallerySlide>(
    () => this.items()[this.currentIndex()]!
  );

  //================================================================================
  // UI свойства и ссылки на элементы
  //================================================================================

  /** Ссылка на контейнер основной галереи */
  private galleryRef = viewChild<ElementRef<HTMLElement>>('galleryContainer');
  /** Ссылка на контейнер превью (thumbnails) */
  private thumbsRef = viewChild<ElementRef<HTMLElement>>('thumbsContainer');

  /** Флаг полноэкранного режима */
  protected isFullScreenMode = signal<boolean>(false);
  /** Флаг отображения UI элементов в полноэкранном режиме */
  protected showUI = signal<boolean>(true);
  /** Состояние анимации галереи */
  protected animationState = signal<'entering' | 'visible' | 'leaving'>(
    'entering'
  );

  //================================================================================
  // Swiper экземпляры
  //================================================================================

  /** Экземпляр основной галереи Swiper */
  swiperGallery!: Swiper;
  /** Экземпляр галереи превью (thumbnails) */
  swiperThumbs: Swiper | null = null;

  /**
   * Эффект для инициализации галереи Swiper
   * Настраивает основную галерею и превью, устанавливает обработчики событий
   */
  private $gallerySetup = effect(() => {
    const config = this.config();
    const galleryRef = this.galleryRef();
    const thumbsRef = this.thumbsRef();

    if (!galleryRef || !config) return;

    // Инициализируем модули Swiper
    Swiper.use([Navigation, Pagination, Thumbs, Keyboard, Zoom]);

    // Создаем галерею превью (thumbnails) если есть контейнер
    this.swiperThumbs = thumbsRef
      ? new Swiper(thumbsRef.nativeElement, {
          slidesPerView: 'auto',
          spaceBetween: 12,
          watchSlidesProgress: true,
          slideToClickedSlide: true,
          initialSlide: this.$currentIndex,
        })
      : null;

    // Создаем основную галерею
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

    // Устанавливаем обработчик смены слайда
    this.swiperGallery.on('slideChange', (e) => this.onSlideChange(e));

    // Настраиваем фокус для обработки клавиатуры
    const galleryEl = this.galleryRef()!.nativeElement;
    galleryEl.setAttribute('tabindex', '0');
    galleryEl.focus();

    // Предзагружаем соседние элементы
    this.preloadAdjacentItems(this.$currentIndex);

    // Запускаем анимацию появления
    setTimeout(() => this.animationState.set('visible'), 100);
  });

  // ------------------------------------------------------------

  /**
   * Закрывает галерею с анимацией
   */
  public close(): void {
    this.animationState.set('leaving');
    // Ждем завершения анимации перед закрытием
    setTimeout(() => {
      this.appCtrl.gallery.set(null);
    }, 300);
  }

  //================================================================================
  // Загрузка превью для изображений и видео слайдов
  //================================================================================

  /** Состояние загрузки элементов галереи */
  protected itemsLoadedState = signal<
    Record<string, 'loading' | 'loaded' | 'failed'>
  >({});

  /**
   * Обновляет состояние загрузки элемента галереи
   * @param item - элемент галереи
   * @param state - новое состояние загрузки
   */
  public onLoadedStateChange(
    item: IGallerySlide,
    state: 'loading' | 'loaded' | 'failed'
  ): void {
    this.itemsLoadedState.update((existState) => {
      const newState = { ...existState };
      newState[item.ID] = state;
      return newState;
    });
  }

  // ------------------------------------------------------------

  /**
   * Предзагружает соседние элементы галереи для улучшения UX
   * Загружает по 2 элемента в каждую сторону от текущего
   * @param currentIndex - текущий индекс элемента
   */
  private preloadAdjacentItems(currentIndex: number): void {
    const items = this.items();
    const preloadCount = 2;

    // Загружаем элементы вперед и назад от текущего
    for (let i = 1; i <= preloadCount; i++) {
      // Загружаем элемент вперед
      if (
        items.length > currentIndex + i &&
        items[currentIndex + i] &&
        !this.itemsLoadedState()[items[currentIndex + i].ID]
      ) {
        this.preloadItem(items[currentIndex + i]);
      }

      // Загружаем элемент назад
      if (
        currentIndex - i > 0 &&
        items[currentIndex - i] &&
        !this.itemsLoadedState()[items[currentIndex - i].ID]
      ) {
        this.preloadItem(items[currentIndex - i]);
      }
    }
  }

  // ------------------------------------------------------------

  /**
   * Предзагружает отдельный элемент галереи
   * Создает скрытые элементы для загрузки изображений и видео
   * @param item - элемент галереи для предзагрузки
   */
  private preloadItem(item: IGallerySlide): void {
    if (item.type !== 'image' && item.type !== 'video') return;

    // Предзагружаем видео
    if (item.type === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => this.onLoadedStateChange(item, 'loaded');
      video.onerror = () => this.onLoadedStateChange(item, 'failed');
      video.src = item.dataUrl!;
    }
    // Предзагружаем изображение
    else if (item.type === 'image' && item.previewUrl) {
      const img = new Image();
      img.onload = () => this.onLoadedStateChange(item, 'loaded');
      img.onerror = () => this.onLoadedStateChange(item, 'failed');
      img.src = item.previewUrl;
    }

    this.onLoadedStateChange(item, 'loading');
  }

  //================================================================================
  // События галереи
  //================================================================================

  /**
   * Обработчик смены слайда в галерее
   * Обновляет текущий индекс, предзагружает соседние элементы и настраивает автовоспроизведение видео
   */
  onSlideChange(e: any): void {
    const activeIndex = this.swiperGallery.activeIndex;
    this.currentIndex.set(activeIndex);
    this.preloadAdjacentItems(activeIndex);
  }

  /** Таймер для скрытия UI в полноэкранном режиме */
  private uiTimeout: any;

  /**
   * Обработчик движения мыши в полноэкранном режиме
   * Показывает UI элементы при движении мыши и скрывает их через 3 секунды
   */
  onMouseMove() {
    if (!this.isFullScreenMode()) return;
    this.showUI.set(true);
    clearTimeout(this.uiTimeout);
    this.uiTimeout = setTimeout(() => this.showUI.set(false), 3000);
  }

  // ------------------------------------------------------------

  /**
   * Обработчик нажатий клавиш для управления галереей
   * Поддерживает навигацию стрелками, переключение полноэкранного режима и быстрый переход к слайдам
   * @param event - событие нажатия клавиши
   */
  public handleKeydown(event: KeyboardEvent) {
    // Игнорируем клавиши если фокус на элементах ввода
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;

      // case 'Enter':
      //   event.preventDefault()
      //   this.downloadItemFile()
      //   break

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        event.preventDefault();
        const index = parseInt(event.key) - 1;
        if (this.swiperGallery && index >= 0 && index < this.items().length) {
          this.swiperGallery.slideTo(index);
        }
        break;
    }
  }
}
