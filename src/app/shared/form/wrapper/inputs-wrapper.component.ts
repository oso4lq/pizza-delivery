// inputs-wrapper.component.ts

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { InputConfig, InputTooltip } from '../input.component'
import { CommonModule } from '@angular/common'
import { InputsLabelComponent, InputsLabelConfig } from './label.component'
import { IconComponent } from 'src/app/shared/_ui/icon/icon.component';
import { TippyDirective } from '@ngneat/helipopper'

@Component({
  selector: 'app-inputs-wrapper',
  template: `
    @if( config().label ) {
      <div class="label-with-icon">
        <app-inputs-label [id]="id()" [config]="label()" [validClass]=" validateError() ? 'invalid' : '' " />
        @if( config().showInfoIcon && tooltipCfg() ){
          <app-icon
            name="info-filled"
            [size]="12"
            color="service"
            [tp]="tooltipCfg()?.text"
            [tpPlacement]="'right'"
          />
        }
      </div>
    }
    <ng-content />
    @if( validateError() && !config().hideErrorMessage ){
      <p class="error-message"> {{ validateError() }} </p>
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;

      .label-with-icon {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  `,
  imports: [
    CommonModule,
    InputsLabelComponent,
    IconComponent,
    TippyDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputsWrapperComponent {
  config = input.required<InputConfig>()
  id = input.required<InputConfig[ 'id' ]>()
  validateError = input.required<string | null>()
  label = computed<InputsLabelConfig>( ()=>{
    const label = this.config().label
    if( !label ) return { text: this.id() } as InputsLabelConfig
    if( typeof label === 'string' ) return { text: label }
    return label as InputsLabelConfig
  })

  /**
   * Преобразуем любые tooltip в единый InputTooltip
   */
  readonly tooltipCfg = computed<InputTooltip | undefined>(() => {
    const cfg = this.config()
    if( !cfg.showInfoIcon || !cfg.tooltip ) return undefined
    return typeof cfg.tooltip === 'string'
      ? { text: cfg.tooltip }
      : cfg.tooltip
  })
}
