// gallery-modal.component.ts

import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, OnDestroy, Renderer2, signal, viewChild } from '@angular/core'
import Swiper from 'swiper'
import { Keyboard, Navigation, Pagination, Thumbs, Zoom } from 'swiper/modules'

import { API } from 'src/app/api'
import { IconComponent } from 'src/app/shared/_ui/icon/icon.component'
import { UserViewComponent } from 'src/app/shared/components/user/user-view/user-view.component'
import { DateFormatPipe } from 'src/app/shared/pipes/date-time/date-format.pipe'
import { Utill } from '../utils'
import { LayoutService } from 'src/app/layout/layout.service'
import { AppController } from 'src/app/app.controller'

/**
 * Интерфейс вложения (attachment) для файловых и медиа-документов.
 * Используется для представления файлов, прикрепленных к сущностям системы (например, сообщениям, задачам и т.д.).
 */
interface IGallerySlide extends API.IFile{
  sizeStr: string
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
	groupID?: string
	/** Массив файлов для отображения в галереи */
  files: API.IFile[]
	/** ID файла, с которого начинается просмотр галереи */
  showFID?: string | null
	/** Исключить документы из отображения (только изображения и видео) */
  noDocuments?: boolean
	/** Скрыть панель превью (thumbnails) */
  hideThumbs?: boolean
}

/**
 * Компонент галереи для просмотра изображений и видео
 * Поддерживает полноэкранный режим, навигацию клавишами, предзагрузку соседних файлов
 */
@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  imports: [ UserViewComponent, IconComponent, DateFormatPipe ],
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
export class GalleryComponent implements OnDestroy {
  private renderer = inject( Renderer2 )
  private layoutService = inject( LayoutService )
  private appCtrl = inject( AppController )

	//================================================================================
  // Публичные методы
  //================================================================================

  /**
   * Статический метод для открытия галереи с заданной конфигурацией
   * @param config - конфигурация галереи
   */
  static show( config: IGalleryConfig ): void {
    AppController.shared.gallery.set( config )
  }

	/**
	 * Входной параметр конфигурации галереи с трансформацией данных
	 * Обрабатывает массив файлов и подготавливает их для отображения
	 */
	config = input.required({transform: (config: IGalleryConfig)=>{
    let currentIndex = 0
		let items: IGallerySlide[] = []

		// Обрабатываем каждый файл из конфигурации
		for( const attach of config.files ){
			// Пропускаем документы если включен режим noDocuments
			if( config.noDocuments && attach.type && [ 'image', 'video', 'audio' ].includes( attach.type ) ) continue
			// Запоминаем индекс файла для начального отображения
			if( attach.ID === config.showFID ) currentIndex = items.length

			// Создаем элемент галереи с дополнительными свойствами
			items.push({
				...attach,
        sizeStr: Utill.fileSize( attach.size ),
				iconUrl: API.fileUrl( attach.ID, 'icon'),
				previewUrl: API.fileUrl(attach.ID, 'preview'),
				dataUrl: API.fileUrl(attach.ID, 'data'),
			})
		}

		// Если нет файлов для отображения, закрываем галерею
		if( items.length === 0 ){
			this.close()
			return config
		}

		// Устанавливаем начальный индекс и элементы
		this.currentIndex.set( currentIndex )
    this.$currentIndex = currentIndex
		this.items.set( items )

    return config
  }})


	//================================================================================
  // Внутренние данные и состояние
  //================================================================================
  /** Флаг мобильного устройства */
  public isMobile = this.layoutService.isMobile

	/** Текущий индекс активного слайда */
	protected currentIndex = signal<number>( 0 )
  /** Синхронная копия текущего индекса для использования в эффектах */
  private $currentIndex = 0

  /** Массив элементов галереи */
  protected items = signal<IGallerySlide[]>( [] )
  /** Текущий активный элемент галереи */
  protected currentItem = computed<IGallerySlide>( () => this.items()[ this.currentIndex() ]! )






	//================================================================================
  // UI свойства и ссылки на элементы
  //================================================================================

	/** Ссылка на контейнер основной галереи */
	private galleryRef = viewChild<ElementRef<HTMLElement>>('galleryContainer')
	/** Ссылка на контейнер превью (thumbnails) */
  private thumbsRef = viewChild<ElementRef<HTMLElement>>('thumbsContainer')

	/** Флаг полноэкранного режима */
	protected isFullScreenMode = signal<boolean>( false )
	/** Флаг отображения UI элементов в полноэкранном режиме */
  protected showUI = signal<boolean>( true )
	/** Состояние анимации галереи */
  protected animationState = signal<'entering' | 'visible' | 'leaving'>('entering')



	//================================================================================
  // Swiper экземпляры
  //================================================================================

  /** Экземпляр основной галереи Swiper */
  swiperGallery!: Swiper
  /** Экземпляр галереи превью (thumbnails) */
  swiperThumbs: Swiper | null = null


