// button.component.ts

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, input, computed } from '@angular/core'

export type ButtonType = 'stroked' | 'raised' | 'tonal'

const viewTypes = [ 'app-button', 'app-raised-button', 'app-stroked-button', 'app-tonal-button' ]

@Component({
  selector: 'button[app-button]',
  template: `
    <div class="covering-background"></div>
    <span class="content">
      <ng-content></ng-content>
    </span>
  `,
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'color() + " app-" + type() + "-button"'
  }
})
export class ButtonComponent implements AfterViewInit {

  public color = input<ColorKey>( 'primary' )
  public type = input<ButtonType>( 'raised' )

  constructor( private elementRef: ElementRef<HTMLElement> ){}

  ngAfterViewInit() {
    let element = this.elementRef.nativeElement
    for( let viewType of viewTypes ){
      if( element.attributes.getNamedItem( viewType ) ) element.classList.add( viewType )
    }
  }
}
