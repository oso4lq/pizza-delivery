// frontend/src/app/shared/_ui/button/button.component.ts

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, input } from '@angular/core'

import { ColorKey } from 'src/app/types'

const viewTypes = [ 'app-button', 'app-raised-button', 'app-stroked-button', 'app-tonal-button' ]

@Component({
  selector: 'button[app-button], button[app-raised-button], button[app-stroked-button], button[app-tonal-button]',
  template: `
    <div class="covering-background"></div>
    <span class="content">
      <ng-content></ng-content>
    </span>
  `,
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'color()'
  }
})
export class ButtonComponent implements AfterViewInit {
  public color = input<ColorKey>( 'primary' )

  constructor( private elementRef: ElementRef<HTMLElement> ){}

  ngAfterViewInit() {
    let element = this.elementRef.nativeElement
    for( let viewType of viewTypes ){
      if( element.attributes.getNamedItem( viewType ) ) element.classList.add( viewType )
    }
  }
}
