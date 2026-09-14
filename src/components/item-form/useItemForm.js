import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { uploadPhoto, deletePhoto } from '../../lib/uploadPhoto'
import {
  buildPayload,
  validateItemForm,
  mapItemToFormState,
  getEmptyFormState,
} from './formHelpers'

/**
 * Hook trzymający całą logikę formularza przedmiotu:
 * stan pól, wczytywanie słowników/zdjęć/danych, walidację, zapis, reset.
 * Widok (ItemForm) tylko renderuje i podpina handlery.
 */
export function useItemForm({ itemId, duplicateFrom, fixedType, onSaved }) {
  const isEditMode = !!itemId

  const [values, setValues] = useState(() => getEmptyFormState(fixedType))

  const [awersFile, setAwersFile] = useState(null)
  const [rewersFile, setRewersFile] = useState(null)
  const [znakWodnyFile, setZnakWodnyFile] = useState(null)
  const [existingPhotos, setExistingPhotos] = useState({})
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState(null)
  const [photoDeleting, setPhotoDeleting] = useState(null)
  const [photoResetKey, setPhotoResetKey] = useState(0)

  const [loading, setLoading] = useState(false)
  const [savingMode, setSavingMode] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const nominalInputRef = useRef(null)

  const queryClient = useQueryClient()

  // Pomocnik: aktualizacja pojedynczego pola.
  const setField = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }))

    setFieldErrors((prev) => {
      if (!prev[name] && !(name === 'rok' || name === 'data_wydania')) {
        return prev
      }
      const next = { ...prev }
      if (next[name]) next[name] = ''
      if (name === 'rok' || name === 'data_wydania') next.date_required = ''
      return next
    })
  }, [])

  const loadPhotos = useCallback(
    async (targetItemId) => {
      const idToUse = targetItemId || itemId
      if (!idToUse) return
      try {
        const { data, error: err } = await supabase
          .from('item_photos')
          .select('typ, url')
          .eq('item_id', idToUse)
        if (err) throw err
        const map = {}
        for (const row of data || []) map[row.typ] = row.url
        setExistingPhotos(map)
      } catch (err) {
        console.error('Błąd wczytywania zdjęć:', err)
      }
    },
    [itemId]
  )

  const loadItem = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (err) throw err
      if (!data) throw new Error('Przedmiot nie znaleziony.')

      setValues(mapItemToFormState(data))
    } catch (err) {
      console.error('Błąd wczytywania przedmiotu:', err)
      setError('Nie udało się wczytać przedmiotu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => {
    if (isEditMode && itemId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadItem()
      loadPhotos(itemId)
    }
  }, [isEditMode, itemId, loadItem, loadPhotos])

  // Tryb duplikowania: nowa pozycja z wypełnionymi polami na podstawie
  // istniejącego przedmiotu (bez itemId, więc zapis utworzy nowy rekord).
  useEffect(() => {
    if (!duplicateFrom || isEditMode) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(mapItemToFormState(duplicateFrom))
  }, [duplicateFrom, isEditMode])

  // Typ bieżący: w trybie dodawania z zakładki typ narzuca fixedType.
  const effectiveTyp = isEditMode ? values.typ : duplicateFrom ? values.typ : fixedType || values.typ

  const uploadSelectedPhotos = useCallback(
    async (targetItemId) => {
      const tasks = []
      if (awersFile) tasks.push(uploadPhoto(awersFile, targetItemId, 'awers'))
      if (rewersFile) tasks.push(uploadPhoto(rewersFile, targetItemId, 'rewers'))
      if (znakWodnyFile) tasks.push(uploadPhoto(znakWodnyFile, targetItemId, 'znak_wodny'))
      if (tasks.length === 0) return

      try {
        setPhotoUploading(true)
        setPhotoError(null)
        await Promise.all(tasks)
        setAwersFile(null)
        setRewersFile(null)
        setZnakWodnyFile(null)
        await loadPhotos(targetItemId)
        // Zdjęcia zmienione - odśwież widoki oparte o react-query (inwentarz/statystyki).
        queryClient.invalidateQueries({ queryKey: ['items'] })
      } catch (err) {
        console.error('Błąd wgrywania zdjęć:', err)
        setPhotoError('Dane zapisane, ale nie udało się wgrać zdjęć: ' + err.message)
      } finally {
        setPhotoUploading(false)
      }
    },
    [awersFile, rewersFile, znakWodnyFile, loadPhotos, queryClient]
  )

  const resetForm = useCallback(
    ({ keepType = false } = {}) => {
      setValues((prev) => {
        const empty = getEmptyFormState(fixedType)
        return {
          ...empty,
          // Typ zachowany przy "Dodaj kolejny"; kraj zachowany (najczęstsza powtarzalna wartość).
          typ: keepType ? prev.typ : fixedType || 'moneta',
          kraj: keepType ? prev.kraj : '',
        }
      })
      setAwersFile(null)
      setRewersFile(null)
      setZnakWodnyFile(null)
      setExistingPhotos({})
      setFieldErrors({})
      setPhotoResetKey((k) => k + 1)
    },
    [fixedType]
  )

  // Usuwa już zapisane zdjęcie (plik + wpis) przy edycji.
  const deleteExistingPhoto = useCallback(
    async (photoTyp) => {
      if (!itemId) return
      try {
        setPhotoDeleting(photoTyp)
        setPhotoError(null)
        await deletePhoto(itemId, photoTyp)
        setExistingPhotos((prev) => {
          const next = { ...prev }
          delete next[photoTyp]
          return next
        })
      } catch (err) {
        console.error('Błąd usuwania zdjęcia:', err)
        setPhotoError('Nie udało się usunąć zdjęcia: ' + err.message)
      } finally {
        setPhotoDeleting(null)
      }
    },
    [itemId]
  )

  const handleSubmit = useCallback(
    async (e, mode = 'default') => {
      e.preventDefault()
      setError(null)
      setSuccess(false)

      const errors = validateItemForm(values)
      setFieldErrors(errors)
      if (Object.keys(errors).length > 0) return

      try {
        setLoading(true)
        setSavingMode(mode)

        const payload = buildPayload(values, effectiveTyp)

        if (isEditMode) {
          const { data, error: err } = await supabase
            .from('items')
            .update(payload)
            .eq('id', itemId)
            .select()
            .single()

          if (err) throw err
          setSuccess(true)
          await uploadSelectedPhotos(itemId)
          if (onSaved) onSaved(data)
        } else {
          const { data: userData, error: userErr } = await supabase.auth.getUser()
          if (userErr) throw userErr
          if (!userData?.user?.id) throw new Error('Nie jesteś zalogowany.')

          payload.user_id = userData.user.id

          const { data, error: err } = await supabase
            .from('items')
            .insert(payload)
            .select()
            .single()

          if (err) throw err
          setSuccess(true)
          await uploadSelectedPhotos(data.id)

          if (mode === 'addAnother') {
            resetForm({ keepType: true })
            setTimeout(() => setSuccess(false), 2000)
            nominalInputRef.current?.focus()
          } else {
            resetForm()
            if (onSaved) onSaved(data)
          }
        }
      } catch (err) {
        console.error('Błąd zapisywania przedmiotu:', err)
        let errorMsg = err.message || 'Nie udało się zapisać przedmiotu.'
        if (errorMsg.includes('check constraint')) {
          errorMsg = 'Sprawdź wymagane pola (kraj, rok/data, pola specyficzne dla banknotu).'
        } else if (errorMsg.includes('unique constraint')) {
          errorMsg = 'Ten przedmiot już istnieje.'
        }
        setError(errorMsg)
      } finally {
        setLoading(false)
        setSavingMode(null)
      }
    },
    [values, effectiveTyp, isEditMode, itemId, onSaved, uploadSelectedPhotos, resetForm]
  )

  return {
    isEditMode,
    effectiveTyp,
    values,
    setField,
    nominalInputRef,
    loading,
    savingMode,
    error,
    success,
    fieldErrors,
    awersFile,
    rewersFile,
    znakWodnyFile,
    setAwersFile,
    setRewersFile,
    setZnakWodnyFile,
    existingPhotos,
    photoUploading,
    photoError,
    photoDeleting,
    photoResetKey,
    deleteExistingPhoto,
    handleSubmit,
  }
}
