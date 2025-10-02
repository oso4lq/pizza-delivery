/* eslint-disable @angular-eslint/no-output-native */
// input-device.component.ts

import { ChangeDetectionStrategy, Component, computed, effect, inject, output, signal, untracked, ViewChild } from '@angular/core'
import { InputComponent, InputConfig } from '../../input.component'
import { AppState } from 'src/app/state/app.state';
import { DEVICE_TYPE_ICON, DEVICE_TYPE_TITLES, IQADevice } from 'src/app/state/models/company-dictionary.model';
import { BugDeviceEditorModalComponent } from './modals/bug-device-editor-modal.component'
import { IInputMultiSelectChangeData, IInputMultiSelectConfig, InputMultiselectComponent } from '../input-multiselect/input-multiselect.component'
import { IInputSelectChangeData, InputSelectOption } from '../input-select/input-select.component'


/**
 * Компонент-обёртка для InputMultiselectComponent.
 * Принимает IQADevice[] и преобразует их в набор опций (InputSelectOption[]).
 */

// ---------------------------------
/** Тип значения для поля ввода. */
type ValueType = IQADevice[] | null

/** Интерфейс конфигурации для выбора значения. */
// export interface IInputDeviceConfig extends InputConfig<ValueType> {}
export type IInputDeviceConfig = InputConfig<ValueType>;


// ---------------------------------
// Компонент
@Component({
  selector: 'app-input-device',
  template: `
    <app-input-multiselect
      [config]="selectConfig()"
      [(value)]="multiselectValueSig"
      (change)="onDeviceChange( $event )"
      (clickOnAddButton)="openDeviceModal()"
    />
  `,
  styles: `
    app-input-multiselect {
      margin: 0;
      padding: 0 !important;
      width: 100% !important;
    }
  `,
  imports: [
    InputMultiselectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDeviceComponent extends InputComponent<IInputDeviceConfig> {

  private appState = inject( AppState )

  // Получаем ссылку на дочерний InputMultiselectComponent, чтобы вызвать его метод close() при открытии модалки
  @ViewChild( InputMultiselectComponent ) private multiselectComponent!: InputMultiselectComponent

 

  // =============/ Сигналы и вычисляемые сигналы \=============

  // Все устройства проекта в объектах типа IQADevice
  private devicesList = computed<IQADevice[]>(()=> Object.values( this.appState.state()?.dictionaries?.qaDevices?.items ?? {} ).filter( d => d !== null ) )

  // Массив ID всех устройств для двусторонней привязки с InputMultiselectComponent
  public multiselectValueSig = signal<string[]>( [] )

  /**
   * Конфигурация для InputMultiselectComponent.
   * Здесь мы преобразуем каждый IQADevice в InputSelectOption с нужными параметрами.
   */
  selectConfig = computed<IInputMultiSelectConfig>( ()=>{

    // 1. Извлекаем доступные устройства из devicesList. Там могут быть несколько устройств одинакового типа.
    const devices = this.devicesList()

    // 2. Формируем опции с типом InputSelectOption для отправки в InputMultiselectComponent:
    /**
     export interface InputSelectOption<V = ValueType> {
       value: V | null                            <- IQADevice.ID
       group?: string
       searchField?: string

       checkboxIcon?: boolean                     <- Всегда true, потому что используем InputDeviceComponent

       icon?: string | IconName                   <- Иконка определяются по типу устройства DEVICE_TYPE_ICON[IQADevice.type]
       iconColor?: ColorKey                       <- Всегда 'secondary'
       iconSize?: number                          <- Всегда 20

       text?: string                              <- Название утройства, IQADevice.model
       textBefore?: string                        <- Тип устройства IQADevice.vendor
       textAfter?: string                         <- ОС устройства IQADevice.os
       cssClass?: string                          <- "qa-device-option"
       cssStyle?: Record<string, string>
     }
     */
    const options: InputSelectOption[] = devices.filter( d => d !== null ).map(device => ({
      value: device.ID,
      group: DEVICE_TYPE_TITLES[device.type],
      searchField: `${device.vendor} ${device.model} ${device.os}`,
      checkboxIcon: true,
      icon: DEVICE_TYPE_ICON[device.type],
      iconColor: 'secondary',
      iconSize: 16,
      text: device.model,
      textBefore: device.vendor,
      textAfter:`${device.os} ${device.screenW && device.screenH ? `[${device.screenW} x ${device.screenH}]` : ''}`,
      cssClass: 'qa-device-option'
    }))

    // 3. Возвращаем конфиг из родительского компонента (которым настраивается InputDeviceComponent) и перезаписываем внутренними настройками
    return {
      ...this.config(),
      optionClass: 'qa-device-option',
      noDefaultSelection: true,
      noSearch: true,
      options: options, // Передаём сгенерированные опции
      showAddButton: 'common.addDevice', // Текст кнопки добавления нового устройства
      checkboxIcon: true,
      groupTitles: 'separator',
      placeholderIcon: 'devices',
    } as IInputMultiSelectConfig
  })


  // =============/ Конструктор с эффектами для работы с IQADevice[] и string[] \=============

  constructor() {
    super()

    // Синхронизация изменений в IQADevice[] из value со string[] для multiselectValueSig
    effect( ()=>{
      const devices = this.value() ?? []
      const newIDs = devices.filter( device => device != null ).map( device => device.ID )
      if( !this.arraysEqual( newIDs, untracked( () => this.multiselectValueSig() ) ) ){
        this.multiselectValueSig.set( newIDs )
      }
    })

    // Синхронизация изменений в string[] из multiselectValueSig с IQADevice[] для value
    effect( ()=>{
      const ids = this.multiselectValueSig()
      const selectedDevices = this.devicesList().filter( device => ids.includes( device?.ID ?? '' ) )
      if( !this.devicesEqual( selectedDevices, untracked( () => this.value() ) ) ){
        this.value.set( selectedDevices )
        this.processDirectUpdate( selectedDevices )
      }
    })
  }


  // =============/ Методы \=============

  // Сравнение массивов строк
  private arraysEqual( a: string[], b: string[] ): boolean {
    return a.length === b.length && a.every( ( v, i ) => v === b[ i ] )
  }

  // Сравнение массивов устройств по ID
  private devicesEqual( a: IQADevice[], b: IQADevice[] | null | undefined ): boolean {
    if( !b ) return a.length === 0
    return a.length === b.length && a.every( ( device, index ) => device.ID === b[ index ].ID )
  }

  // Открытие модалки добавления нового устройства
  openDeviceModal(): void {
    this.multiselectComponent?.selectMultiComponent?.close()
    BugDeviceEditorModalComponent.show( null )
  }

  // Отправка родителю данные селектора при изменении данных
  onDeviceChange( event: IInputMultiSelectChangeData ): void {
    this.change.emit( event )
  }

}
