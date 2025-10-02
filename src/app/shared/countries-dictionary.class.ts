//  countries-dictionary.class.ts

// ---------------------------------


import { Utill } from "./utils"

export type CountryKey = string
export const DEFAULT_LOCALE  = 'ru-RU'
export const DEFAULT_COUNTRY_KEY = 'ru'

/** Представление данных о стране. */
export interface ICountry {
  /**
   * Ключ страны - двух или трёх буквенное обозначение,
   * также является наименованием иконки флага страны.
   */
  key: string
  /** Наименование страны на русском. */
  nameRu: string
  /** Наименование страны международное. */
  nameEn: string
  /** Код страны по стандартам  ISO. */
  iso: string
  /** Язык страны. */
  lang: string
  /** Country code: 1 - 3 цифр. */
  code: string
  /** Список Area codes страны: 1 - 4 цифр. */
  area?: string[]
  /** Идентификатор языка для указания используемой в стране локализации. */
  locale?: string
  /** Шаблон номера телефона в национальном формате без Country code. */
  mask: string
  /** Длина номера телефона без пробелов и без Country code. */
  phoneLength: number
  /**
   * Список недопустимых для страны телефонных кодов.
   * Список актуален в основном для стран имеющих одинаковые country.code,
   * но различающиеся по country.area.
   *
   * Пример: для России ( +7 ) недопустимыми являются коды для стран
   * Казахстан ( +76, +77 ), Абхазия ( +7840, +7940 ) и Южная Осетия ( +7850, +7929 ),
   * т.к. эти страны также начинаются на +7.
   *
   * Свойство заполняется при сортировке стран.
   */
  invalidArea?: string[]
}

// ----------------------------------

export class CountriesDictionary{


  currentLocale: string

  current: ICountry

  constructor( locale: string = 'ru-RU' ){
    this.currentLocale = locale
    this.current = this.getByLocale( locale ) ?? this.getByLocale( this.sourceLocale )!
  }

  // ----------------------------------

  /**
   * Получение страны по ключу
   * @param key - ключ страны в справочнике
   */
  public get( key?: CountryKey ): ICountry{
    if( !key ) return this.current
    return this.translateName( this.sourceCountries[ key ] ) ?? this.current
  }

  /**
   * Получение страны по локали
   * @param locale - локаль страны
   */
  public getByLocale( locale: string ): ICountry | null {
    for (const c of Object.values( this.sourceCountries )) {
      if( c.locale === locale ) return this.translateName( c )
    }
    console.error( `Country with locale: ${ locale } not found in source dictionary!`)
    return null
  }

  /**
   * Получение страны по номеру телефона
   * @param phone - локаль страны
   */
  public getByPhone( phoneOpt?: string ): ICountry | null {
    if( !phoneOpt ) return null
    const phone = Utill.onlyDigits( phoneOpt )

    let countryCode: ICountry | null = null
    for (const c of Object.values( this.sourceCountries )) {
      if( !phone.startsWith( c.code ) ) continue

      // проверяем что он не в invalidArea
      if( c.invalidArea?.find( area => phone.startsWith( `${ c.code }${ area }` ) ) ){
        continue
      }



      if( !c.area || c.area.length === 0 ){
        countryCode = c
      }

      // проверяем что телефон подходит на код + зону
      if( c.area?.find( area => phone.startsWith( `${ c.code }${ area }` ) ) ){
        return c
      }
    }
    !countryCode && console.error( `Country with phone: ${ phone } not found in source dictionary!`)
    return countryCode
  }

  /**
   * Отсортированный в соответствии с заданным языком список стран.
   * @param key - ключ страны в справочнике
   */
  public get sortedList(): ICountry[] {
    const unsortedList = this.currentLocale === this.sourceLocale ? Object.values( this.sourceCountries )
                                                                  : Object.values( this.sourceCountries ).map( c => this.translateName( c ) )
    return unsortedList.sort( ( a, b ) => a.nameRu.localeCompare( b.nameRu ) )
  }

  // ---------------------------------
  /**
   * Формирование номера телефона по шаблону
   * @param phone - строка с номером телефон
   * @param countryKey - необязательный ключ (если отсутствует то берем страну по номеру)
   * @returns отформатированный в региональном стандарте телефон
   */
  public formatPhone( phoneOpt?: string, countryKey?: CountryKey ): string {
    const country = countryKey ? this.get( countryKey ) : this.getByPhone( phoneOpt )
    if( !country ) return phoneOpt ?? ''
    if( !phoneOpt ) return '+' + country.code

    let phone = Utill.onlyDigits( phoneOpt )
    const maxDigits = country.phoneLength
    if( phone.length <= country.code.length ) return '+' + phone

    let formattedPhone = ''
    phone = phone.slice( 0, maxDigits )

    const mask = country.mask
    let maskIndex = 0
    let phoneIndex = 0

    while( maskIndex < mask.length && phoneIndex < phone.length ){

      const maskChar = country.mask[ maskIndex ]

        if ( maskChar === 'х' ) {
            formattedPhone += phone[ phoneIndex ]
            phoneIndex++
        } else {
            formattedPhone += maskChar
        }
        maskIndex++
    }

    return `+${formattedPhone}`
  }

  // ----------------------------------
  // HELPERS

  // Перевод названия страны если надо не русский вариант который уже есть в справочнике
  private translateName( ruNamedCountry: ICountry, toLocale: string = this.currentLocale ): ICountry {
    if( toLocale === this.sourceLocale ) return ruNamedCountry

    let regionTranslator = new Intl.DisplayNames( [ toLocale ], { type: 'region' } )
    let country = { ...ruNamedCountry }
    try {
      country.nameRu = regionTranslator.of( country.key?.toLocaleUpperCase() || '' ) || country.nameRu // Если страна не переводится используется наименование на русском языке
    } catch (error) {}

    return country
  }

  // ----------------------------------
  // Исходный справочник на русском
  private sourceLocale = 'ru-RU'

