import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { i18nResources } from '@core/renderer-safe'

i18n.use(initReactI18next).init({
  resources: i18nResources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export default i18n
