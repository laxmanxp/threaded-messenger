import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'
import { MessengerProvider } from './store/messengerStore.tsx'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MessengerProvider>
      <App />
    </MessengerProvider>
  </StrictMode>,
)
