// frontend/src/app/shared/utils.ts

import { effect, signal, Signal } from '@angular/core';
import { v4 as uuid } from 'uuid';

export class Utill {
  /** Проверка e-mail на правильность формата. */
  static emailRegExp =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  /** В имени и фамилии допускается только один пробел между словами. */
  static nameRegExp = new RegExp(/^[a-zа-яё]+( [a-zа-яё]+)*$/, 'i');
  /** В отчестве допускается только один пробел между словами. */
  static patronymicRegExp = new RegExp(/^[a-zа-яё]*( [a-zа-яё]+)*$/, 'i');
  /**
   * Адрес в телеграм должен начинаться с символа @ и далее без пробелов символьно-цифровая последовательность
   * длиной от минимум 5 до максимум 32 символов.
   */
  static telegramRegExp = /^@[a-zA-Z0-9_]{5,32}$/;
  /** Пробелы недопустимы вначале и в конце строки, строка из пробелов недопустима. */
  static trimSpacesRegExp = /^(?!\s+).*(?<!\s+)$/;
  /**
   * Регулярное выражение для тестирования URI строки формата:
   * https://domain[:port]/path?query_string#fragment_id
   */
  static urlRegExp = new RegExp(
    '^http(s)?:\\/\\/((([-a-z0-9]{1,63}\\.)*?[a-z0-9]([-a-z0-9]{0,253}[a-z0-9])?\\.[a-z]{2,63})|((\\d{1,3}\\.){3}\\d{1,3}))(:\\d{1,5})?((\\/|\\?)((%[0-9a-f]{2})|[-\\w\\+\\.\\?\\/@~#&=])*)?$',
    'i'
  );

  static uuid(): string {
    return uuid();
  }

  /****************************************************************************

    String Formatting and Search

  ****************************************************************************/

  /**
   * Нормализует ID секции, удаляя символ '#' если он есть
   * @param sectionId - исходный ID секции
   * @returns нормализованный ID без '#'
   */
  static normalizeSectionId(sectionId: string): string {
    if (sectionId.startsWith('#')) return sectionId.substring(1);
    return sectionId;
  }

  /**
   * Removes HTML Tags from a string.
   */
  static stripTags(input: string): string {
    let text = input.replace(/<\/?[^>]+(>|$)/g, '');
    try {
      text = decodeURIComponent(text.trim());
      return text;
    } catch (e) {
      return text.trim();
    }
  }

  /**
   * Removes all non-numeric characters from a string.
   */
  static onlyDigits(input: string): string {
    return input.replace(/\D/g, '').trim();
  }

  /**
   * Capitalizes the first character of a string.
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Capitalizes the all first characters of the words in  string.
   */
  static capitalizeAll(str: string): string {
    const words = str.split(' ');

    for (let i = 0; i < words.length; i++) {
      words[i] = words[i][0].toUpperCase() + words[i].slice(1);
    }

    return words.join(' ');
  }

  static find(text?: string | null, inString?: string): boolean {
    if (!text || !inString) return true;
    return inString.toLowerCase().includes(text.toLowerCase());
  }

  /**
   * Case-insensitive search for ```keyword``` in ```content```.
   * Returns ```true``` if found, ```false``` if not found.
   */
  static match(keyword: string, content: string[]): boolean {
    return content.some((str) =>
      str.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  static findInArrayObjects(
    array: Record<string, any>[],
    key: string,
    text: string
  ): boolean {
    for (const obj of array) {
      if (
        obj[key] !== undefined &&
        obj[key] !== null &&
        typeof obj[key] === 'string' &&
        Utill.find(text, obj[key])
      ) {
        return true;
      }
    }
    return false;
  }

  static updateVersion(
    str: string,
    nest: number,
    val: number = 0,
    delimetr: string = '.'
  ): string {
    // Разделяем строку на массив чисел
    let parts = str.split(delimetr).map(Number);

    if (nest === -1) {
      // Удаляем последний элемент
      parts.pop();
    } else if (nest === 1) {
      // Добавляем новое значение 1
      parts.push(1);
    }

    // Увеличиваем последнее значение на `val`
    if (parts.length > 0) {
      parts[parts.length - 1] += val;
    } else {
      parts.push(1);
    }

    // Формируем строку обратно
    return parts.join(delimetr);
  }

  /****************************************************************************

    Arrays

  ****************************************************************************/

  static consecutiveIntegers(first: number, last: number): number[] {
    return [...Array(last - first + 1).keys()].map((i) => i + first);
  }

  /****************************************************************************

    Working with Enums

  ****************************************************************************/

  /**
   * Keys of a numeric enum as an array of strings.
   * @param enumObject Enum that only contains numeric values.
   */
  static enumToKeysArray(enumObject: Object): string[] {
    return Object.keys(enumObject).filter((val) => isNaN(Number(val)));
  }

  /**
   * Values of a string enum as an array of strings.
   * @param enumObject Enum that only contains ```string``` values.
   */
  static enumToValuesArray(enumObject: Object): string[] {
    return Object.values(enumObject).filter((val) => isNaN(Number(val)));
  }

  /**
   * Generates reverse mapping for objects with the type ```{[key: number]: string}```.
   */
  static reverseMapping(obj: { [key: number]: string }): {
    [key: string]: number;
  } {
    const map: { [key: string]: number } = {};
    Object.keys(obj).forEach((key) => {
      map[obj[parseInt(key)]] = parseInt(key);
    });
    return map;
  }

  /**
   * Получить дату в UTC зоне и сбросить время у даты в 0:0:0.000
   * @param value Значение даты.
   * @param startMonth true - начать месяц с 1 числа.
   * @returns Дата в UTC зоне.
   */
  static utcDate(
    value: Date | string | number,
    startMonth: boolean = false
  ): Date {
    let d = new Date(value);
    return new Date(
      Date.UTC(
        d.getFullYear(),
        d.getMonth(),
        startMonth ? 1 : d.getDate(),
        0,
        0,
        0,
        0
      )
    );
  }

  /**
   * Форматирование даты в формате DD.MM.YYYY.
   * @param value Значение даты для форматирования.
   */
  static formateDate(value: Date | string | number): string {
    let d = new Date(value);
    return (
      String(d.getDate()).padStart(2, '0') +
      '.' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '.' +
      String(d.getFullYear())
    );
  }

  /****************************************************************************

    Search And Matches

  ****************************************************************************/

  static isArrayKeysMachAsKeyOfObject(
    checkIDs: string[],
    obj?: Record<string, any> | null
  ): boolean {
    if (checkIDs.length === 0) {
      return true;
    }
    if (!obj) {
      return false;
    }
    for (const key of checkIDs) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return true;
      }
    }

    return false;
  }

