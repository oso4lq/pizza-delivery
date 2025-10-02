/* eslint-disable @angular-eslint/no-output-native */
// input-select.component.ts

import { NgClass } from '@angular/common'
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, model, OnDestroy, output, signal, Signal, untracked, ViewChild, } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { LanguagePipe } from 'src/app/shared/pipes/language.pipe'
import { NgFooterTemplateDirective, NgLabelTemplateDirective, NgLoadingTextTemplateDirective, NgNotFoundTemplateDirective, NgOptgroupTemplateDirective, NgOptionTemplateDirective, NgSelectComponent, NgTagTemplateDirective } from '@ng-select/ng-select'
import { TippyDirective } from '@ngneat/helipopper'
import { Exception, Util } from '@soft-artel/modules'
import { IconName } from 'src/app/shared/_ui/icon/icon-names-data'
import { IconComponent } from 'src/app/shared/_ui/icon/icon.component'
import { Utill } from 'src/app/shared/utils'
import { ColorKey } from 'src/app/types'
import { InputComponent, InputConfig } from '../../input.component'
import { InputsWrapperComponent } from '../../wrapper/inputs-wrapper.component'

//#region --------------------------------- Модели и интерфейсы для компонента

/** Тип значения для поля ввода. */
type ValueType = any | null

/** Интерфейс конфигурации для выбора значения. */
export interface IInputSelectConfig<V = ValueType> extends InputConfig<V> {
  /**
   * Управление отображением заголовков групп:
   * - 'default' – стандартное поведение: если опции имеют группы, заголовки групп отображаются.
   * - 'separator' – вместо названий групп отображаются разделители между группами.
   * - 'none' – заголовки групп не отображаются.
   */
  groupTitles?: 'default' | 'separator' | 'none';

  /** Список ID значений, которые всегда будут находится в начале ниспадающего списка. */
  shortListIds?: V[]
  /** Список значений для ниспадающего списка. */
  options?: InputSelectOption<V>[]
  optionsSignal?: Signal<IInputSelectConfig<V>['options']>
  optionClass?: string

  /**
   * Управление выбором по умолчанию:
   * @param true - при undefined или отсутствующем в options[].id значении value - будет пустое поле
   * @param false (по умолчанию) - выбирается первый элемент из options[]
   */
  noDefaultSelection?: boolean

  /**
   * Управление поиском:
   * @param true - отключить поиск значений в поле формы.
   * @param false (по умолчанию) - включить поиск значений в поле формы.
   */
  noSearch?: boolean
  /** Сообщения для показа при отсутствии результата поиска. */
  notFoundText?: string

  /** Если для поиска используется запрос на сервер */
  isAsyncSearch?: boolean

  /** Показывать ли кнопку добавления нового значения, значение этого свойства - это текст кнопки  */
  showAddButton?: string      // default: '' (false)

  /**
   * Тип привязки ниспадающего списка:.
   * @param inside - к текущему родительскому блоку.
   * @param body - к корню документа.
   */
  dropdown?: 'inside' | 'body'
  /**
   * Максимальная ширина выпадающего списка в px.
   */
  dropdownMaxWidth?: number
  hideDropdown?: boolean //если true, то выпадающий список не показывается

  addOptionFn?: ( term: string ) => InputSelectOption | undefined
  addOptionTagText?: string
  selected?: { hide?: Partial<Record<keyof InputSelectOption, true>>; cssClass?: string; icon?: IconName }
  /*
   * коллбэк срабатывающий когда нажата кнопка добавления нового элемента в футере
   */
  clickOnAddButton?: () => any
  translateOptions?: boolean //Флаг, указывающий, нужно ли переводить текст опций через Transloco
  translateExtraOptions?: boolean //Флаг, указывающий, нужно ли переводить текст Extra опций через Transloco

  loading?: boolean
}

export interface InputSelectOption<V = ValueType> {
  value: V | null
  group?: string
  searchField?: string

  icon?: string | IconName // Name or Url
  iconColor?: ColorKey
  iconSize?: number

  checkboxIcon?: boolean // input device

  text?: string
  textBefore?: string
  textAfter?: string
  cssClass?: string
  cssStyle?: Record<string, string>
}

export interface InputSelectOptionWithId extends InputSelectOption {
  id: string | null
}

