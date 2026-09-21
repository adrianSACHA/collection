import { createContext, useContext } from 'react'

/**
 * Kontekst kolekcji: udostępnia stan filtrów + wyniki zapytania + akcje
 * wszystkim miejscom, które je renderują (desktop sidebar i mobilny modal).
 *
 * Dzięki temu panel filtrów można wyrenderować w dwóch miejscach, a mimo to
 * mają one JEDEN wspólny stan i JEDEN bieg zapytania (w `useCollection`).
 */
export const CollectionContext = createContext(null)

export function useCollectionContext() {
  const context = useContext(CollectionContext)

  if (!context) {
    throw new Error(
      'useCollectionContext musi być użyty wewnątrz <CollectionContext.Provider>.'
    )
  }

  return context
}
