import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadPhoto, deletePhoto } from '../../lib/uploadPhoto'
import {
  createItem,
  getItem,
  listPhotosForItem,
  updateItem,
} from '../../collection/collectionApi'
import { useToast } from '../toast/toastContext'
import {
  buildPayload,
  validateItemForm,
  mapItemToFormState,
  getEmptyFormState,
} from './formHelpers'

export function useItemForm({
  itemId,
  duplicateFrom,
  fixedType,
  onSaved,
}) {
  const isEditMode = Boolean(itemId)

  // Wartości początkowe ustawiamy leniwie już przy montowaniu:
  // duplikat od razu wypełnia formularz, a edycja startuje z pustego stanu
  // i zostanie uzupełniona po wczytaniu danych.
  const [values, setValues] = useState(() =>
    duplicateFrom ? mapItemToFormState(duplicateFrom) : getEmptyFormState(fixedType)
  )

  const [awersFile, setAwersFile] = useState(null)
  const [rewersFile, setRewersFile] = useState(null)
  const [znakWodnyFile, setZnakWodnyFile] = useState(null)

  const [existingPhotos, setExistingPhotos] = useState({})
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState(null)
  const [photoDeleting, setPhotoDeleting] = useState(null)
  const [photoResetKey, setPhotoResetKey] = useState(0)

  // W trybie edycji od razu pokazujemy stan "wczytywanie" - dane pobieramy w efekcie.
  const [loading, setLoading] = useState(isEditMode)
  const [savingMode, setSavingMode] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const nominalInputRef = useRef(null)
  const toast = useToast()

  const setField = useCallback((name, value) => {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }))

    setFieldErrors((previous) => {
      const clearsDateError =
        name === 'rok' || name === 'data_wydania'

      if (!previous[name] && !clearsDateError) {
        return previous
      }

      const next = { ...previous }

      if (next[name]) {
        next[name] = ''
      }

      if (clearsDateError) {
        next.date_required = ''
      }

      return next
    })
  }, [])

  const loadPhotos = useCallback(
    (targetItemId) => {
      const idToUse = targetItemId || itemId

      if (!idToUse) return

      // Jak w loadItem - stan ustawiamy w callbacku łańcucha, nie synchronicznie.
      return listPhotosForItem(idToUse)
        .then((data) => {
          const photosMap = {}

          for (const photo of data) {
            photosMap[photo.typ] = photo.url
          }

          setExistingPhotos(photosMap)
        })
        .catch((err) => {
          console.error('Błąd wczytywania zdjęć:', err)
        })
    },
    [itemId]
  )

  const loadItem = useCallback(() => {
    // Aktualizacje stanu w callbackach łańcucha (po await/rozstrzygnięciu) -
    // dzięki temu nie ustawiamy stanu synchronicznie w efekcie wywołującym.
    getItem(itemId)
      .then((data) => {
        if (!data) throw new Error('Przedmiot nie znaleziony.')

        setValues(mapItemToFormState(data))
        setLoading(false)
      })
      .catch((err) => {
        console.error('Błąd wczytywania przedmiotu:', err)
        setError(`Nie udało się wczytać przedmiotu: ${err.message}`)
        setLoading(false)
      })
  }, [itemId])

  useEffect(() => {
    if (!isEditMode || !itemId) return

    loadItem()
    loadPhotos(itemId)
  }, [isEditMode, itemId, loadItem, loadPhotos])

  const effectiveTyp = isEditMode
    ? values.typ
    : duplicateFrom
      ? values.typ
      : fixedType || values.typ

  const uploadSelectedPhotos = useCallback(
    async (targetItemId) => {
      const uploadTasks = []

      if (awersFile) {
        uploadTasks.push(
          uploadPhoto(awersFile, targetItemId, 'awers')
        )
      }

      if (rewersFile) {
        uploadTasks.push(
          uploadPhoto(rewersFile, targetItemId, 'rewers')
        )
      }

      if (znakWodnyFile) {
        uploadTasks.push(
          uploadPhoto(
            znakWodnyFile,
            targetItemId,
            'znak_wodny'
          )
        )
      }

      if (uploadTasks.length === 0) return

      try {
        setPhotoUploading(true)
        setPhotoError(null)

        await Promise.all(uploadTasks)

        setAwersFile(null)
        setRewersFile(null)
        setZnakWodnyFile(null)

        await loadPhotos(targetItemId)
      } catch (err) {
        console.error('Błąd wgrywania zdjęć:', err)

        const message = `Dane zapisane, ale nie udało się wgrać zdjęć: ${err.message}`

        setPhotoError(message)
        toast.error(message)
      } finally {
        setPhotoUploading(false)
      }
    },
    [
      awersFile,
      rewersFile,
      znakWodnyFile,
      loadPhotos,
      toast,
    ]
  )

  const resetForm = useCallback(
    ({ keepType = false } = {}) => {
      setValues((previous) => {
        const empty = getEmptyFormState(fixedType)

        return {
          ...empty,

          // Zachowujemy typ przy „Zapisz i dodaj kolejny”.
          typ: keepType
            ? previous.typ
            : fixedType || 'moneta',

          // Najczęściej używane powtarzalne dane.
          kraj: keepType ? previous.kraj : '',
          miasto_wydania: keepType
            ? previous.miasto_wydania
            : '',
        }
      })

      setAwersFile(null)
      setRewersFile(null)
      setZnakWodnyFile(null)
      setExistingPhotos({})
      setFieldErrors({})
      setPhotoResetKey((key) => key + 1)
    },
    [fixedType]
  )

  const deleteExistingPhoto = useCallback(
    async (photoTyp) => {
      if (!itemId) return

      try {
        setPhotoDeleting(photoTyp)
        setPhotoError(null)

        await deletePhoto(itemId, photoTyp)

        setExistingPhotos((previous) => {
          const next = { ...previous }
          delete next[photoTyp]
          return next
        })
      } catch (err) {
        console.error('Błąd usuwania zdjęcia:', err)

        setPhotoError(
          `Nie udało się usunąć zdjęcia: ${err.message}`
        )
      } finally {
        setPhotoDeleting(null)
      }
    },
    [itemId]
  )

  const handleSubmit = useCallback(
    async (event, mode = 'default') => {
      event.preventDefault()

      setError(null)
      setSuccess(false)

      const errors = validateItemForm(values)
      setFieldErrors(errors)

      if (Object.keys(errors).length > 0) {
        toast.error(
          Object.values(errors)[0] || 'Uzupełnij wymagane pola.'
        )
        return
      }

      try {
        setLoading(true)
        setSavingMode(mode)

        const payload = buildPayload(values, effectiveTyp)

        if (isEditMode) {
          const data = await updateItem(itemId, payload)

          setSuccess(true)
          toast.success('Przedmiot zaktualizowany!')

          await uploadSelectedPhotos(itemId)

          onSaved?.(data)
          return
        }

        const data = await createItem(payload)

        setSuccess(true)

        await uploadSelectedPhotos(data.id)

        if (mode === 'addAnother') {
          toast.success('Przedmiot dodany. Możesz dodać kolejny.')
          resetForm({ keepType: true })

          setTimeout(() => {
            setSuccess(false)
          }, 2000)

          nominalInputRef.current?.focus()
          return
        }

        toast.success('Przedmiot dodany!')
        resetForm()
        onSaved?.(data)
      } catch (err) {
        console.error('Błąd zapisywania przedmiotu:', err)

        let errorMessage =
          err.message || 'Nie udało się zapisać przedmiotu.'

        if (errorMessage.includes('check constraint')) {
          errorMessage =
            'Sprawdź wymagane pola oraz dane specyficzne dla banknotu lub monety.'
        } else if (errorMessage.includes('unique constraint')) {
          errorMessage = 'Ten przedmiot już istnieje.'
        }

        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
        setSavingMode(null)
      }
    },
    [
      values,
      effectiveTyp,
      isEditMode,
      itemId,
      onSaved,
      uploadSelectedPhotos,
      resetForm,
      toast,
    ]
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