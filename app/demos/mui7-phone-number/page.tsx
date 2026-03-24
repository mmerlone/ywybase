import type { ReactElement } from 'react'
import type { Metadata } from 'next'

import { Mui7PhoneNumberDemo } from './Mui7PhoneNumberDemo'

export const metadata: Metadata = {
  title: 'mui7-phone-number Demo',
  description: 'Interactive demo page for the @mmerlone/mui7-phone-number component in YwyBase.',
}

export default function Page(): ReactElement {
  return <Mui7PhoneNumberDemo />
}
