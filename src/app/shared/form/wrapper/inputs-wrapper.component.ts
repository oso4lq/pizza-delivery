// inputs-wrapper.component.ts

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { IconComponent } from '../../icon/icon.component';
import { InputConfig } from '../input.component';
import { InputsLabelComponent, InputsLabelConfig } from './label.component';

@Component({
  selector: 'app-inputs-wrapper',
  template: `
    @if( config().label ) {
    <div class="label-with-icon">
      <app-inputs-label
        [id]="id()"
        [config]="label()"
        [validClass]="validateError() ? 'invalid' : ''"
      />
      @if( config().showInfoIcon ){
      <app-icon name="info-filled" [size]="12" color="service" />
      }
    </div>
    }
    <ng-content />
    @if( validateError() && !config().hideErrorMessage ){
    <p class="error-message">{{ validateError() }}</p>
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
  imports: [CommonModule, InputsLabelComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputsWrapperComponent {
  config = input.required<InputConfig>();
  id = input.required<InputConfig['id']>();
  validateError = input.required<string | null>();
  label = computed<InputsLabelConfig>(() => {
    const label = this.config().label;
    if (!label) return { text: this.id() } as InputsLabelConfig;
    if (typeof label === 'string') return { text: label };
    return label as InputsLabelConfig;
  });
}
