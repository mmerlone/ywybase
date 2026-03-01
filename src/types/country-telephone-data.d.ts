declare module 'country-telephone-data' {
  export interface Country {
    name: string
    iso2: string
    dialCode: string
    priority: number
    format?: string
    hasAreaCodes?: boolean
  }

  export interface CountryTelData {
    allCountries: Country[]
    iso2Lookup: Record<string, number>
    allCountryCodes: Record<string, string[]>
  }

  const data: CountryTelData
  export default data
}