  static isArrayStringsMachArray(check?: string[], src?: string[]): boolean {
    if (!check || check.length === 0 || !src || src.length === 0) {
      return true;
    }
    for (const key of check) {
      if (src.includes(key)) {
        return true;
      }
    }
    return false;
  }

  /****************************************************************************

    Time And Duration

  ****************************************************************************/

  static formatedTime(timeMin?: number, short: boolean = false): string {
    if (!timeMin) return '—';
    let m = timeMin < 60 ? timeMin : timeMin % 60;
    let h =
      timeMin < 60
        ? 0
        : short
        ? Math.round(timeMin / 60)
        : Math.ceil(timeMin / 60);
    if (short) {
      h > 0 ? h + '\u200Aч' : m + '\u200Aм';
    }
    if (h > 0 && m > 0) return h + 'ч ' + m + 'м';
    return h > 0 ? h + '\u200Aчac.' : m + '\u200Aмин.';
  }

  static formatedTimePair(
    timeMin?: number,
    ofTimeMin?: number,
    delimetr = '/'
  ): string {
    if (!timeMin && !ofTimeMin) return '';
    if (!timeMin && ofTimeMin)
      return `— ${delimetr} ${Utill.formatedTime(ofTimeMin, true)}`;
    if (timeMin && !ofTimeMin) return Utill.formatedTime(timeMin, false);

    let m1 = timeMin! < 60 ? timeMin : timeMin! % 60;
    let h1 = timeMin! < 60 ? 0 : Math.round(timeMin! / 60);
    let m2 = ofTimeMin! < 60 ? ofTimeMin : ofTimeMin! % 60;
    let h2 = ofTimeMin! < 60 ? 0 : Math.round(ofTimeMin! / 60);

    if (h1 > 0 && h2 > 0) return `${h1} ${delimetr} ${h2}ч`;
    if (h1 === 0 && h2 === 0) return `${m1} ${delimetr} ${m2}м`;

    if (h1 === 0 && h2 > 0) return `${m1}м ${delimetr} ${h2}ч`;
    if (h1 > 0 && h2 === 0) return `${h1}ч ${delimetr} ${m2}м`;

    return `${Utill.formatedTime(timeMin)} ${delimetr} ${Utill.formatedTime(
      ofTimeMin
    )}`;
  }

  /****************************************************************************

    Objects

  ****************************************************************************/

  static isEqual(v1?: any, v2?: any): boolean {
    if ((v1 === undefined || v1 === null) && (v2 === undefined || v2 === null))
      return true; // ?
    if (typeof v1 === 'object') return Utill.isObjectsEqual(v1, v2);
    if (Array.isArray(v1) && Array.isArray(v2)) {
      const sortedV1 = v1.sort();
      const sortedV2 = v2.sort();
      return sortedV1 === sortedV2;
    }
    return v1 === v2;
  }

  static isObjectsEqual(object?: any, object2?: any) {
    if (Utill.isObject(object) === false || Utill.isObject(object2) === false) {
      return object === object2;
    }

    let obj1 = object as Record<string, any>;
    let obj2 = object2 as Record<string, any>;

    const keys1 = Object.keys(obj1);

    if (keys1.length !== Object.keys(obj2).length) {
      return false;
    }

    for (const key of keys1) {
      if (Utill.isObjectsEqual(obj1[key], obj2[key]) === false) {
        return false;
      }
    }

    return true;
  }