	/**
	 * Эффект для инициализации галереи Swiper
	 * Настраивает основную галерею и превью, устанавливает обработчики событий
	 */
	private $gallerySetup = effect(()=>{

		const config = this.config()
		const galleryRef = this.galleryRef()
		const thumbsRef = this.thumbsRef()

		if( !galleryRef || !config ) return

		// Инициализируем модули Swiper
		Swiper.use( [ Navigation, Pagination, Thumbs, Keyboard, Zoom ] )

		// Создаем галерею превью (thumbnails) если есть контейнер
		this.swiperThumbs = thumbsRef ? new Swiper( thumbsRef.nativeElement, {
			slidesPerView: 'auto',
			spaceBetween: 12,
			watchSlidesProgress: true,
			slideToClickedSlide: true,
			initialSlide: this.$currentIndex,
		}) : null

		// Создаем основную галерею
		this.swiperGallery = new Swiper( galleryRef.nativeElement, {
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
			thumbs: this.swiperThumbs  ? { swiper: this.swiperThumbs } : undefined,
		})

		// Устанавливаем обработчик смены слайда
		this.swiperGallery.on( 'slideChange', ( e )=>this.onSlideChange( e ) )

		// Настраиваем фокус для обработки клавиатуры
    const galleryEl = this.galleryRef()!.nativeElement
    galleryEl.setAttribute( 'tabindex', '0' )
    galleryEl.focus()

		// Предзагружаем соседние элементы и настраиваем автовоспроизведение видео
		this.preloadAdjacentItems( this.$currentIndex )
		setTimeout(() => this.setupVideoAutoplay(), 200)

		// Запускаем анимацию появления
		setTimeout(() => this.animationState.set('visible'), 100)

	})

	//================================================================================
  // Жизненный цикл
  //================================================================================

  /**
   * Очистка ресурсов при уничтожении компонента
   * Останавливает все воспроизводимые видео
   */
  ngOnDestroy() {
    this.pauseAllVideos()
  }

	// ------------------------------------------------------------

  /**
   * Закрывает галерею с анимацией
   */
  public close(): void {
    this.animationState.set('leaving')
    // Ждем завершения анимации перед закрытием
    setTimeout(() => {
      this.appCtrl.gallery.set( null )
    }, 300)
  }


	//================================================================================
  // Загрузка превью для изображений и видео слайдов
  //================================================================================

	/** Состояние загрузки элементов галереи */
	protected itemsLoadedState = signal<Record<string, 'loading' | 'loaded' | 'failed'>>({})

	/**
	 * Обновляет состояние загрузки элемента галереи
	 * @param item - элемент галереи
	 * @param state - новое состояние загрузки
	 */
	public onLoadedStateChange( item: IGallerySlide, state: 'loading' | 'loaded' | 'failed' ): void {
		this.itemsLoadedState.update(existState => {
			const newState = { ...existState }
			newState[ item.ID ] = state
			return newState
		})
	}

	// ------------------------------------------------------------

	/**
	 * Предзагружает соседние элементы галереи для улучшения UX
	 * Загружает по 2 элемента в каждую сторону от текущего
	 * @param currentIndex - текущий индекс элемента
	 */
	private preloadAdjacentItems(currentIndex: number): void {
		const items = this.items()
		const preloadCount = 2

		// Загружаем элементы вперед и назад от текущего
		for( let i = 1; i <= preloadCount; i++ ){
			// Загружаем элемент вперед
			if( items.length > currentIndex + i && items[ currentIndex + i ] && !this.itemsLoadedState()[ items[ currentIndex + i ].ID ] ){
				this.preloadItem(items[ currentIndex + i ])
			}

			// Загружаем элемент назад
			if( currentIndex - i > 0 && items[ currentIndex - i ] && !this.itemsLoadedState()[ items[ currentIndex - i ].ID ] ){
				this.preloadItem(items[ currentIndex - i ])
			}
		}
	}

	// ------------------------------------------------------------

	/**
	 * Предзагружает отдельный элемент галереи
	 * Создает скрытые элементы для загрузки изображений и видео
	 * @param item - элемент галереи для предзагрузки
	 */
	private preloadItem(item: IGallerySlide ): void {
		if( item.type !== 'image' && item.type !== 'video' ) return

		// Предзагружаем видео
		if( item.type === 'video' ){
			const video = document.createElement('video')
			video.preload = 'metadata'
			video.onloadedmetadata = () => this.onLoadedStateChange(item, 'loaded')
			video.onerror = () => this.onLoadedStateChange(item, 'failed')
			video.src = item.dataUrl!
		}
		// Предзагружаем изображение
		else if( item.type === 'image' && item.previewUrl ){
			const img = new Image()
			img.onload = () => this.onLoadedStateChange(item, 'loaded')
			img.onerror = () => this.onLoadedStateChange(item, 'failed')
			img.src = item.previewUrl
		}

		this.onLoadedStateChange(item, 'loading')
	}


	//================================================================================
  // UI методы
  //================================================================================


