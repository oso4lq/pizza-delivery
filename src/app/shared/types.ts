// types.ts

import { Signal } from "@angular/core";

// Тип для извлечения значения из Signal<T>
export type SignalValue<T> = T extends Signal<infer U> ? Exclude<U, undefined> : never;

// Определение цветов и типа ColorKey
export const COLORS = {
  // special colors
  'service': '#868C94',
  'black': '#000000',
  'white': '#FFFFFF',
  'blue': '#16A4E3',
  'green': '#1BBA69',
  'red': '#CE0000',
  'pink': '#F5CCCC',
  'orange': '#FF9000',
  'brand': '#ffaf18',
} as const
export type ColorKey = keyof typeof COLORS;