  static isObject(obj?: any) {
    return (
      obj !== undefined &&
      typeof obj === 'object' &&
      obj !== null &&
      obj instanceof Date === false &&
      Array.isArray(obj) === false
    );
  }

  /**
   * Дебаунс сигнала (возвращает новый сигнал с задержкой при частых вызовах) без RxJS
   * @param input - Исходный реактивный сигнал любого типа, который нужно дебаунсить. При изменении этого сигнала будет запускаться таймер задержки
   * @param delayMs - Задержка в миллисекундах перед обновлением выходного сигнала. При значении 0 обновление будет мгновенным.
   * @returns Новый сигнал типа T, который обновляется с заданной задержкой после  последнего изменения входного сигнала.
   */
  static debouncedSignal<T>(
    input: Signal<T>,
    delayMs: Signal<number>
  ): Signal<T> {
    const output = signal(input());
    let timeoutId: ReturnType<typeof setTimeout> | null = null; // null когда таймаут завершен или отменен

    effect(() => {
      const value = input();
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        output.set(value);
        timeoutId = null;
      }, delayMs());
    });

    return output;
  }
}

declare const ExceptionTitles: {
  TimeResync: string;
  BadRequest: string;
  Validation: string;
  Authorize: string;
  AccessNotAllowed: string;
  NotFound: string;
  MethodNotAllowed: string;
  ExternalRequest: string;
  Core: string;
  Service: string;
  DataSource: string;
  UserBlocked: string;
  IPAddressNotAllowed: string;
  UnprocessableContent: string;
  NoInternet: string;
  Server: string;
};
interface Options {
  alert?: boolean;
  showParamsInResponse?: boolean;
}
export type ExceptionType = keyof typeof ExceptionTitles;
export declare class Exception extends Error {
  static httpCodeBy(type: ExceptionType): number;
  static typeBy(httpCode: number): ExceptionType;
  type: ExceptionType;
  params?: Record<string, any>;
  options?: Options;
  constructor(
    typeOrCode: ExceptionType | number,
    messageOrError: string | Error | unknown,
    params?: Record<string, any>,
    options?: Options
  );
  get title(): string;
  get httpCode(): number;
}
export {};
//# sourceMappingURL=exception.d.ts.map

export declare class Util {
  static isObject(obj?: any): boolean;
  static isObjectsEqual(object?: any, object2?: any): boolean;
  static objPickKeys<O = Record<string, any>>(
    obj: O,
    keys: (keyof O)[]
  ): Partial<O>;
  static objDeleteKeys<O>(obj: Partial<O>, keys: (keyof O)[]): Partial<O>;
  static enumToKeysArray(enumObject: Object): string[];
  static enumToValuesArray<E>(enumObject: Object): E[];
  static randomElement<I = any>(arr: I[]): I;
  static deleteElement<I = any>(arr: I[], elm: I): I[];
  static reverseMapping(obj: { [key: number]: string }): {
    [key: string]: number;
  };
  static asyncSleep(ms: number, fn?: (id: any) => void): Promise<boolean>;
  static mathRound(num: number, n?: number): number;
  static getDayKey(date?: Date): number;
  static getDateWithTimeZone(date?: Date, offsetMin?: number): Date;
  static getFormattedDate(
    date?: Date,
    delimiter?: string,
    options?: {
      offsetMin?: number;
      timeInFirstPosition?: boolean;
      addSeconds?: boolean;
      dateOnly?: boolean;
    }
  ): string;
  static getDateAndTimeFromISO(
    isoString: string,
    offsetMin?: number
  ): {
    date: string;
    time: string;
  };
  static getTimeSecSince(since: number, sec?: string): string;
  static strOnlyDigits(str: string): string;
  static formatCurrencyNum(money: number, currency?: string): string;
  static formatCurrencyStr(str: string, currency?: string): string;
  static findText(text?: string | null, inString?: string): boolean;
  static findInArrayObjects(
    array: Record<string, any>[],
    key: string,
    text: string
  ): boolean;
  static declineWord: (
    n: number,
    word: keyof typeof this.acceptedWords
  ) => string;
  static acceptedWords: {
    минута: {
      forTwo: string;
      forFive: string;
    };
    час: {
      forTwo: string;
      forFive: string;
    };
    день: {
      forTwo: string;
      forFive: string;
    };
    месяц: {
      forTwo: string;
      forFive: string;
    };
    год: {
      forTwo: string;
      forFive: string;
    };
    клиент: {
      forTwo: string;
      forFive: string;
    };
    пользователь: {
      forTwo: string;
      forFive: string;
    };
  };
  static capitalize(str: string): string;
  static makeStringValue(dVal: number, bGender: boolean): string | number;
  static checkNumber(
    fValue: number,
    oObjDesc: OrderItem,
    fnAddNum: FnAddNumber,
    fnAddDesc: FnAddNumber
  ): void;
  static numberToPhrase(fAmount: number, withCurrencyDesc?: boolean): string;
}
interface OrderItem {
  _Gender: boolean;
  _arrStates: string[];
}
type FnAddNumber = (value: string | number) => void;
export {};
//# sourceMappingURL=utility.d.ts.map