  private sourceCountries: Record<string, ICountry> = {
    ab: { key: 'ab', nameRu: 'АБХАЗИЯ', nameEn: 'Abkhazian', iso: 'АB', lang: 'ab', code: '7', area: [ '940', '941', '943', '944' ], locale: 'ab-АB', mask: 'х ххх ххх хх хх', phoneLength: 11 },
    af: { key: 'af', nameRu: 'АФГАНИСТАН', nameEn: 'AFGHANISTAN', iso: 'AF', lang: 'ps', code: '93', area: [], locale: 'ps-AF', mask: 'хх хх ххх хххх', phoneLength: 11 },
    al: { key: 'al', nameRu: 'АЛБАНИЯ', nameEn: 'ALBANIA', iso: 'AL', lang: 'sq', code: '355', area: [], locale: 'sq-AL', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    dz: { key: 'dz', nameRu: 'АЛЖИР', nameEn: 'ALGERIA', iso: 'DZ', lang: 'ar', code: '213', area: [], locale: 'ar-DZ', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    as: { key: 'as', nameRu: 'АМЕРИКАНСКОЕ САМОА', nameEn: 'AMERICAN SAMOA', iso: 'AS', lang: 'sm', code: '1', area: [ '684' ], locale: 'sm-AS', mask: 'х ххх ххх хххх', phoneLength: 11 },
    ad: { key: 'ad', nameRu: 'АНДОРРА', nameEn: 'ANDORRA', iso: 'AD', lang: 'ca', code: '376', area: [], locale: 'ca-AD', mask: 'ххх ххх ххх', phoneLength: 9 },
    ao: { key: 'ao', nameRu: 'АНГОЛА', nameEn: 'ANGOLA', iso: 'AO', lang: 'pt', code: '244', area: [], locale: 'pt-AO', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    ag: { key: 'ag', nameRu: 'АНТИГУА И БАРБУДА', nameEn: 'ANTIGUA AND BARBUDA', iso: 'AG', lang: 'en', code: '1', area: [ '268' ], locale: 'en-AG', mask: 'х ххх ххх хххх', phoneLength: 11 },
    ar: { key: 'ar', nameRu: 'АРГЕНТИНА', nameEn: 'ARGENTINA', iso: 'AR', lang: 'es', code: '54', area: [], locale: 'es-AR', mask: 'хх хх хххх хххх', phoneLength: 12 },
    am: { key: 'am', nameRu: 'АРМЕНИЯ', nameEn: 'ARMENIA', iso: 'AM', lang: 'hy', code: '374', area: [], locale: 'hy-AM', mask: 'ххх хх хххххх', phoneLength: 11 },
    aw: { key: 'aw', nameRu: 'АРУБА', nameEn: 'ARUBA', iso: 'AW', lang: 'nl', code: '297', area: [], locale: 'nl-AW', mask: 'ххх ххх хххх', phoneLength: 10 },
    au: { key: 'au', nameRu: 'АВСТРАЛИЯ', nameEn: 'AUSTRALIA', iso: 'AU', lang: 'en', code: '61', area: [], locale: 'en-AU', mask: 'хх х хххх хххх', phoneLength: 11 },
    at: { key: 'at', nameRu: 'АВСТРИЯ', nameEn: 'AUSTRIA', iso: 'AT', lang: 'de', code: '43', area: [], locale: 'de-AT', mask: 'хх ххх ххххххх', phoneLength: 12 },
    az: { key: 'az', nameRu: 'АЗЕРБАЙДЖАН', nameEn: 'AZERBAIJAN', iso: 'AZ', lang: 'az', code: '994', area: [], locale: 'az-AZ', mask: 'ххх хх ххх хх хх', phoneLength: 12 },
    bs: { key: 'bs', nameRu: 'БАГАМСКИЕ ОСТРОВА', nameEn: 'BAHAMAS', iso: 'BS', lang: 'en', code: '1', area: [ '242' ], locale: 'en-BS', mask: 'х ххх ххх хххх', phoneLength: 11 },
    bh: { key: 'bh', nameRu: 'БАХРЕЙН', nameEn: 'BAHRAIN', iso: 'BH', lang: 'ar', code: '973', area: [], locale: 'ar-BH', mask: 'ххх хххххххх', phoneLength: 11 },
    bd: { key: 'bd', nameRu: 'БАНГЛАДЕШ', nameEn: 'BANGLADESH', iso: 'BD', lang: 'bn', code: '880', area: [], locale: 'bn-BD', mask: 'ххх хххх хххххх', phoneLength: 13 },
    bb: { key: 'bb', nameRu: 'БАРБАДОС', nameEn: 'BARBADOS', iso: 'BB', lang: 'en', code: '1', area: [ '246' ], locale: 'en-BB', mask: 'х (ххх) ххх-хххх', phoneLength: 11 },
    by: { key: 'by', nameRu: 'БЕЛАРУСЬ', nameEn: 'BELARUS', iso: 'BY', lang: 'be', code: '375', area: [], locale: 'be-BY', mask: 'ххх (хх) ххх хх хх', phoneLength: 12 },
    be: { key: 'be', nameRu: 'БЕЛЬГИЯ', nameEn: 'BELGIUM', iso: 'BE', lang: 'nl', code: '32', area: [], locale: 'nl-BE', mask: 'хх ххх ххх ххх', phoneLength: 11 },
    bz: { key: 'bz', nameRu: 'БЕЛИЗ', nameEn: 'BELIZE', iso: 'BZ', lang: 'en', code: '501', area: [], locale: 'en-BZ', mask: 'ххх-ххх-хххх', phoneLength: 10 },
    bj: { key: 'bj', nameRu: 'БЕНИН', nameEn: 'BENIN', iso: 'BJ', lang: 'fr', code: '229', area: [], locale: 'fr-BJ', mask: 'ххх хх хх хх хх', phoneLength: 11 },
    bm: { key: 'bm', nameRu: 'БЕРМУДЫ', nameEn: 'BERMUDA', iso: 'BM', lang: 'en', code: '1', area: [ '441' ], locale: 'en-BM', mask: 'х ххх-ххх-хххх', phoneLength: 11 },
    bt: { key: 'bt', nameRu: 'БУТАН', nameEn: 'BHUTAN', iso: 'BT', lang: 'dz', code: '975', area: [], locale: 'dz-BT', mask: 'ххх-х-хххххх', phoneLength: 10 },
    bo: { key: 'bo', nameRu: 'БОЛИВИЯ', nameEn: 'BOLIVIA', iso: 'BO', lang: 'es', code: '591', area: [], locale: 'es-BO', mask: '(ххх) х ххххххх', phoneLength: 11 },
    ba: { key: 'ba', nameRu: 'БОСНИЯ И ГЕРЦЕГОВИНА', nameEn: 'BOSNIA AND HERZEGOVINA', iso: 'BA', lang: 'bs', code: '387', area: [], locale: 'bs-BA', mask: 'ххх хх-ххх-ххх', phoneLength: 11 },
    bw: { key: 'bw', nameRu: 'БОТСВАНА', nameEn: 'BOTSWANA', iso: 'BW', lang: 'st', code: '267', area: [], locale: 'st-BW', mask: 'ххх хх ххх ххх', phoneLength: 11 },
    br: { key: 'br', nameRu: 'БРАЗИЛИЯ', nameEn: 'BRAZIL', iso: 'BR', lang: 'pt', code: '55', area: [], locale: 'pt-BR', mask: 'хх хх хххх хххх', phoneLength: 12 },
    io: { key: 'io', nameRu: 'БРИТАНСКАЯ ТЕРРИТОРИЯ ИНДИЙСКОГО ОКЕАНА', nameEn: 'BRITISH INDIAN OCEAN TERRITORY', iso: 'IO', lang: 'en', code: '246', area: [], locale: 'en-IO', mask: 'ххх хххх хххх', phoneLength: 11 },
    bn: { key: 'bn', nameRu: 'БРУНЕЙ-ДАРУССАЛАМ', nameEn: 'BRUNEI DARUSSALAM', iso: 'BN', lang: 'ms', code: '673', area: [], locale: 'ms-BN', mask: '(ххх) ххххххх', phoneLength: 10 },
    bg: { key: 'bg', nameRu: 'БОЛГАРИЯ', nameEn: 'BULGARIA', iso: 'BG', lang: 'bg', code: '359', area: [], locale: 'bg-BG', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    bf: { key: 'bf', nameRu: 'БУРКИНА ФАСО', nameEn: 'BURKINA FASO', iso: 'BF', lang: 'fr', code: '226', area: [], locale: 'fr-BF', mask: '(ххх) хх хх хх хх', phoneLength: 11 },
    bi: { key: 'bi', nameRu: 'БУРУНДИ', nameEn: 'BURUNDI', iso: 'BI', lang: 'rn', code: '257', area: [], locale: 'rn-BI', mask: 'ххх хххххххх', phoneLength: 11 },
    kh: { key: 'kh', nameRu: 'КАМБОДЖА', nameEn: 'CAMBODIA', iso: 'KH', lang: 'km', code: '855', area: [], locale: 'km-KH', mask: '(ххх) хх ххх ххх', phoneLength: 11 },
    cm: { key: 'cm', nameRu: 'КАМЕРУН', nameEn: 'CAMEROON', iso: 'CM', lang: 'fr', code: '237', area: [], locale: 'fr-CM', mask: '(ххх) хх хх хх хх', phoneLength: 11 },
    ca: { key: 'ca', nameRu: 'КАНАДА', nameEn: 'CANADA', iso: 'CA', lang: 'en', code: '1', area: [ '403','587','780','236','250','604','778','204','431','506','902','782','902','226','289',
      '416','437','519','613','647','705','807','905','418','438','450','514','819','306','639','867','867','867','709' ], locale: 'en-CA', mask: 'х ххх-ххх-хххх', phoneLength: 11 },
    cv: { key: 'cv', nameRu: 'КАБО-ВЕРДЕ', nameEn: 'CAPE VERDE', iso: 'CV', lang: 'pt', code: '238', area: [], locale: 'pt-CV', mask: 'ххх хх ххххх', phoneLength: 10 },
    ky: { key: 'ky', nameRu: 'ОСТРОВА КАЙМАН', nameEn: 'CAYMAN ISLANDS', iso: 'KY', lang: 'en', code: '1', area: [ '345' ], locale: 'en-KY', mask: 'х (ххх) ххх-хххх', phoneLength: 11 },
    cf: { key: 'cf', nameRu: 'ЦЕНТРАЛЬНО-АФРИКАНСКАЯ РЕСПУБЛИКА', nameEn: 'CENTRAL AFRICAN REPUBLIC', iso: 'CF', lang: 'fr', code: '236', area: [], locale: 'fr-CF', mask: '(ххх) хх хх хх хх', phoneLength: 11 },
    td: { key: 'td', nameRu: 'ЧАД', nameEn: 'CHAD', iso: 'TD', lang: 'ar', code: '235', area: [], locale: 'ar-TD', mask: '(ххх) хх хх хх хх', phoneLength: 11 },
    cl: { key: 'cl', nameRu: 'ЧИЛИ', nameEn: 'CHILE', iso: 'CL', lang: 'es', code: '56', area: [], locale: 'es-CL', mask: 'хх х хххх ххххх', phoneLength: 11 },
    cn: { key: 'cn', nameRu: 'КИТАЙ', nameEn: 'CHINA', iso: 'CN', lang: 'zh', code: '86', area: [], locale: 'zh-CN', mask: 'хх ххх хххх хххх', phoneLength: 13 },
    cx: { key: 'cx', nameRu: 'ОСТРОВ РОЖДЕСТВА', nameEn: 'CHRISTMAS ISLAND', iso: 'CX', lang: 'en', code: '61', area: [ '8', '9164' ], locale: 'en-CX', mask: 'хх х хххх хххх', phoneLength: 11 },
    cc: { key: 'cc', nameRu: 'КОКОСОВЫЕ ОСТРОВА', nameEn: 'COCOS (KEELING) ISLANDS', iso: 'CC', lang: 'en', code: '61', area: [ '8', '9162' ], locale: 'en-CC', mask: 'хх х хххх хххх', phoneLength: 11 },
    co: { key: 'co', nameRu: 'КОЛУМБИЯ', nameEn: 'COLOMBIA', iso: 'CO', lang: 'es', code: '57', area: [], locale: 'es-CO', mask: 'хх ххх ххххххх', phoneLength: 12 },
    km: { key: 'km', nameRu: 'КОМОРЫ', nameEn: 'COMOROS', iso: 'KM', lang: 'fr', code: '269', area: [], locale: 'fr-KM', mask: 'ххх ххх хх хх', phoneLength: 10 },
    cg: { key: 'cg', nameRu: 'РЕСПУБЛИКА КОНГО', nameEn: 'CONGO', iso: 'CG', lang: 'fr', code: '242', area: [], locale: 'fr-CG', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    cd: { key: 'cd', nameRu: 'КОНГО ДЕМОКРАТИЧЕСКАЯ РЕСПУБЛИКА', nameEn: 'CONGO THE DEMOCRATIC REPUBLIC OF THE', iso: 'CD', lang: 'fr', code: '243', area: [], locale: 'fr-CD', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    ck: { key: 'ck', nameRu: 'ОСТРОВА КУК', nameEn: 'COOK ISLANDS', iso: 'CK', lang: 'en', code: '682', area: [], locale: 'en-CK', mask: 'ххх ххххх', phoneLength: 8 },
    cr: { key: 'cr', nameRu: 'КОСТА-РИКА', nameEn: 'COSTA RICA', iso: 'CR', lang: 'es', code: '506', area: [], locale: 'es-CR', mask: 'ххх хххх хххх', phoneLength: 11 },
    ci: { key: 'ci', nameRu: "КОТ-Д'ИВУАР", nameEn: "CÔTE D'IVOIRE", iso: 'CI', lang: 'fr', code: '225', area: [], locale: 'fr-CI', mask: 'ххх хх хх хх хх хх', phoneLength: 13 },
    hr: { key: 'hr', nameRu: 'ХОРВАТИЯ', nameEn: 'CROATIA', iso: 'HR', lang: 'hr', code: '385', area: [], locale: 'hr-HR', mask: 'ххх хх хххх ххх', phoneLength: 12 },
    cu: { key: 'cu', nameRu: 'КУБА', nameEn: 'CUBA', iso: 'CU', lang: 'es', code: '53', area: [], locale: 'es-CU', mask: 'хх хххххххх', phoneLength: 10 },
    cy: { key: 'cy', nameRu: 'КИПР', nameEn: 'CYPRUS', iso: 'CY', lang: 'el', code: '357', area: [], locale: 'el-CY', mask: 'ххх хх хххххх', phoneLength: 11 },
    cz: { key: 'cz', nameRu: 'ЧЕХИЯ', nameEn: 'CZECH REPUBLIC', iso: 'CZ', lang: 'cs', code: '420', area: [], locale: 'cs-CZ', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    dk: { key: 'dk', nameRu: 'ДАНИЯ', nameEn: 'DENMARK', iso: 'DK', lang: 'da', code: '45', area: [], locale: 'da-DK', mask: 'хх хх хх хх хх', phoneLength: 10 },
    dj: { key: 'dj', nameRu: 'ДЖИБУТИ', nameEn: 'DJIBOUTI', iso: 'DJ', lang: 'fr', code: '253', area: [], locale: 'fr-DJ', mask: 'ххх хх хх хх хх', phoneLength: 11 },
    dm: { key: 'dm', nameRu: 'ДОМИНИКА', nameEn: 'DOMINICA', iso: 'DM', lang: 'en', code: '1', area: [ '767' ], locale: 'en-DM', mask: 'х ххх ххх хххх', phoneLength: 11 },
    do: { key: 'do', nameRu: 'ДОМИНИКАНСКАЯ РЕСПУБЛИКА', nameEn: 'DOMINICAN REPUBLIC', iso: 'DO', lang: 'es', code: '1', area: [ '809', '829', '849' ], locale: 'es-DO', mask: 'х ххх ххх хххх', phoneLength: 11 },
    ec: { key: 'ec', nameRu: 'ЭКВАДОР', nameEn: 'ECUADOR', iso: 'EC', lang: 'es', code: '593', area: [], locale: 'es-EC', mask: 'ххх хх ххххххх', phoneLength: 12 },
    eg: { key: 'eg', nameRu: 'ЕГИПЕТ', nameEn: 'EGYPT', iso: 'EG', lang: 'ar', code: '20', area: [], locale: 'ar-EG', mask: 'хх хх хххх хххх', phoneLength: 12 },
    sv: { key: 'sv', nameRu: 'САЛЬВАДОР', nameEn: 'EL SALVADOR', iso: 'SV', lang: 'es', code: '503', area: [], locale: 'es-SV', mask: '(ххх) хххх-хххх', phoneLength: 11 },
    gq: { key: 'gq', nameRu: 'ЭКВАТОРИАЛЬНАЯ ГВИНЕЯ', nameEn: 'EQUATORIAL GUINEA', iso: 'GQ', lang: 'es', code: '240', area: [], locale: 'es-GQ', mask: 'ххх ххх ххх хххх', phoneLength: 13 },
    er: { key: 'er', nameRu: 'ЭРИТРЕЯ', nameEn: 'ERITREA', iso: 'ER', lang: 'ti', code: '291', area: [], locale: 'ti-ER', mask: 'ххх хххххххх', phoneLength: 11 },
    ee: { key: 'ee', nameRu: 'ЭСТОНИЯ', nameEn: 'ESTONIA', iso: 'EE', lang: 'et', code: '372', area: [], locale: 'et-EE', mask: 'ххх хххх хххх', phoneLength: 11 },
    et: { key: 'et', nameRu: 'ЭФИОПИЯ', nameEn: 'ETHIOPIA', iso: 'ET', lang: 'am', code: '251', area: [], locale: 'am-ET', mask: 'ххх хх ххх хх хх', phoneLength: 12 },
    fk: { key: 'fk', nameRu: 'ФОЛКЛЕНДСКИЕ ОСТРОВА (МАЛЬВИНЫ)', nameEn: 'FALKLAND ISLANDS (MALVINAS)', iso: 'FK', lang: 'en', code: '500', area: [], locale: 'en-FK', mask: 'ххх ххххх', phoneLength: 8 },
    fo: { key: 'fo', nameRu: 'ФАРОЕВЫ ОСТРОВА', nameEn: 'FAROE ISLANDS', iso: 'FO', lang: 'fo', code: '298', area: [], locale: 'fo-FO', mask: 'ххх хх хх хх', phoneLength: 9 },
    fj: { key: 'fj', nameRu: 'ФИДЖИ', nameEn: 'FIJI', iso: 'FJ', lang: 'fj', code: '679', area: [], locale: 'fj-FJ', mask: 'ххх ххх хххх', phoneLength: 10 },
    fi: { key: 'fi', nameRu: 'ФИНЛЯНДИЯ', nameEn: 'FINLAND', iso: 'FI', lang: 'fi', code: '358', area: [], locale: 'fi-FI', mask: 'ххх х хххх ххх', phoneLength: 11 },
    fr: { key: 'fr', nameRu: 'ФРАНЦИЯ', nameEn: 'FRANCE', iso: 'FR', lang: 'fr', code: '33', area: [], locale: 'fr-FR', mask: 'хх х хх хх хх хх', phoneLength: 11 },
    gf: { key: 'gf', nameRu: 'ФРАНЦУЗСКАЯ ГВИАНА', nameEn: 'FRENCH GUIANA', iso: 'GF', lang: 'fr', code: '594', area: [], locale: 'fr-GF', mask: 'ххх хх хх хх', phoneLength: 9 },
    pf: { key: 'pf', nameRu: 'ФРАНЦУЗСКАЯ ПОЛИНЕЗИЯ', nameEn: 'FRENCH POLYNESIA', iso: 'PF', lang: 'fr', code: '689', area: [], locale: 'fr-PF', mask: 'ххх хх хх хх хх', phoneLength: 11 },
    ga: { key: 'ga', nameRu: 'ГАБОН', nameEn: 'GABON', iso: 'GA', lang: 'fr', code: '241', area: [], locale: 'fr-GA', mask: '(ххх) хх хх хх хх', phoneLength: 11 },
    gm: { key: 'gm', nameRu: 'ГАМБИЯ', nameEn: 'GAMBIA', iso: 'GM', lang: 'en', code: '220', area: [], locale: 'en-GM', mask: 'ххх ххх хххх', phoneLength: 10 },
    ge: { key: 'ge', nameRu: 'ГРУЗИЯ', nameEn: 'GEORGIA', iso: 'GE', lang: 'ka', code: '995', area: [], locale: 'ka-GE', mask: 'ххх ххх хххххх', phoneLength: 12 },
    de: { key: 'de', nameRu: 'ГЕРМАНИЯ', nameEn: 'GERMANY', iso: 'DE', lang: 'de', code: '49', area: [], locale: 'de-DE', mask: 'хх ххх ххххххх', phoneLength: 12 },
    gh: { key: 'gh', nameRu: 'ГАНА', nameEn: 'GHANA', iso: 'GH', lang: 'en', code: '233', area: [], locale: 'en-GH', mask: '(ххх) хх ххх хххх', phoneLength: 12 },
    gi: { key: 'gi', nameRu: 'ГИБРАЛТАР', nameEn: 'GIBRALTAR', iso: 'GI', lang: 'en', code: '350', area: [], locale: 'en-GI', mask: '(ххх) ххх ххх хх', phoneLength: 11 },
    gr: { key: 'gr', nameRu: 'ГРЕЦИЯ', nameEn: 'GREECE', iso: 'GR', lang: 'el', code: '30', area: [], locale: 'el-GR', mask: 'хх хххххххххх', phoneLength: 12 },
    gl: { key: 'gl', nameRu: 'ГРЕНЛАНДИЯ', nameEn: 'GREENLAND', iso: 'GL', lang: 'da', code: '299', area: [], locale: 'da-GL', mask: '(ххх) хх хх хх', phoneLength: 9 },
    gd: { key: 'gd', nameRu: 'ГРЕНАДА', nameEn: 'GRENADA', iso: 'GD', lang: 'en', code: '1', area: [ '473' ], locale: 'en-GD', mask: 'х (ххх) ххх-хххх', phoneLength: 11 },
    gp: { key: 'gp', nameRu: 'ГВАДЕЛУПА', nameEn: 'GUADELOUPE', iso: 'GP', lang: 'fr', code: '590', area: [], locale: 'fr-GP', mask: 'ххх ххх хх хх хх', phoneLength: 12 },
    gu: { key: 'gu', nameRu: 'ГУАМ', nameEn: 'GUAM', iso: 'GU', lang: 'en', code: '1', area: [ '671' ], locale: 'en-GU', mask: 'х-ххх-ххх-хххх', phoneLength: 11 },
    gt: { key: 'gt', nameRu: 'ГВАТЕМАЛА', nameEn: 'GUATEMALA', iso: 'GT', lang: 'es', code: '502', area: [], locale: 'es-GT', mask: 'ххх хххх хххх', phoneLength: 11 },
    gn: { key: 'gn', nameRu: 'ГВИНЕЯ', nameEn: 'GUINEA', iso: 'GN', lang: 'fr', code: '224', area: [], locale: 'fr-GN', mask: '(ххх) ххх ххх ххх', phoneLength: 12 },
    gw: { key: 'gw', nameRu: 'ГВИНЕЯ-БИСАУ', nameEn: 'GUINEA-BISSAU', iso: 'GW', lang: 'pt', code: '245', area: [], locale: 'pt-GW', mask: '(ххх) ххх ххх хх', phoneLength: 11 },
    gy: { key: 'gy', nameRu: 'ГАЙАНА', nameEn: 'GUYANA', iso: 'GY', lang: 'en', code: '592', area: [], locale: 'en-GY', mask: '(ххх) ххх хххх', phoneLength: 10 },
    ht: { key: 'ht', nameRu: 'ГАИТИ', nameEn: 'HAITI', iso: 'HT', lang: 'ht', code: '509', area: [], locale: 'ht-HT', mask: '(ххх) хххх-хххх', phoneLength: 11 },
    hn: { key: 'hn', nameRu: 'ГОНДУРАС', nameEn: 'HONDURAS', iso: 'HN', lang: 'es', code: '504', area: [], locale: 'es-HN', mask: '(ххх) хххх-хххх', phoneLength: 11 },
    hk: { key: 'hk', nameRu: 'ГОНКОНГ', nameEn: 'HONG KONG', iso: 'HK', lang: 'zh', code: '852', area: [], locale: 'zh-HK', mask: '(ххх) хххх хххх', phoneLength: 11 },
    hu: { key: 'hu', nameRu: 'ВЕНГРИЯ', nameEn: 'HUNGARY', iso: 'HU', lang: 'hu', code: '36', area: [], locale: 'hu-HU', mask: 'хх хх ххх хххх', phoneLength: 11 },
    is: { key: 'is', nameRu: 'ИСЛАНДИЯ', nameEn: 'ICELAND', iso: 'IS', lang: 'is', code: '354', area: [], locale: 'is-IS', mask: 'ххх ххх хххх', phoneLength: 10 },
    in: { key: 'in', nameRu: 'ИНДИЯ', nameEn: 'INDIA', iso: 'IN', lang: 'hi', code: '91', area: [], locale: 'hi-IN', mask: 'хх хх хххххххх', phoneLength: 12 },
    id: { key: 'id', nameRu: 'ИНДОНЕЗИЯ', nameEn: 'INDONESIA', iso: 'ID', lang: 'id', code: '62', area: [], locale: 'id-ID', mask: 'хх хх хххх хххх', phoneLength: 12 },
    ir: { key: 'ir', nameRu: 'ИРАН ИСЛАМСКАЯ РЕСПУБЛИКА', nameEn: 'IRAN ISLAMIC REPUBLIC OF', iso: 'IR', lang: 'fa', code: '98', area: [], locale: 'fa-IR', mask: 'хх ххх ххххххх', phoneLength: 12 },
    iq: { key: 'iq', nameRu: 'ИРАК', nameEn: 'IRAQ', iso: 'IQ', lang: 'ar', code: '964', area: [], locale: 'ar-IQ', mask: 'ххх ххх ххх хххх', phoneLength: 13 },
    ie: { key: 'ie', nameRu: 'ИРЛАНДИЯ', nameEn: 'IRELAND', iso: 'IE', lang: 'en', code: '353', area: [], locale: 'en-IE', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    il: { key: 'il', nameRu: 'ИЗРАИЛЬ', nameEn: 'ISRAEL', iso: 'IL', lang: 'he', code: '972', area: [], locale: 'he-IL', mask: 'ххх-хх-ххх-хххх', phoneLength: 12 },
    it: { key: 'it', nameRu: 'ИТАЛИЯ', nameEn: 'ITALY', iso: 'IT', lang: 'it', code: '39', area: [], locale: 'it-IT', mask: 'хх хх хххх хххх', phoneLength: 12 },
    jm: { key: 'jm', nameRu: 'ЯМАЙКА', nameEn: 'JAMAICA', iso: 'JM', lang: 'en', code: '1', area: [ '876' ], locale: 'en-JM', mask: 'х (ххх) ххх хххх', phoneLength: 11 },
    jp: { key: 'jp', nameRu: 'ЯПОНИЯ', nameEn: 'JAPAN', iso: 'JP', lang: 'ja', code: '81', area: [], locale: 'ja-JP', mask: 'хх-хх-хххх-хххх', phoneLength: 12 },
    jo: { key: 'jo', nameRu: 'ИОРДАНИЯ', nameEn: 'JORDAN', iso: 'JO', lang: 'ar', code: '962', area: [], locale: 'ar-JO', mask: 'ххх хх хххх ххх', phoneLength: 12 },
    kz: { key: 'kz', nameRu: 'КАЗАХСТАН', nameEn: 'KAZAKHSTAN', iso: 'KZ', lang: 'kk', code: '7', locale: 'kk-KZ', mask: 'х ххх ххх хххх', phoneLength: 11, area: [
      '700', '701', '702', '703', '704', '705', '706', '707', '708', '709', '747', '750', '751', '760', '761', '762',
      '763', '764', '771', '775', '776', '777', '778'
    ] },
    ke: { key: 'ke', nameRu: 'КЕНИЯ', nameEn: 'KENYA', iso: 'KE', lang: 'sw', code: '254', area: [], locale: 'sw-KE', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    ki: { key: 'ki', nameRu: 'КИРИБАТИ', nameEn: 'KIRIBATI', iso: 'KI', lang: 'en', code: '686', area: [], locale: 'en-KI', mask: 'ххх хх ххх', phoneLength: 8 },
    kp: { key: 'kp', nameRu: 'СЕВЕРНАЯ КОРЕЯ', nameEn: "KOREA DEMOCRATIC PEOPLE'S REPUBLIC OF", iso: 'KP', lang: 'ko', code: '850', area: [], locale: 'ko-KP', mask: 'ххх ххх ххх хххх', phoneLength: 13 },
    kr: { key: 'kr', nameRu: 'ЮЖНАЯ КОРЕЯ', nameEn: 'KOREA REPUBLIC OF', iso: 'KR', lang: 'ko', code: '82', area: [], locale: 'ko-KR', mask: 'хх-хх-хххх-хххх', phoneLength: 12 },
    kw: { key: 'kw', nameRu: 'КУВЕЙТ', nameEn: 'KUWAIT', iso: 'KW', lang: 'ar', code: '965', area: [], locale: 'ar-KW', mask: 'ххх хххххххх', phoneLength: 11 },
    kg: { key: 'kg', nameRu: 'КЫРГЫЗСТАН', nameEn: 'KYRGYZSTAN', iso: 'KG', lang: 'ky', code: '996', area: [], locale: 'ky-KG', mask: 'ххх ххх хххххх', phoneLength: 12 },
    la: { key: 'la', nameRu: 'ЛАОС НАРОДНАЯ ДЕМОКРАТИЧЕСКАЯ РЕСПУБЛИКА', nameEn: "LAO PEOPLE'S DEMOCRATIC REPUBLIC LAOS", iso: 'LA', lang: 'lo', code: '856', area: [], locale: 'lo-LA', mask: 'ххх хх хххххххх', phoneLength: 13 },
    lv: { key: 'lv', nameRu: 'ЛАТВИЯ', nameEn: 'LATVIA', iso: 'LV', lang: 'lv', code: '371', area: [], locale: 'lv-LV', mask: 'ххх хххххххх', phoneLength: 11 },
    lb: { key: 'lb', nameRu: 'ЛИВАН', nameEn: 'LEBANON', iso: 'LB', lang: 'ar', code: '961', area: [], locale: 'ar-LB', mask: 'ххх х ххх ххх', phoneLength: 10 },
    ls: { key: 'ls', nameRu: 'ЛЕСОТО', nameEn: 'LESOTHO', iso: 'LS', lang: 'st', code: '266', area: [], locale: 'st-LS', mask: 'ххх хххх хххх', phoneLength: 11 },
    lr: { key: 'lr', nameRu: 'ЛИБЕРИЯ', nameEn: 'LIBERIA', iso: 'LR', lang: 'en', code: '231', area: [], locale: 'en-LR', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    ly: { key: 'ly', nameRu: 'ЛИВИЯ ГОСУДАРСТВО', nameEn: 'LIBYA STATE OF', iso: 'LY', lang: 'ar', code: '218', area: [], locale: 'ar-LY', mask: 'ххх-хх-ххх-хххх', phoneLength: 12 },
    li: { key: 'li', nameRu: 'ЛИХТЕНШТЕЙН', nameEn: 'LIECHTENSTEIN', iso: 'LI', lang: 'de', code: '423', area: [], locale: 'de-LI', mask: 'ххх ххх хх хх', phoneLength: 10 },
    lt: { key: 'lt', nameRu: 'ЛИТВА', nameEn: 'LITHUANIA', iso: 'LT', lang: 'lt', code: '370', area: [], locale: 'lt-LT', mask: 'ххх х ххх хх хх', phoneLength: 11 },
    lu: { key: 'lu', nameRu: 'ЛЮКСЕМБУРГ', nameEn: 'LUXEMBOURG', iso: 'LU', lang: 'lb', code: '352', area: [], locale: 'lb-LU', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    mo: { key: 'mo', nameRu: 'МАКАО', nameEn: 'MACAO', iso: 'MO', lang: 'zh', code: '853', area: [], locale: 'zh-MO', mask: 'ххх хххх хххх', phoneLength: 11 },
    mk: { key: 'mk', nameRu: 'РЕСПУБЛИКА СЕВЕРНАЯ МАКЕДОНИЯ', nameEn: 'MACEDONIA THE FORMER YUGOSLAV REPUBLIC OF', iso: 'MK', lang: 'mk', code: '389', area: [], locale: 'mk-MK', mask: 'ххх хххх хххх', phoneLength: 11 },
    mg: { key: 'mg', nameRu: 'МАДАГАСКАР', nameEn: 'MADAGASCAR', iso: 'MG', lang: 'mg', code: '261', area: [], locale: 'mg-MG', mask: 'ххх ххх хх ххх хх', phoneLength: 13 },
    mw: { key: 'mw', nameRu: 'МАЛАВИ', nameEn: 'MALAWI', iso: 'MW', lang: 'te', code: '265', area: [], locale: 'te-MW', mask: 'ххх хххх хххх', phoneLength: 11 },
    my: { key: 'my', nameRu: 'МАЛАЙЗИЯ', nameEn: 'MALAYSIA', iso: 'MY', lang: 'ms', code: '60', area: [], locale: 'ms-MY', mask: 'хх хх хххх хххх', phoneLength: 12 },
    mv: { key: 'mv', nameRu: 'МАЛЬДИВЫ', nameEn: 'MALDIVES', iso: 'MV', lang: 'dv', code: '960', area: [], locale: 'dv-MV', mask: '(ххх) ххх хххх', phoneLength: 10 },
    ml: { key: 'ml', nameRu: 'МАЛИ', nameEn: 'MALI', iso: 'ML', lang: 'bm', code: '223', area: [], locale: 'bm-ML', mask: 'ххх хххх хххх', phoneLength: 11 },
    mt: { key: 'mt', nameRu: 'МАЛЬТА', nameEn: 'MALTA', iso: 'MT', lang: 'mt', code: '356', area: [], locale: 'mt-MT', mask: '(ххх) хххххххх', phoneLength: 11 },
    mh: { key: 'mh', nameRu: 'МАРШАЛЛОВЫ ОСТРОВА', nameEn: 'MARSHALL ISLANDS', iso: 'MH', lang: 'en', code: '692', area: [], locale: 'en-MH', mask: '(ххх) ххх-хххх', phoneLength: 10 },
    mq: { key: 'mq', nameRu: 'МАРТИНИКА', nameEn: 'MARTINIQUE', iso: 'MQ', lang: 'fr', code: '596', area: [], locale: 'fr-MQ', mask: 'ххх ххх хххххх', phoneLength: 12 },
    mr: { key: 'mr', nameRu: 'МАВРИТАНИЯ', nameEn: 'MAURITANIA', iso: 'MR', lang: 'ar', code: '222', area: [], locale: 'ar-MR', mask: 'ххх хх хх хх хх', phoneLength: 11 },
    mu: { key: 'mu', nameRu: 'МАВРИТИЙ', nameEn: 'MAURITIUS', iso: 'MU', lang: 'en', code: '230', area: [], locale: 'en-MU', mask: '(ххх) хххх хххх', phoneLength: 11 },
    yt: { key: 'yt', nameRu: 'МАЙОТТА', nameEn: 'MAYOTTE', iso: 'YT', lang: 'fr', code: '262', area: [], locale: 'fr-YT', mask: 'ххх ххх хх хх хх', phoneLength: 12 },
    mx: { key: 'mx', nameRu: 'МЕКСИКА', nameEn: 'MEXICO', iso: 'MX', lang: 'es', code: '52', area: [], locale: 'es-MX', mask: 'хх-хх-хххх-хххх', phoneLength: 12 },
    fm: { key: 'fm', nameRu: 'МИКРОНЕЗИЯ Федеративные Штаты', nameEn: 'MICRONESIA FEDERATED STATES OF', iso: 'FM', lang: 'en', code: '691', area: [], locale: 'en-FM', mask: 'ххх ххх хххх', phoneLength: 10 },
    md: { key: 'md', nameRu: 'МОЛДОВА РЕСПУБЛИКА', nameEn: 'MOLDOVA REPUBLIC OF', iso: 'MD', lang: 'ro', code: '373', area: [], locale: 'ro-MD', mask: 'ххх х хххх хххх', phoneLength: 12 },
    mc: { key: 'mc', nameRu: 'МОНАКО', nameEn: 'MONACO', iso: 'MC', lang: 'fr', code: '377', area: [], locale: 'fr-MC', mask: 'ххх хх хх хх хх', phoneLength: 11 },
    mn: { key: 'mn', nameRu: 'МОНГОЛИЯ', nameEn: 'MONGOLIA', iso: 'MN', lang: 'mn', code: '976', area: [], locale: 'mn-MN', mask: 'ххх хх хххххх', phoneLength: 11 },
    me: { key: 'me', nameRu: 'ЧЕРНОГОРИЯ', nameEn: 'MONTENEGRO', iso: 'ME', lang: 'sr', code: '382', area: [], locale: 'sr-ME', mask: 'ххх хх ххх ххх', phoneLength: 11 },
    ms: { key: 'ms', nameRu: 'МОНТСЕРРАТ', nameEn: 'MONTSERRAT', iso: 'MS', lang: 'en', code: '1', area: [ '664' ], locale: 'en-MS', mask: 'х ххх ххх хххх', phoneLength: 11 },
    ma: { key: 'ma', nameRu: 'МОРОККО', nameEn: 'MOROCCO', iso: 'MA', lang: 'ar', code: '212', area: [], locale: 'ar-MA', mask: 'ххх ххх-хххххх', phoneLength: 12 },
    mz: { key: 'mz', nameRu: 'Мозамбик', nameEn: 'MOZAMBIQUE', iso: 'MZ', lang: 'pt', code: '258', area: [], locale: 'pt-MZ', mask: 'ххх хх ххххххх', phoneLength: 12 },
    mm: { key: 'mm', nameRu: 'МЬЯНМА', nameEn: 'MYANMAR', iso: 'MM', lang: 'my', code: '95', area: [], locale: 'my-MM', mask: 'хх х ххх ххх ххх', phoneLength: 12 },
    na: { key: 'na', nameRu: 'НАМИБИЯ', nameEn: 'NAMIBIA', iso: 'NA', lang: 'en', code: '264', area: [], locale: 'en-NA', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    nr: { key: 'nr', nameRu: 'НАУРУ', nameEn: 'NAURU', iso: 'NR', lang: 'en', code: '674', area: [], locale: 'en-NR', mask: 'ххх ххх хххх', phoneLength: 10 },
    np: { key: 'np', nameRu: 'НЕПАЛ ФЕДЕРАЛЬНАЯ ДЕМОКРАТИЧЕСКАЯ РЕСПУБЛИКА', nameEn: 'NEPAL FEDERAL DEMOCRATIC REPUBLIC OF', iso: 'NP', lang: 'ne', code: '977', area: [], locale: 'ne-NP', mask: 'ххх хххххххххх', phoneLength: 13 },
    nl: { key: 'nl', nameRu: 'НИДЕРЛАНДЫ', nameEn: 'NETHERLANDS', iso: 'NL', lang: 'nl', code: '31', area: [], locale: 'nl-NL', mask: 'хх хх ххх хххх', phoneLength: 11 },
    an: { key: 'an', nameRu: 'НИДЕРЛАНДСКИЕ АНТИЛЫ', nameEn: 'NETHERLANDS ANTILLES', iso: 'AN', lang: 'nl', code: '599', area: [], locale: 'nl-AN', mask: 'ххх-х-хххххх', phoneLength: 10 },
    nc: { key: 'nc', nameRu: 'НОВАЯ КАЛЕДОНИЯ', nameEn: 'NEW CALEDONIA', iso: 'NC', lang: 'fr', code: '687', area: [], locale: 'fr-NC', mask: 'ххх хх хх хх', phoneLength: 9 },
    nz: { key: 'nz', nameRu: 'НОВАЯ ЗЕЛАНДИЯ', nameEn: 'NEW ZEALAND', iso: 'NZ', lang: 'en', code: '64', area: [], locale: 'en-NZ', mask: 'хх хх ххх хххх', phoneLength: 11 },
    ni: { key: 'ni', nameRu: 'Никарагуа', nameEn: 'NICARAGUA', iso: 'NI', lang: 'es', code: '505', area: [], locale: 'es-NI', mask: 'ххх хххх хххх', phoneLength: 11 },
    ne: { key: 'ne', nameRu: 'НИГЕР', nameEn: 'NIGER', iso: 'NE', lang: 'fr', code: '227', area: [], locale: 'fr-NE', mask: 'ххх хх ххх ххх', phoneLength: 11 },
    ng: { key: 'ng', nameRu: 'НИГЕРИЯ', nameEn: 'NIGERIA', iso: 'NG', lang: 'en', code: '234', area: [], locale: 'en-NG', mask: 'ххх ххх ххх хххх', phoneLength: 13 },
    nu: { key: 'nu', nameRu: 'НИУЭ', nameEn: 'NIUE', iso: 'NU', lang: 'en', code: '683', area: [], locale: 'en-NU', mask: 'ххх хххх', phoneLength: 7 },
    nf: { key: 'nf', nameRu: 'ОСТРОВ НОРФОЛК', nameEn: 'NORFOLK ISLAND', iso: 'NF', lang: 'en', code: '672', area: [ '3' ], locale: 'en-NF', mask: 'ххх х хх ххх', phoneLength: 9 },
    mp: { key: 'mp', nameRu: 'СЕВЕРНЫЕ МАРИАНСКИЕ ОСТРОВА', nameEn: 'NORTHERN MARIANA ISLANDS', iso: 'MP', lang: 'en', code: '1', area: [ '670' ], locale: 'en-MP', mask: 'х ххх-ххх-хххх', phoneLength: 11 },
    no: { key: 'no', nameRu: 'НОРВЕГИЯ', nameEn: 'NORWAY', iso: 'NO', lang: 'no', code: '47', area: [], locale: 'no-NO', mask: 'хх хх хх хх хх', phoneLength: 10 },
    om: { key: 'om', nameRu: 'ОМАН', nameEn: 'OMAN', iso: 'OM', lang: 'ar', code: '968', area: [], locale: 'ar-OM', mask: 'ххх хххх–хххх', phoneLength: 11 },
    pk: { key: 'pk', nameRu: 'ПАКИСТАН', nameEn: 'PAKISTAN', iso: 'PK', lang: 'ur', code: '92', area: [], locale: 'ur-PK', mask: 'хх-ххх-ххххххх', phoneLength: 12 },
    pw: { key: 'pw', nameRu: 'ПАЛАУ', nameEn: 'PALAU', iso: 'PW', lang: 'en', code: '680', area: [], locale: 'en-PW', mask: 'ххх ххх хххх', phoneLength: 10 },
    ps: { key: 'ps', nameRu: 'ПАЛЕСТИНА ГОСУДАРСТВО', nameEn: 'PALESTINE STATE OF', iso: 'PS', lang: 'ar', code: '970', area: [], locale: 'ar-PS', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    pa: { key: 'pa', nameRu: 'ПАНАМА', nameEn: 'PANAMA', iso: 'PA', lang: 'es', code: '507', area: [], locale: 'es-PA', mask: 'ххх хххх-хххх', phoneLength: 11 },
    pg: { key: 'pg', nameRu: 'ПАПУА — НОВАЯ ГВИНЕЯ', nameEn: 'PAPUA NEW GUINEA', iso: 'PG', lang: 'en', code: '675', area: [], locale: 'en-PG', mask: 'ххх ххх хххх', phoneLength: 10 },
    py: { key: 'py', nameRu: 'ПАРАГВАЙ', nameEn: 'PARAGUAY', iso: 'PY', lang: 'es', code: '595', area: [], locale: 'es-PY', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    pe: { key: 'pe', nameRu: 'ПЕРУ', nameEn: 'PERU', iso: 'PE', lang: 'es', code: '51', area: [], locale: 'es-PE', mask: 'хх ххх ххх ххх', phoneLength: 11 },
    ph: { key: 'ph', nameRu: 'ФИЛИППИНЫ', nameEn: 'PHILIPPINES', iso: 'PH', lang: 'en', code: '63', area: [], locale: 'en-PH', mask: 'хх ххх ххх хххх', phoneLength: 12 },
    pn: { key: 'pn', nameRu: 'ПИТКЕРН', nameEn: 'PITCAIRN', iso: 'PN', lang: 'en', code: '64', area: [], locale: 'en-PN', mask: 'хх ххх ххх ххх', phoneLength: 11 },
    pl: { key: 'pl', nameRu: 'ПОЛЬША', nameEn: 'POLAND', iso: 'PL', lang: 'pl', code: '48', area: [], locale: 'pl-PL', mask: 'хх ххх ххх ххх', phoneLength: 11 },
    pt: { key: 'pt', nameRu: 'ПОРТУГАЛИЯ', nameEn: 'PORTUGAL', iso: 'PT', lang: 'pt', code: '351', area: [], locale: 'pt-PT', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    pr: { key: 'pr', nameRu: 'ПУЭРТО-РИКО', nameEn: 'PUERTO RICO', iso: 'PR', lang: 'es', code: '1', area: [ '787', '939' ], locale: 'es-PR', mask: 'х ххх-ххх-хххх', phoneLength: 11 },
    qa: { key: 'qa', nameRu: 'КАТАР', nameEn: 'QATAR', iso: 'QA', lang: 'ar', code: '974', area: [], locale: 'ar-QA', mask: 'ххх хххх хххх', phoneLength: 11 },
    re: { key: 're', nameRu: 'РЕЮНЬОН', nameEn: 'RÉUNION', iso: 'RE', lang: 'fr', code: '262', area: [], locale: 'fr-RE', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    ro: { key: 'ro', nameRu: 'РУМЫНИЯ', nameEn: 'ROMANIA', iso: 'RO', lang: 'ro', code: '40', area: [], locale: 'ro-RO', mask: 'хх ххх ххх ххх', phoneLength: 11 },
    ru: { key: 'ru', nameRu: 'РОССИЯ', nameEn: 'RUSSIA', iso: 'RU', lang: 'ru', code: '7', locale: 'ru-RU', mask: 'х (ххх) ххх-хх-хх', phoneLength: 11, area: [
      // Источники:
      // https://armtorg.ru/articles/item/2819/
      // https://www.topnomer.ru/blog/mobilnye-nomera-rossii-kody-po-regionam.html
      // https://www.mtt.ru/support/codes/
      // https://www.kody.su/mobile/
      '900', '901', '902', '903', '904', '905', '906', '908', '909', '910', '911', '912', '913', '914', '915', '916',
      '917', '918', '919', '920', '921', '922', '923', '924', '925', '926', '927', '928', '929', '930', '931', '932',
      '933', '934', '936', '937', '938', '939', '940', '941', '942', '949', '950', '951', '952', '953', '954', '955',
      '956', '958', '959', '960', '961', '962', '963', '964', '965', '966', '967', '968', '969', '970', '971', '977',
      '978', '979', '980', '981', '982', '983', '984', '985', '986', '987', '988', '989', '990', '991', '992', '993',
      '994', '995', '996', '997', '999',
    ] },
    rw: { key: 'rw', nameRu: 'РУАНДА', nameEn: 'RWANDA', iso: 'RW', lang: 'rw', code: '250', area: [], locale: 'rw-RW', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    sh: { key: 'sh', nameRu: 'СЕНТ-ГЕЛЕНА', nameEn: 'SAINT HELENA', iso: 'SH', lang: 'en', code: '290', area: [], locale: 'en-SH', mask: 'ххх хх ххх', phoneLength: 8 },
    kn: { key: 'kn', nameRu: 'СЕНТ-КИТС И НЕВИС', nameEn: 'SAINT KITTS AND NEVIS', iso: 'KN', lang: 'en', code: '1', area: [ '869' ], locale: 'en-KN', mask: 'х ххх ххх хххх', phoneLength: 11 },
    lc: { key: 'lc', nameRu: 'СЕНТ-ЛЮСИЯ', nameEn: 'SAINT LUCIA', iso: 'LC', lang: 'en', code: '1', area: [ '758' ], locale: 'en-LC', mask: 'х ххх ххх хххх', phoneLength: 11 },
    pm: { key: 'pm', nameRu: 'СЕНТ-ПЬЕР И МИКЕЛОН', nameEn: 'SAINT PIERRE AND MIQUELON', iso: 'PM', lang: 'fr', code: '508', area: [], locale: 'fr-PM', mask: 'ххх-хх-ххххххх', phoneLength: 12 },
    vc: { key: 'vc', nameRu: 'СЕНТ-ВИНСЕНТ И ГРЕНАДИНЫ', nameEn: 'SAINT VINCENT AND THE GRENADINES', iso: 'VC', lang: 'en', code: '1', area: [ '784' ], locale: 'en-VC', mask: 'х ххх ххх хххх', phoneLength: 11 },
    ws: { key: 'ws', nameRu: 'САМОА', nameEn: 'SAMOA', iso: 'WS', lang: 'sm', code: '685', area: [], locale: 'sm-WS', mask: 'ххх ххх хххх', phoneLength: 10 },
    sm: { key: 'sm', nameRu: 'САН-МАРИНО', nameEn: 'SAN MARINO', iso: 'SM', lang: 'it', code: '378', area: [], locale: 'it-SM', mask: 'ххх хххх хххх', phoneLength: 11 },
    st: { key: 'st', nameRu: 'САН-ТОМЕ И ПРИНСИПЕ', nameEn: 'SAO TOME AND PRINCIPE', iso: 'ST', lang: 'pt', code: '239', area: [], locale: 'pt-ST', mask: 'ххх ххх хххх', phoneLength: 10 },
    sa: { key: 'sa', nameRu: 'САУДОВСКАЯ АРАВИЯ', nameEn: 'SAUDI ARABIA', iso: 'SA', lang: 'ar', code: '966', area: [], locale: 'ar-SA', mask: 'ххх-хх-ххх-хххх', phoneLength: 12 },
    sn: { key: 'sn', nameRu: 'СЕНЕГАЛ', nameEn: 'SENEGAL', iso: 'SN', lang: 'fr', code: '221', area: [], locale: 'fr-SN', mask: 'ххх-хх-ххххххх', phoneLength: 12 },
    rs: { key: 'rs', nameRu: 'СЕРБИЯ', nameEn: 'SERBIA', iso: 'RS', lang: 'sr', code: '381', area: [], locale: 'sr-RS', mask: 'ххх-хх-ххх-хххх', phoneLength: 12 },
    sc: { key: 'sc', nameRu: 'СЕЙШЕЛЬСКИЕ ОСТРОВА', nameEn: 'SEYCHELLES', iso: 'SC', lang: 'en', code: '248', area: [], locale: 'en-SC', mask: 'ххх ххххххх', phoneLength: 10 },
    sl: { key: 'sl', nameRu: 'СЬЕРРА-ЛЕОНЕ', nameEn: 'SIERRA LEONE', iso: 'SL', lang: 'en', code: '232', area: [], locale: 'en-SL', mask: 'ххх хх хххххх', phoneLength: 11 },
    sg: { key: 'sg', nameRu: 'СИНГАПУР', nameEn: 'SINGAPORE', iso: 'SG', lang: 'en', code: '65', area: [], locale: 'en-SG', mask: 'хх хххх хххх', phoneLength: 10 },
    sk: { key: 'sk', nameRu: 'СЛОВАКИЯ', nameEn: 'SLOVAKIA', iso: 'SK', lang: 'sk', code: '421', area: [], locale: 'sk-SK', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    si: { key: 'si', nameRu: 'СЛОВЕНИЯ', nameEn: 'SLOVENIA', iso: 'SI', lang: 'sl', code: '386', area: [], locale: 'sl-SI', mask: 'ххх х ххх хх хх', phoneLength: 11 },
    sb: { key: 'sb', nameRu: 'СОЛОМОНЫ', nameEn: 'SOLOMON ISLANDS', iso: 'SB', lang: 'en', code: '677', area: [], locale: 'en-SB', mask: 'ххх ххххххх', phoneLength: 10 },
    so: { key: 'so', nameRu: 'СОМАЛИ', nameEn: 'SOMALIA', iso: 'SO', lang: 'so', code: '252', area: [], locale: 'so-SO', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    za: { key: 'za', nameRu: 'ЮЖАФРИКАНСКАЯ РЕСПУБЛИКА', nameEn: 'SOUTH AFRICA', iso: 'ZA', lang: 'en', code: '27', area: [], locale: 'en-ZA', mask: 'хх хх ххх хххх', phoneLength: 11 },
    gs: { key: 'gs', nameRu: 'Южная Георгия и Южные Сандвичевы острова', nameEn: 'SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS', iso: 'GS', lang: 'en', code: '500', area: [], locale: 'en-GS', mask: 'ххх ххххх', phoneLength: 8 },
    ss: { key: 'ss', nameRu: 'ЮЖНЫЙ СУДАН', nameEn: 'SOUTH SUDAN', iso: 'SS', lang: 'en', code: '211', area: [], locale: 'en-SS', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    es: { key: 'es', nameRu: 'ИСПАНИЯ', nameEn: 'SPAIN', iso: 'ES', lang: 'es', code: '34', area: [], locale: 'es-ES', mask: 'хх ххх ххх ххх', phoneLength: 11 },
    lk: { key: 'lk', nameRu: 'ШРИ-ЛАНКА', nameEn: 'SRI LANKA', iso: 'LK', lang: 'si', code: '94', area: [], locale: 'si-LK', mask: 'хх хх ххххххх', phoneLength: 11 },
    sd: { key: 'sd', nameRu: 'СУДАН', nameEn: 'SUDAN', iso: 'SD', lang: 'ar', code: '249', area: [], locale: 'ar-SD', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    sr: { key: 'sr', nameRu: 'СУРИНАМ', nameEn: 'SURINAME', iso: 'SR', lang: 'nl', code: '597', area: [], locale: 'nl-SR', mask: 'ххх ххх хххх', phoneLength: 10 },
    sj: { key: 'sj', nameRu: 'Шпицберген И ОСТРОВА ЯН МАЙЕН', nameEn: 'SVALBARD AND JAN MAYEN', iso: 'SJ', lang: 'no', code: '47', area: [ 'не', 'нашла' ], locale: 'no-SJ', mask: 'хх хххххххххх', phoneLength: 12 },
    sz: { key: 'sz', nameRu: 'Эсватини', nameEn: 'SWAZILAND', iso: 'SZ', lang: 'en', code: '268', area: [], locale: 'en-SZ', mask: 'ххх хххххххх', phoneLength: 11 },
    se: { key: 'se', nameRu: 'ШВЕЦИЯ', nameEn: 'SWEDEN', iso: 'SE', lang: 'sv', code: '46', area: [], locale: 'sv-SE', mask: 'хх ххх ххххххх', phoneLength: 12 },
    ch: { key: 'ch', nameRu: 'ШВЕЙЦАРИЯ', nameEn: 'SWITZERLAND', iso: 'CH', lang: 'de', code: '41', area: [], locale: 'de-CH', mask: 'хх хх ххх хх хх', phoneLength: 11 },
    sy: { key: 'sy', nameRu: 'СИРИЙСКАЯ АРАБСКАЯ РЕСПУБЛИКА', nameEn: 'SYRIAN ARAB REPUBLIC', iso: 'SY', lang: 'ar', code: '963', area: [], locale: 'ar-SY', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    tw: { key: 'tw', nameRu: 'ТАЙВАНЬ', nameEn: 'TAIWAN', iso: 'TW', lang: 'zh', code: '886', area: [], locale: 'zh-TW', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    tj: { key: 'tj', nameRu: 'ТАДЖИКИСТАН', nameEn: 'TAJIKISTAN', iso: 'TJ', lang: 'tg', code: '992', area: [], locale: 'tg-TJ', mask: 'ххх-хх-ххх-хххх', phoneLength: 12 },
    tz: { key: 'tz', nameRu: 'ТАНЗАНИЯ ОБЪЕДИНЕННАЯ РЕСПУБЛИКА', nameEn: 'TANZANIA UNITED REPUBLIC OF', iso: 'TZ', lang: 'sw', code: '255', area: [], locale: 'sw-TZ', mask: 'ххх хх ххх хххх', phoneLength: 12 },
    th: { key: 'th', nameRu: 'ТАИЛАНД', nameEn: 'THAILAND', iso: 'TH', lang: 'th', code: '66', area: [], locale: 'th-TH', mask: 'хх х хххх хххх', phoneLength: 11 },
    tl: { key: 'tl', nameRu: 'ТИМОР-ЛЕСТЕ', nameEn: 'TIMOR-LESTE', iso: 'TL', lang: 'pt', code: '670', area: [], locale: 'pt-TL', mask: 'ххх ххх хххх', phoneLength: 10 },
    tg: { key: 'tg', nameRu: 'ТОГО', nameEn: 'TOGO', iso: 'TG', lang: 'fr', code: '228', area: [], locale: 'fr-TG', mask: 'ххх ххх ххххх', phoneLength: 11 },
    tk: { key: 'tk', nameRu: 'ТОКЕЛАУ', nameEn: 'TOKELAU', iso: 'TK', lang: 'en', code: '690', area: [], locale: 'en-TK', mask: 'ххх хххх', phoneLength: 7 },
    to: { key: 'to', nameRu: 'ТОНГА', nameEn: 'TONGA', iso: 'TO', lang: 'to', code: '676', area: [], locale: 'to-TO', mask: 'ххх ххх хххх', phoneLength: 10 },
    tt: { key: 'tt', nameRu: 'ТРИНИДАД И ТОБАГО', nameEn: 'TRINIDAD AND TOBAGO', iso: 'TT', lang: 'en', code: '1', area: [ '868' ], locale: 'en-TT', mask: 'х (ххх) ххх-хххх', phoneLength: 11 },
    tn: { key: 'tn', nameRu: 'ТУНИС', nameEn: 'TUNISIA', iso: 'TN', lang: 'ar', code: '216', area: [], locale: 'ar-TN', mask: 'ххх хх ххх ххх', phoneLength: 11 },
    tr: { key: 'tr', nameRu: 'ТУРЦИЯ', nameEn: 'TURKEY', iso: 'TR', lang: 'tr', code: '90', area: [], locale: 'tr-TR', mask: 'хх (ххх) ххх хххх', phoneLength: 12 },
    tm: { key: 'tm', nameRu: 'ТУРКМЕНИСТАН', nameEn: 'TURKMENISTAN', iso: 'TM', lang: 'tk', code: '993', area: [], locale: 'tk-TM', mask: 'ххх хххх хххх', phoneLength: 11 },
    tc: { key: 'tc', nameRu: 'ОСТРОВА ТУРКС И КАЙКОС', nameEn: 'TURKS AND CAICOS ISLANDS', iso: 'TC', lang: 'en', code: '1', area: [ '649' ], locale: 'en-TC', mask: 'х (ххх) ххх-хххх', phoneLength: 11 },
    tv: { key: 'tv', nameRu: 'ТУВАЛУ', nameEn: 'TUVALU', iso: 'TV', lang: 'en', code: '688', area: [], locale: 'en-TV', mask: 'ххх хххх', phoneLength: 7 },
    ug: { key: 'ug', nameRu: 'УГАНДА', nameEn: 'UGANDA', iso: 'UG', lang: 'en', code: '256', area: [], locale: 'en-UG', mask: 'ххх ххх ххх ххх', phoneLength: 12 },
    ua: { key: 'ua', nameRu: 'УКРАИНА', nameEn: 'UKRAINE', iso: 'UA', lang: 'uk', code: '380', area: [], locale: 'uk-UA', mask: 'ххх (хх) ххх-хххх', phoneLength: 12 },
    ae: { key: 'ae', nameRu: 'ОБЪЕДИНЕННЫЕ АРАБСКИЕ ЭМИРАТЫ', nameEn: 'UNITED ARAB EMIRATES', iso: 'AE', lang: 'ar', code: '971', area: [], locale: 'ar-AE', mask: 'ххх-хх-ххххххх', phoneLength: 12 },
    gb: { key: 'gb', nameRu: 'ВЕЛИКОБРИТАНИЯ', nameEn: 'UNITED KINGDOM', iso: 'GB', lang: 'en', code: '44', area: [], locale: 'en-GB', mask: 'хх-хххх-хххххх', phoneLength: 12 },
    us: { key: 'us', nameRu: 'СОЕДИНЕННЫЕ ШТАТЫ', nameEn: 'UNITED STATES', iso: 'US', lang: 'en', code: '1', area: [], locale: 'en-US', mask: 'х-ххх-ххх-хххх', phoneLength: 11 },
    uy: { key: 'uy', nameRu: 'УРУГВАЙ', nameEn: 'URUGUAY', iso: 'UY', lang: 'es', code: '598', area: [], locale: 'es-UY', mask: 'ххх хх ххх ххх', phoneLength: 11 },
    uz: { key: 'uz', nameRu: 'УЗБЕКИСТАН', nameEn: 'UZBEKISTAN', iso: 'UZ', lang: 'uz', code: '998', area: [], locale: 'uz-UZ', mask: 'ххх хх ххх-хх-хх', phoneLength: 12 },
    vu: { key: 'vu', nameRu: 'ВАНУАТУ', nameEn: 'VANUATU', iso: 'VU', lang: 'en', code: '678', area: [], locale: 'en-VU', mask: 'ххх-хх-ххххх', phoneLength: 10 },
    ve: { key: 've', nameRu: 'ВЕНЕСУЭЛА', nameEn: 'VENEZUELA', iso: 'VE', lang: 'es', code: '58', area: [], locale: 'es-VE', mask: 'хх ххх-ххххххх', phoneLength: 12 },
    vn: { key: 'vn', nameRu: 'ВЬЕТНАМ', nameEn: 'VIETNAM', iso: 'VN', lang: 'vi', code: '84', area: [], locale: 'vi-VN', mask: 'хх хх ххх хххх', phoneLength: 11 },
    vg: { key: 'vg', nameRu: 'БРИТАНСКИЕ ВИРГИНСКИЕ ОСТРОВА', nameEn: 'VIRGIN ISLANDS BRITISH', iso: 'VG', lang: 'en', code: '1', area: [ '284' ], locale: 'en-VG', mask: 'х-ххх-ххххххх', phoneLength: 11 },
    vi: { key: 'vi', nameRu: 'ВИРГИНСКИЕ ОСТРОВА США', nameEn: 'VIRGIN ISLANDS U.S.', iso: 'VI', lang: 'en', code: '1', area: [ '340' ], locale: 'en-VI', mask: 'х ххх ххх хххх', phoneLength: 11 },
    wf: { key: 'wf', nameRu: 'УОЛЛИС И ФУТУНА', nameEn: 'WALLIS AND FUTUNA', iso: 'WF', lang: 'fr', code: '681', area: [], locale: 'fr-WF', mask: 'ххх хх хххх', phoneLength: 9 },
    eh: { key: 'eh', nameRu: 'ЗАПАДНАЯ САХАРА', nameEn: 'WESTERN SAHARA', iso: 'EH', lang: 'ar', code: '212', area: [ '5288', '5289' ], locale: 'ar-EH', mask: 'ххх хххх-ххххх', phoneLength: 12 },
    ye: { key: 'ye', nameRu: 'ЙЕМЕН', nameEn: 'YEMEN', iso: 'YE', lang: 'ar', code: '967', area: [], locale: 'ar-YE', mask: 'ххх-х-хххххх', phoneLength: 10 },
    zm: { key: 'zm', nameRu: 'ЗАМБИЯ', nameEn: 'ZAMBIA', iso: 'ZM', lang: 'en', code: '260', area: [], locale: 'en-ZM', mask: 'ххх-ххх-хххххх', phoneLength: 12 },
    zw: { key: 'zw', nameRu: 'ЗИМБАБВЕ', nameEn: 'ZIMBABWE', iso: 'ZW', lang: 'en', code: '263', area: [], locale: 'en-ZW', mask: 'ххх-ххх-хххххх', phoneLength: 12 },
    ai: { key: 'ai', nameRu: 'Ангилья', nameEn: 'Anguilla', iso: 'AI', lang: 'en', code: '1', area: [ '264' ], locale: 'en-AI', mask: 'х ххх ххх-хххх', phoneLength: 11 },
    aq: { key: 'aq', nameRu: 'Антарктида', nameEn: 'Antarctica', iso: 'AQ', lang: 'en', code: '672', area: [], locale: 'en-AQ', mask: 'ххх-хх-хххх', phoneLength: 9 },
    bq: { key: 'bq', nameRu: 'Бонайре Саба и Синт-Эстатиус', nameEn: 'Bonaire Sint Eustatius and Saba', iso: 'BQ', lang: 'nl', code: '599', area: [ '7', '4' ], locale: 'nl-BQ', mask: 'ххх-х-хххххх', phoneLength: 10 },
    gg: { key: 'gg', nameRu: 'Гернси', nameEn: 'Guernsey', iso: 'GG', lang: 'en', code: '44', area: [ '1481' ], locale: 'en-GG', mask: 'хх-хххх-хххххх', phoneLength: 12 },
    je: { key: 'je', nameRu: 'Джерси', nameEn: 'Jersey', iso: 'JE', lang: 'en', code: '44', area: [ '7797', '7700', '7829', '7509', '7937' ], locale: 'en-JE', mask: 'хх-хххх-хххххх', phoneLength: 12 },
    cw: { key: 'cw', nameRu: 'Кюрасао', nameEn: 'Curaçao', iso: 'CW', lang: 'nl', code: '599', area: [ '9' ], locale: 'nl-CW', mask: 'ххх-х-хххххх', phoneLength: 10 },
    im: { key: 'im', nameRu: 'Остров Мэн', nameEn: 'Isle of Man', iso: 'IM', lang: 'en', code: '44', area: [ '7425', '7624', '7924' ], locale: 'en-IM', mask: 'хх-хххх-хххххх', phoneLength: 12 },
    va: { key: 'va', nameRu: 'Папский Престол (Государство — город Ватикан)', nameEn: 'Holy See (Vatican City State)', iso: 'VA', lang: 'it', code: '39', area: [ '06698' ], locale: 'it-VA', mask: 'хх хх хххххххх', phoneLength: 12 },
    bl: { key: 'bl', nameRu: 'Сен-Бартельми', nameEn: 'Saint Barthélemy', iso: 'BL', lang: 'fr', code: '590', area: [ '690', '691' ], locale: 'fr-BL', mask: 'ххх ххх хх хх хх', phoneLength: 12 },
    mf: { key: 'mf', nameRu: 'Сен-Мартен', nameEn: 'Saint Martin (French Part)', iso: 'MF', lang: 'fr', code: '590', area: [ '690', '691' ], locale: 'fr-MF', mask: 'ххх ххх хх хх хх', phoneLength: 12 },
    sx: { key: 'sx', nameRu: 'Синт-Мартен', nameEn: 'Sint Maarten', iso: 'SX', lang: 'nl', code: '1', area: [ '721' ], locale: 'nl-SX', mask: 'х ххх ххх хххх', phoneLength: 11 },
    os: { key: 'os', nameRu: 'Южная Осетия', nameEn: 'South Ossetia', iso: 'OS', lang: 'ru', code: '7', area: [ '929', '998' ], locale: 'ru-OS', mask: 'х ххх ххх хххх', phoneLength: 11 }
  }
}