// input-phone.component.ts

import { Component, computed, ChangeDetectionStrategy, output } from '@angular/core'
import { InputComponent, InputConfig } from '../input.component'
import { IInputTextConfig, InputTextComponent } from './input-text/input-text.component'
import { CountriesDictionary, } from '../../countries-dictionary.class'
import { IconComponent } from '../../icon/icon.component'
import { Utill } from '../../utils'

// --------------------------------- Модели и интерфейсы для компонента

/** Тип значения поля формы: string. */
type ValueType = string

/** Представление конфигурации для поля формы. */
export interface IInputPhoneConfig extends InputConfig<ValueType> {
  noCountrySelect?: boolean
}

const emptyPhone = 'validation.emptyPhone'
const incorrectPhone = 'validation.incorrectPhone'

// --------------------------------- Реализация компонента

// <app-input-country prefix class="country" [config]="{ selected: 'code', showCodeInList: true, wrapperClass: null, selectedClass: 'country-option-selected' }" [(value)]="selectedCountryKey"/>

/**
 * Компонент реализующий поле для ввода номера телефона.
 */
@Component({
  selector: 'app-input-phone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ InputTextComponent, IconComponent ],
  template: `
    <app-input-text
      class="phone"
      [(inputClasses)]="inputClasses"
      [(validateError)]="validateError"
      [config]="textConfig()"
      [value]="textValue()"
      (valueChange)="textValueChange($event)"
      (input)="validate( value() )"
      (blur)="validate( value() )"
      (enterKey)="onEnterKey( $event )" >
      @if ( !config().noCountrySelect && selectedCountry()) {
        <app-icon prefix class="country" src="/assets/flags/{{ selectedCountry()!.key }}.png" />
      }
    </app-input-text>
  `,
  styles: `
    :host {
      display: flex;
      width: 100%;
    }

    .country {
      margin: 9px 10px 0 8px;
      flex-shrink: 0;
      user-select: none;
      border-radius: 50%;
    }

    .phone {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      padding-left: 0px;
      width: 100%;
    }
  `
})
export class InputPhoneComponent extends InputComponent<IInputPhoneConfig> {
  private countries = new CountriesDictionary()
  // selectedCountry = computed( () => this.countries.getByPhone( this.value() ) ?? ( this.config().validate?.allowNull ? undefined : this.countries.current ) )
  selectedCountry = computed( () => this.countries.getByPhone( this.value() ) ?? this.countries.current )

  /** Конфигурирование компонента. */
  protected textConfig = computed<IInputTextConfig>( ()=>{
    let config = this.config()
    return {
      ...config,
      placeholder: config.placeholder ?? 'Номер телефона',
      ignoreValidateByEvents: { 'onChange': true, 'onBlur': true },
      validate: { ...config.validate, handler: this.validate.bind( this ) },
      wrapperClass: null,
      onInput: true,
      mask: /\d/,
      transformInput: this.transformInput,
      inputMode: 'tel',
    } as IInputTextConfig
  })

  transformInput = ( valueOp: string, cursor: number | null )=>{
    const value = valueOp === '89' && this.countries.currentLocale === 'ru-RU' ? '79' : valueOp
    const newValue = this.config().validate?.allowNull && (valueOp === '+' || valueOp === '') ? '' : this.countries.formatPhone( value, this.selectedCountry()?.key )
    const newCursor = cursor ? cursor + ( newValue.length - value.length ) : null
    return { newValue, newCursor }
  }

  // Сигнал получающий правильно сформированный телефон из строки для установки в поле ввода текста
  textValue = computed<string>( () => this.value() || this.config().validate?.allowNull !== true ? this.countries.formatPhone( this.value(), this.selectedCountry()?.key ) : '' )

  /** Событие родительскому компоненту, о том, что в поле была нажата кнопка Enter. */
  enterKey = output<void>()

  // Обработка вводимого пользователем в поле текста телефона
  textValueChange( newValue?: number | string | null ){
    let value = String( newValue ?? '' )
    value = Utill.onlyDigits( value )
    this.validate( value )
    this.value.set( value )
    this.change.emit( value )
  }

  private lastSpaces?: number
  /**
   * Метод для генерации случайного количества пробелов (от 1 до 5) без повторения количества пробелов с
   * предыдущим результатом.
   */
  private spaceAdder( str: string ): string {
    let currentSpaces: number
    do {
      currentSpaces = Math.floor( Math.random() * 5 ) + 1
    } while ( currentSpaces === this.lastSpaces )
    this.lastSpaces = currentSpaces
    return str + ' '.repeat( currentSpaces )
  }

  override validate( value: ValueType | undefined, setValidateError: boolean = true ): boolean {
    if( this.config().validate?.allowNull && !value ){
      if( setValidateError ) this.validateError.set( null )
      return true
    }

    if( !value ){
      if( setValidateError ) this.validateError.set( 'Нет номера телефона' )
      return false
    }

    let country = this.selectedCountry()
    if( !country ){
      if( setValidateError ) this.validateError.set( 'Неверный номер телефона' )
      return false
    }

    let phone = Utill.onlyDigits( value )
    let error: string | null = null

    // --------------------------------- Проверка длины номера телефона.

    let isPhoneLengthValid = phone.length === country.phoneLength
    if ( !isPhoneLengthValid ) error = 'Неверный номер телефона'

    // --------------------------------- Проверка начала номера телефона на допустимый country.area код.

    // Номер является правильным если для текущей страны он начинается либо с любой цифры,
    // либо с одной из area кода текущей страны.
    let isPhoneAreaValid = !( country.area && country.area.length > 0 ) || country.area.some( areaCode => phone.startsWith( country.code + areaCode ) )
    // Номер является неправильным если для текущей страны он начинается с одной из
    // недопустимой area кода для текущей страны.
    let isPhoneAreaInvalid = country.invalidArea && country.invalidArea.findIndex( x => phone.startsWith(x) ) >= 0
    isPhoneAreaValid = isPhoneAreaValid && !isPhoneAreaInvalid
    if ( !isPhoneAreaValid ) error = 'Неверный номер телефона'

    if( setValidateError )
      // При появлении одного и того же сообщения об ошибке "Неверный номер телефона" или "Incorrect phone"
      // в базовом компоненте InputComponent не срабатывает эффект inputClassesEffect, т.к. значение
      // сигнала validateError не изменяется, что приводит к отсутствию ошибки как таковой и пропадании сообщения
      // с текстом ошибки. Поэтому в конец текста с ошибкой добавляем случайное количество пробелов для
      // срабатывания эффекта.
      this.validateError.set( error ? this.spaceAdder( error ) : null )

    if( this.config().validate?.handler ){
      try {
        this.config().validate!.handler!( phone )
      } catch ( e ){
        if ( setValidateError ) this.validateError.set( ( e as Error ).message )
        return false
      }
    }

    if( setValidateError && this.config().validate?.asyncHandler ) this.config().validate!.asyncHandler!( phone, this.validateError )

    return !error
  }

  protected onEnterKey( value: boolean ): void {
    if( value ) this.enterKey.emit()
  }
}
