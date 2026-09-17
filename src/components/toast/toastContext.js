import { createContext, useContext } from 'react'

/**
 * Kontekst powiadomień (toastów). Wystawia API:
 *   const toast = useToast()
 *   toast.success('Zapisano!')
 *   toast.error('Uzupełnij wymagane pola.')
 *   toast.info('...')
 *   toast.show('...', { type: 'info', duration: 4000 })
 *
 * Provider montujemy raz, wysoko w drzewie (main.jsx), dzięki czemu każdy
 * komponent może zgłosić komunikat - także taki, który przetrwa zmianę widoku
 * (np. po zapisie i powrocie do listy).
 */
export const ToastContext = createContext(null)

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast musi być użyty wewnątrz <ToastProvider>.')
  }

  return context
}