// ---------------------------------
export interface IInputSelectChangeData {
  selectId?: IInputSelectConfig['id']
  newValue?: ValueType
}

/**
 * Опции для показа дополнительных пунктов в ниспадающем списке:
 * @param none true - Показывать в списке пункт "Не проводится" или "Нет".
 * @param any true - Показывать в списке пункт "Все сотрудники" или "Все".
 * @param all true - Показывать в списке пункт "Любой сотрудник" или "Любой" .
 * @param unknown true - Показывать в списке пункт "Не определён".
 */
export type ISelectExtraOptions = { none?: boolean; any?: boolean; all?: boolean; unknown?: boolean }

// --------------------------------- Реализация компонента

/**
 * Компонент формирующий поле с ниспадающим списком для выбора пользователя.
 *
 * Структура компонента:
 ```text
  [ выбранное значение / поиск ]<- поле формы. Управление поиском в noSearch
  | Group A                    | <- ниспадающий список
  | Значение A 1               | \
  | Значение A 2               |  > Short list
  | Значение A N               | /
  | Group B                    |
  | Значение B 1               | \
  | Значение B 2               |  > Остальные значения
  | Значение B N               | /
  +----------------------------+
 ```
 */
@Component({
  selector: 'app-input-select',
  templateUrl: './input-select.component.html',
  styleUrl: './input-select.component.scss',
  imports: [
    FormsModule,
    NgClass,
    InputsWrapperComponent,
    NgSelectComponent,
    IconComponent,
    NgNotFoundTemplateDirective,
    NgFooterTemplateDirective,
    NgOptgroupTemplateDirective,
    NgOptionTemplateDirective,
    NgLabelTemplateDirective,
    NgTagTemplateDirective,
    NgLoadingTextTemplateDirective,
    TippyDirective,
    LanguagePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputSelectComponent extends InputComponent<IInputSelectConfig> implements OnDestroy, AfterViewInit {

  // =============/ Зависимости и инициализация \=============

  // Ссылка на ng-select (используется для открытия dropdown)
  @ViewChild( 'selectComponent' ) private selectComponent!: NgSelectComponent
  // Ссылка на обёртку селектора для адаптивной ширины
  @ViewChild( 'inputWrapper', { static: true, read: ElementRef } ) inputWrapper!: ElementRef


  // =============/ Входящие данные и настройки \=============

  // inputs
  public options = input<IInputSelectConfig[ 'options' ]>()
  addOptionText = input<string>()

  // outputs
  close = output<void>()
  clickOnAddButton = output<void>()

  // models
  search = model( '' )
  translateOptions = model<boolean>( false )
  translateExtraOptions = model<boolean>( false )

  // signals
  showFullOptions = signal( false )

  // =============/ Вычисляемые свойства \=============

  // Если в конфиге указано 'inside', возвращаем уникальный класс на основе id компонента
  public appendToSignal = computed( () => {
    return this.config().dropdown === 'inside' ? `dropdown-${ this.id() }` : ''
  })

  // ------------------------------------------------

  // isOpen model and effect
  public isOpen = model( false )
  private isOpenEffect = effect(() => {
    if ( this.config().hideDropdown ) this.isOpen.set( false ) //не показывается выпадающий список
    if( this.isOpen() ) this.selectComponent?.open()
    else this.selectComponent?.close()
  })

  // ------------------------------------------------

  // Дефолтное название класса
  private readonly defaultOptionClass = 'select-option-shared'
  // Подставляет дефолтный класс, если в config() не указан другой
  optionClass = computed( () => {
    return this.config().optionClass || this.defaultOptionClass
  })

  // ------------------------------------------------

  // ID выбранной опции
  selectedId = computed( ()=> this.getIdByValue( this.value() ) )

  // ID default опции
  defaultOptionId = computed<string | null>(() => {
    const opts = this.displayedOptions()
    if (!this.config().noDefaultSelection && this.config().validate?.allowNull && opts.length > 1) {
      return opts[1].id
    }
    if (!this.config().noDefaultSelection && !this.config().validate?.allowNull && opts.length > 0) {
      return opts[0].id
    }
    return null
  })

  // Разрешение очищать селектор: предотвращает сброс поля ввода до пустого при поиске
  canClear = computed<boolean>( ()=> ( !this.config().noSearch && this.isOpen() && this.selectedId() !== this.defaultOptionId() ) )

  // ------------------------------------------------

  // Отображаемые опции
  displayedOptions = computed<InputSelectOptionWithId[]>( () => {
    const config = this.config()
    const options = this.options() ?? config.options ?? config.optionsSignal?.() ?? []
    const shortList = config.shortListIds

    const search = this.search()
    const showFullOptions = this.showFullOptions()

    let finishOptions = !showFullOptions && !search && shortList && shortList.length > 0
                      ? options.filter(o => shortList.find( slV => Utill.isEqual( slV, o.value ) ) )
                      : options

    let displayedOptions: InputSelectOptionWithId[] = []

    if( config.validate?.allowNull ){
      displayedOptions.push({
        id: this.getIdByValue(null),
        text: this.config().placeholder === undefined ? this.langService.get( 'placeholders.notSelected' ) : this.placeholder(),
        value: null,
        cssClass: 'select-option-no-selected'
      } )
    }

    for ( const option of finishOptions ) {
      displayedOptions.push({ ...option, id: this.getIdByValue(option.value) })
    }
    return displayedOptions
  } )


  // =============/ Эффекты, хуки \=============

  constructor() {
    super()
    effect( () => {
      const config = this.config()
      this.translateOptions.set( config.translateOptions ?? this.translateOptions() )
      this.translateExtraOptions.set( config.translateExtraOptions ?? this.translateExtraOptions() )
    } )
    effect( () => {
      const displayedOptions = this.displayedOptions()

      // Проверка валидности при изменении значения (например при автоматической подстановке значения)
      if( this.validate( this.value(), false ) ) this.validateError.set( null )

      untracked( ()=>{

        let defaultValue: ValueType | null = null

        if ( !this.config().noDefaultSelection && this.config().validate?.allowNull && displayedOptions.length > 1 ) {
          defaultValue = displayedOptions[1].value // 0 - no-selected option
        } else if (
          !this.config().noDefaultSelection &&
          !this.config().validate?.allowNull &&
          displayedOptions.length > 0
        ) {
          defaultValue = displayedOptions[0].value // 0 - first real option
        }

        const selectedId = this.getIdByValue(this.value() ?? this.config().value)
        const foundInDisplayedOptions = displayedOptions.find(o => o.id === selectedId)

        if ( foundInDisplayedOptions ) return

        if ( !selectedId || (!foundInDisplayedOptions && !this.config().shortListIds )) {
          this.value.set( defaultValue )
          return
        }

        const foundInAllOptions = ( this.options() ?? this.config().options )?.find(
          o => this.getIdByValue( o.value ) === selectedId
        )

        if ( !foundInAllOptions ) {
          this.value.set( defaultValue )
          return
        } else {
          this.showFullOptions.set( true )
        }

      })
    })
  }

  // ------------------------------------------------

  override ngAfterViewInit() {
    super.ngAfterViewInit()

    // // placeholder - закомментировано, т.к. по умолчанию без него
    // const placeholderString = this.placeholder()
    // if( placeholderString && this.selectComponent && ( !this.selectComponent.placeholder || this.selectComponent.placeholder.trim() === '' ) ){
    //   this.selectComponent.placeholder = placeholderString
    // }

    window.addEventListener( 'scroll', this.onScroll, true )
    window.addEventListener( 'mousedown', this.onDocumentMouseDown, true )
  }

  // ------------------------------------------------

  ngOnDestroy() {
    // Очищаем обработчики событий
    window.removeEventListener( 'scroll', this.onScroll, true )
    window.removeEventListener( 'mousedown', this.onDocumentMouseDown, true )
    // Очищаем стили
    this.removeDropdownStyles()
  }

  // ------------------------------------------------

  /**
   * Обработчик события scroll.
   * Закрывает выпадающее меню `ng-select`, если скролл происходит вне панели выпадающего списка.
   * Игнорирует события скролла внутри панели с классом `.ng-dropdown-panel`.
   */
  private onScroll = ( event: Event )=>{
    const target = event.target as HTMLElement
    if( target && 'closest' in target && ( target.closest( '.ng-dropdown-panel' ) || !this.isOpen() ) ) return
    if( this.isOpen() ){
      this.isOpen.set( false )
      setTimeout( () => this.removeDropdownStyles(), 200 )
    }
  }

  /**
   * Обработчик события mousedown.
   * Если клик происходит вне обёртки компонента или выпадающего списка, закрываем dropdown.
   */
  private onDocumentMouseDown = ( event: Event )=>{
    const target = event.target as HTMLElement
    if( target && 'closest' in target && (
      this.inputWrapper.nativeElement.contains( target ) || target.closest( '.ng-dropdown-panel' )
    ) ) return
    if( this.isOpen() ){
      this.isOpen.set( false )
      setTimeout( () => this.removeDropdownStyles(), 200 )
    }
  }


  // =============/ Методы \=============

  private dropdownStyleId?: string

  /**
   * Определяет ширину dropdown и открывает его.
   */
  openDropdown(): void {
    this.setDropdownWidth()
    this.isOpen.set( true )
  }

  // ------------------------------------------------

  /**
   * Устанавливает ширину dropdown.
   */
  private setDropdownWidth(): void {
    const inputWidth = this.inputWrapper.nativeElement.offsetWidth
    const configMaxWidth = this.config().dropdownMaxWidth ?? 800
    const appendToSignal = this.appendToSignal()

    // Убираем предыдущие стили
    this.removeDropdownStyles()

    // Определяем селектор
    const targetSelector = appendToSignal
      ? `.${appendToSignal} .ng-dropdown-panel`
      : '.ng-dropdown-panel'

    // Рассчитываем финальную ширину сразу
    const finalWidth = Math.max( inputWidth, configMaxWidth )

    // Создаем и применяем стили
    this.applyDropdownStyles( targetSelector, finalWidth, inputWidth )

    // Планируем очистку временных стилей после анимации открытия
    setTimeout( () => this.optimizeDropdownAfterOpen(), 100 )
  }

  // ------------------------------------------------

  /**
   * Применяет стили для dropdown
   */
  private applyDropdownStyles( targetSelector: string, finalWidth: number, inputWidth: number ): void {
    this.dropdownStyleId = `dropdown-styles-${this.id()}`

    const styleElement = document.createElement( 'style' )
    styleElement.id = this.dropdownStyleId

    // Учитываем padding/border, вычитаем 4px
    const panelItemsWidth = inputWidth - 4
    styleElement.textContent = `
      ${targetSelector} {
        width: auto !important;
        min-width: ${inputWidth}px !important;
        max-width: ${finalWidth}px !important;
      }
      ${targetSelector} .ng-dropdown-panel-items {
        width: auto !important;
        min-width: ${panelItemsWidth}px !important;
        max-width: ${finalWidth - 4}px !important;
      }
    `

    document.head.appendChild( styleElement )
  }

  // ------------------------------------------------

  /**
   * Применяет ширину dropdown после открытия.
   */
  private optimizeDropdownAfterOpen(): void {
    const appendToSignal = this.appendToSignal()
    const dropdownSelector = appendToSignal ? appendToSignal : 'ng-dropdown-panel'
    let container: HTMLElement | null = document.querySelector( `.${dropdownSelector}` ) as HTMLElement
    if( appendToSignal && container ) container = container.querySelector( '.ng-dropdown-panel' ) as HTMLElement
    if( !container ) return

    const panelItems = container.querySelector( '.ng-dropdown-panel-items' ) as HTMLElement
    if( !panelItems ) return

    // Измеряем естественную ширину контента
    const contentWidth = panelItems.scrollWidth
    const inputWidth = this.inputWrapper.nativeElement.offsetWidth
    const configMaxWidth = this.config().dropdownMaxWidth ?? 800

    // Расчитываем финальную ширину
    // Контент больше input и меньше maxWidth => используем естественную ширину
    let finalWidth = contentWidth
    // input шире maxWidth => используем ширину input
    if( inputWidth > configMaxWidth )   finalWidth = inputWidth
    // Контент помещается в ширину input => используем ширину input
    if( contentWidth <= inputWidth )    finalWidth = inputWidth
    // Контент шире maxWidth => ограничиваем
    if( contentWidth > configMaxWidth ) finalWidth = configMaxWidth

    // Применяем финальные размеры
    this.applyFinalDimensions( container, panelItems, finalWidth )
  }

  // ------------------------------------------------

  /**
   * Применяет финальные размеры к элементам dropdown
   */
  private applyFinalDimensions( container: HTMLElement, panelItems: HTMLElement, finalWidth: number ): void {
    // Устанавливаем размеры контейнера
    this.renderer.setStyle( container, 'width', `${finalWidth}px` )
    this.renderer.setStyle( container, 'min-width', `${finalWidth}px` )
    this.renderer.setStyle( container, 'max-width', `${finalWidth}px` )

    // Устанавливаем размеры содержимого с учетом padding/border
    const panelItemsWidth = finalWidth - 4
    this.renderer.setStyle( panelItems, 'width', `${panelItemsWidth}px` )
    this.renderer.setStyle( panelItems, 'min-width', `${panelItemsWidth}px` )
    this.renderer.setStyle( panelItems, 'max-width', `${panelItemsWidth}px` )
    this.renderer.setStyle( panelItems, 'overflow-x', 'hidden' )
  }

  // ------------------------------------------------

  /**
   * Удаляет стили dropdown
   */
  private removeDropdownStyles(): void {
    if( this.dropdownStyleId ){
      const existingStyle = document.getElementById( this.dropdownStyleId )
      if( existingStyle ) existingStyle.remove()
    }
  }

  // ------------------------------------------------

  // Возвращает ID опции по её значению
  getIdByValue( value?: ValueType ): string | null {
    if( value === null || value === undefined ){
      if( this.config().noDefaultSelection ) return null // для placeholder
      return this.config().validate?.allowNull ? 'no-selected' : 'none'
    }
    if( typeof value !== 'object' && !Array.isArray( value ) ) return String( value )
    if( !Util.isObject( value ) ) throw new Exception('Core', 'InputSelectComponent.getIdByValue wrong value')
    let id = ''
    for( const key of Object.keys( value ).sort() ){
      id += '#' + value[ key ]
    }
    return id
  }

  // ------------------------------------------------
  // Input events

  onBlur() {
    this.validate( this.value() )
    // this.selectComponent!.searchable = false
    setTimeout( ()=>{ this.value.set( this.value() ) } )
  }

  // Событие изменения опции
  onChange( selected?: InputSelectOption ): void {
    let newValue: any

    if( !selected ){
      // значения поля выбора удалили - попробуем выставить дефолт
      if( this.config().value && typeof this.config().value !== 'function' ) newValue = this.config().value
      // дефолта - нет, надо выбирать 1й элемент если allowNull не разрешен
      else newValue = this.config().validate?.allowNull ? null : this.displayedOptions()[0].value
    }
    else newValue = selected.value

    if( newValue === this.value() ) return

    this.validate( newValue )
    this.value.set( newValue )
    this.processDirectUpdate( newValue )
    this.change.emit( { selectId: this.id(), newValue } )
  }

  bindedSearchFn = this.searchFn.bind(this)

  searchFn( term: string, item: InputSelectOption ): boolean {
    if ( this.config().isAsyncSearch ) return true
    const searchText = term.toLowerCase()

    // Проверяем текст опции с учетом переводов
    let textToSearch = ''
    if( this.translateOptions() && item.text ){
      // Переводим текст опции через Transloco для поиска
      textToSearch = this.langService.get( item.text ).toLowerCase()
    } else if( this.translateExtraOptions() && this.isExtraOption( item.value ) && item.text ){
      // Переводим экстра-опции (all, any, none)
      textToSearch = this.langService.get( item.text ).toLowerCase()
    } else if( item.text ){
      // Используем исходный текст без перевода
      textToSearch = item.text.toLowerCase()
    }

    // Поиск по основному тексту опции
    if( textToSearch.includes( searchText ) ) return true

    // Поиск по дополнительным полям
    if( item.textBefore?.toLowerCase().includes( searchText ) ) return true
    if( item.textAfter?.toLowerCase().includes( searchText ) ) return true
    if( item.searchField?.toLowerCase().includes( searchText ) ) return true

    return false
  }

  isExtraOption( value: string ): boolean {
    return [ 'none', 'all', 'any', 'unknown' ].includes( value )
  }

}
