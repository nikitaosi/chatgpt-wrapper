import 'styles/globals.css'
import 'styles/tailwind.css'

import type { AppProps } from 'next/app'
import { SSRProvider, defaultTheme, Provider } from '@adobe/react-spectrum'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SSRProvider>
      <Provider theme={defaultTheme}>
        <Component {...pageProps} />
      </Provider>
    </SSRProvider>
  )
}
