// input-text.component.ts

/* eslint-disable @angular-eslint/no-output-native */
import { ChangeDetectionStrategy, Component, computed, output, AfterViewInit } from '@angular/core'
import { NgClass } from '@angular/common'
import { InputComponent, InputConfig } from '../../input.component'
import { InputsWrapperComponent } from '../../wrapper/inputs-wrapper.component'
import { TippyDirective } from '@ngneat/helipopper'
import { IconComponent } from 'src/app/shared/_ui/icon/icon.component';
import { LanguagePipe } from 'src/app/shared/pipes/language.pipe';

// --------------------------------- Модели и интерфейсы для компонента

/** Тип значения для поля формы: string | number */
type ValueType = string | number | null

/** Представление конфигурации для поля формы. */
export interface IInputTextConfig extends InputConfig< ValueType >{
  mask?: RegExp
  onInput?: boolean
  selectAll?: boolean
	upperCased?: boolean
  limitChars?: boolean // true: ограничивать числовое поле ввода по символам (validate:max:99 => в поле не более 2 символов)
  noTrimInside?: boolean // true: не сокращать два и более пробелов между словами до одного пробела
  transformInput?: ( value: string, cursor: number | null )=> { newValue: string, newCursor: number | null }
  prefixIcon?: string
  /** HTML-атрибут type на <input> (по умолчанию 'text') */
  inputType?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'hidden' | 'date' | 'time' | 'datetime-local' | 'month' | 'week' | 'color' | 'file' | 'image' | 'audio' | 'video' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'button' | 'submit' | 'reset' | 'range' | 'progress' | 'meter' | 'output' | 'details' | 'summary' | 'dialog' | 'menu' | 'menuitem' | 'track' | 'slot' | 'template' | 'script' | 'style' | 'module' | 'iframe' | 'embed' | 'object' | 'map' | 'area' | 'canvas' | 'svg' | 'math' | 'iframe' | 'embed' | 'object' | 'map' | 'area' | 'canvas' | 'svg' | 'math' | 'iframe' | 'embed' | 'object' | 'map' | 'area' | 'canvas' | 'svg' | 'math'
  /** HTML5-атрибут inputmode  */
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'email' | 'url' | 'search' | 'password' | 'hidden'
  ignoreValidateByEvents?: Partial<Record<'onChange' | 'onBlur', boolean>>
}

/**
 * Список управляющих клавиш, которые обработчик onKeyDown должен пропускать
 */
const enterKey = 'Enter'
const controlKeys: string[] = [ 'Backspace', 'Tab', enterKey ]

// --------------------------------- Реализация компонента

/**
 * Компонент реализующий поле для ввода текста.
 * Является базовым компонентом для других полей ввода данных.
 */
@Component({
  standalone: true,
  selector: 'app-input-text',
  templateUrl: './input-text.component.html',
  styleUrl: './input-text.component.scss',
  imports: [ NgClass, InputsWrapperComponent, IconComponent, TippyDirective, LanguagePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputTextComponent extends InputComponent < IInputTextConfig > implements AfterViewInit {

  input    = output<Event | undefined >()
  focus    = output<Event | undefined >()
  blur     = output<Event | undefined >()
  /** Событие родительскому компоненту, о том, что в поле была нажата кнопка Enter. */
  enterKey = output<boolean>()

  valueTooltip = computed<string | undefined>( () => {
    if (this.tooltip()?.text) return this.tooltip()?.text
    let count = String( this.value() )?.length ?? 0
    return count < 50 ? undefined : String( this.value() )
  } )

  // Ограничение по длине в символах: если limitChars===true и передан max, берём длину его строкового представления
  readonly maxChars = computed<number | undefined>( () => {
    const cfg = this.config()
    if ( cfg.limitChars && cfg.validate?.max ) return String( cfg.validate?.max ).length // Для числовых значений
    if ( cfg.validate?.max ) return cfg.validate?.max // Для строковых значений
    return 500 // default
  } )

  // -------------------------------------

  override configSetup(config: IInputTextConfig): IInputTextConfig {
    let updConfig = super.configSetup( config )
    if( updConfig.validate && !updConfig.validate.type ) updConfig.validate!.type = 'string'
    return updConfig
  }

  // -------------------------------------

  setFocus(){
    setTimeout( () => { this.inputElement()?.focus() }, 200 )
  }

  selectAll(){
    setTimeout( () => { this.inputElement()?.select() }, 200 )
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit()

    if( this.config().autofocus ) this.setFocus()
    if( this.config().selectAll ) this.selectAll()

  }

  // -------------------------------------
  /** При нажатии клавиши проверяет допустимость символа */
  protected onKeyDown( event?: KeyboardEvent ): boolean | undefined {
    if( !event || event.ctrlKey || event.metaKey || !event.key || controlKeys.includes( event.key ) || event.key.startsWith( 'Arrow' ) ) return undefined

    let isValid = !this.config()?.mask || this.config()?.mask!.test( String( event.key ) )
    if( !isValid ) event.preventDefault()
    return isValid
  }

  /**
   * Обработчик нажатия кнопки Enter. Событие о нажатии на "Enter" необходимо в компоненте SignInComponent.
   */
  protected onKeyPress( event: KeyboardEvent ): void {
    if( event.key === enterKey ) this.enterKey.emit( true )
  }

  // -------------------------------------

  onInput( event?: Event ): void {
    const inputElement = this.inputElement()
    let newValue = inputElement?.value ?? null

    if( this.config().upperCased && inputElement ){
      const cursorPosition = inputElement.selectionStart // Запоминаем позицию курсора
      inputElement.value = inputElement.value.toUpperCase() // Преобразуем текст в верхний регистр
      inputElement.setSelectionRange(cursorPosition, cursorPosition) // Восстанавливаем курсор
    }

    if( this.config().transformInput && inputElement ){
      const transformed = this.config().transformInput!( inputElement.value,inputElement.selectionStart )
      newValue = transformed.newValue
      inputElement.value = newValue
      inputElement.setSelectionRange( transformed.newCursor, transformed.newCursor )
    }

    if( this.config().onInput || this.validateError() ) this.validate( newValue )
    this.input?.emit( event )

    if( this.config().onInput ){
      this.value.set( newValue )
    }
  }

  // -------------------------------------

  onChange( event?: Event ): void {
    event?.stopPropagation()
    event?.preventDefault()
    
    const inputElement = this.inputElement()
    let newValue = inputElement?.value ?? null
    newValue = this.config().noTrimInside
      ? newValue?.trim() ?? null
      : newValue?.replace( /\s+/g, ' ' )?.trim() ?? null
    this.value.set( newValue )
    this.processDirectUpdate( newValue )

    if ( this.config().ignoreValidateByEvents?.onChange ) return
    this.validate( newValue )
    this.change.emit( newValue )
  }

  // -------------------------------------

  onBlur( event?: Event ){
    this.isFocused.set( false )
    this.blur.emit( event )

    if ( this.config().ignoreValidateByEvents?.onBlur ) return
    this.validate( this.value() )
  }

  onFocus( event?: Event ){
    this.isFocused.set( true )
    this.focus.emit( event )
  }

}
