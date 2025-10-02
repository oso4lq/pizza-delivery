// bug-device-editor-modal.component.ts

import { CommonModule } from '@angular/common'
import { v4 as uuid } from 'uuid'
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { ModalComponent } from 'src/app/shared/modal/modal.component'
import { InputTextComponent } from '../../input-text/input-text.component'
import { DEVICE_TYPE_ICON, DEVICE_TYPE_TITLES, IQADevice, QADeviceType } from 'src/app/state/models/company-dictionary.model';
import { InputSelectComponent } from '../../input-select/input-select.component'
import { Util } from '@soft-artel/modules'
import { Form } from '../../../form.namespace'

@Component({
  selector: 'app-bug-device-editor',
  imports: [ CommonModule ],
  template: `
  <!-- Шаблон с группой полей формы. Добавляется по необходимости. -->
  <ng-container *ngTemplateOutlet="formRef()" />


`,
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BugDeviceEditorModalComponent extends ModalComponent {

  override modal = computed( () => ({
    title: this.langService.get( this.inputData()?.ID ? 'device.modalTitle.edit' : 'device.modalTitle.add' ),
    width: 518,
  }))

  override inputData = input.required<{ ID: string } | null>()

  device = computed(() => this.appState.state()?.dictionaries?.qaDevices.items[ this.inputData()?.ID ?? ''  ] )

  override formItems = computed( () => ({

    type: InputSelectComponent.from({
      label:  'form.type',
      value: this.device()?.type ?? null,
      wrapperClass: 'w-50 add-gap',
      optionClass: 'qa-device-option',
      noDefaultSelection: true,
      noSearch: true,
      options: Util.enumToValuesArray<QADeviceType>( QADeviceType )
        .map(type => ({
          value: type,
          icon: DEVICE_TYPE_ICON[ type ],
          text: DEVICE_TYPE_TITLES[ type ],
          iconSize: 16,
        })),
      translateOptions: true
    }),

    vendor: InputTextComponent.from({
      label: { text: this.langService.get( 'device.vendor' ) },
      value: this.device()?.vendor ?? null,
      wrapperClass: 'w-50',
    }),

    model: InputTextComponent.from({
      label: { text: this.langService.get( 'device.model' ) },
      value: this.device()?.model ?? null,
      wrapperClass: 'w-50 add-gap',
    }),

    os: InputTextComponent.from({
      label: { text: this.langService.get( 'device.os' ) },
      value: this.device()?.os ?? null,
      validate: { allowNull: true },
      wrapperClass: 'w-50',
    }),

    screenW: InputTextComponent.from({
      label: { text: this.langService.get( 'device.screenW' ) },
      value: this.device()?.screenW ?? null,
      validate: { allowNull: true },
      wrapperClass: 'w-50 add-gap',
      mask: /[\d]/,
    }),

    screenH: InputTextComponent.from({
      label: { text: this.langService.get( 'device.screenH' ) },
      value: this.device()?.screenH ?? null,
      validate: { allowNull: true },
      wrapperClass: 'w-50',
      mask: /[\d]/,
    }),

  }) satisfies Form.ConfigType<IQADevice> )

  override async primaryAction() {
    const data = this.formValues()
    if( !data ) return
    const newDevice = { ID: this.inputData()?.ID || uuid(), ...data }
    this.close(  await this.appState.updateDictionary( 'qaDevices', { [ newDevice.ID ]: newDevice } ) )
  }
}