  /**
   * Скачивает текущий активный файл из галереи
   * Создает временную ссылку для скачивания и автоматически удаляет её
   */
  public async downloadItemFile(): Promise<void> {
    const idx = this.swiperGallery.activeIndex
    const slides = this.items()
    if( idx < 0 || idx >= slides.length ) return

    const slide = slides[ idx ]

    // Создаем временную ссылку для скачивания
    const link = this.renderer.createElement('a')
    this.renderer.setAttribute(link, 'href', API.fileUrl( slide.ID, 'data'))
    this.renderer.setAttribute(link, 'target', '_blank')
    this.renderer.setAttribute(link, 'download', slide.name || slide.ID )
    this.renderer.appendChild( document.body, link )
    link.click()
    this.renderer.removeChild( document.body, link )
  }


	//================================================================================
  // Работа с видео слайдами
  //================================================================================

  /**
   * Обработчик загрузки метаданных видео
   * @param event - событие загрузки метаданных
   * @param slide - элемент галереи с видео
   */
  public onVideoLoadedMetadata(event: Event, slide: any): void {
    console.debug('GalleryModal: Метаданные видео загружены:', slide.ID, slide.name)
  }

  /**
   * Обработчик воспроизведения видео
   * Останавливает другие видео при воспроизведении текущего
   * @param event - событие воспроизведения
   * @param slide - элемент галереи с видео
   */
  public onVideoPlay(event: Event, slide: any): void {
    console.debug('GalleryModal: Видео воспроизводится:', slide.ID, slide.name)

    // Останавливаем все другие видео
    const allVideos = document.querySelectorAll('video[data-video-id]')
    allVideos.forEach((video: Element) => {
      const videoElement = video as HTMLVideoElement
      const videoId = videoElement.getAttribute('data-video-id')
      if (videoId && videoId !== slide.ID && !videoElement.paused) {
        videoElement.pause()
      }
    })
  }

  /**
   * Обработчик паузы видео
   * @param event - событие паузы
   * @param slide - элемент галереи с видео
   */
  public onVideoPause(event: Event, slide: any): void {
    console.debug('GalleryModal: Видео на паузе:', slide.ID, slide.name)
  }

  /**
   * Обработчик двойного клика по видео
   * Переключает воспроизведение/паузу
   * @param event - событие двойного клика
   * @param slide - элемент галереи с видео
   */
  public onVideoDoubleClick(event: Event, slide: any): void {
    event.preventDefault()
    const video = event.target as HTMLVideoElement

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

  /**
   * Настраивает автовоспроизведение для текущего видео
   * Запускает воспроизведение если видео готово к воспроизведению
   */
  private setupVideoAutoplay(): void {
		if( this.currentItem().type !== 'video' ) return
		let video = document.querySelector(`video[data-video-id="${ this.currentItem().ID }"]`) as HTMLVideoElement || null
    if (video && video.readyState >= 3) {
      video.play().catch(error => {
        console.warn('GalleryModal: Не удалось запустить автовоспроизведение:', error)
      })
    }
  }

  /**
   * Останавливает все воспроизводимые видео в галерее
   * Используется при закрытии галереи или смене слайда
   */
  private pauseAllVideos(): void {
    const allVideos = document.querySelectorAll('video[data-video-id]')
    allVideos.forEach((video: Element) => {
      const videoElement = video as HTMLVideoElement
      if (!videoElement.paused) {
        videoElement.pause()
      }
    })
  }


	//================================================================================
  // События галереи
  //================================================================================

	/**
	 * Обработчик смены слайда в галерее
	 * Обновляет текущий индекс, предзагружает соседние элементы и настраивает автовоспроизведение видео
	 */
	onSlideChange( e: any ): void {
		const activeIndex = this.swiperGallery.activeIndex
		this.currentIndex.set( activeIndex )
		this.preloadAdjacentItems(activeIndex)
		setTimeout(() => this.setupVideoAutoplay(), 100)
	}

	/** Таймер для скрытия UI в полноэкранном режиме */
	private uiTimeout: any

  /**
   * Обработчик движения мыши в полноэкранном режиме
   * Показывает UI элементы при движении мыши и скрывает их через 3 секунды
   */
  onMouseMove() {
    if( !this.isFullScreenMode() ) return
    this.showUI.set( true )
    clearTimeout( this.uiTimeout )
    this.uiTimeout = setTimeout( () => this.showUI.set( false ), 3000 )
  }

	// ------------------------------------------------------------

  /**
   * Обработчик нажатий клавиш для управления галереей
   * Поддерживает навигацию стрелками, переключение полноэкранного режима и быстрый переход к слайдам
   * @param event - событие нажатия клавиши
   */
  public handleKeydown( event: KeyboardEvent ){
    // Игнорируем клавиши если фокус на элементах ввода
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return
    }

    switch( event.key ){
      case 'Escape':
        event.preventDefault()
        this.close()
        break

      case 'Enter':
        event.preventDefault()
        this.downloadItemFile()
        break


      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        event.preventDefault()
        const index = parseInt(event.key) - 1
				if (this.swiperGallery && index >= 0 && index < this.items().length) {
					this.swiperGallery.slideTo( index )
				}
        break
    }
  }

}
