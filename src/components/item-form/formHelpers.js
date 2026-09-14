// Czysta logika formularza przedmiotu (walidacja + budowa payloadu + mapowanie).
// Bez zależności od Reacta - łatwe do testowania i współdzielenia.

// Wspólne klasy pola (input/select) - trzymane w jednym miejscu.
export const inputClass =
  'w-full min-h-[44px] rounded-lg border px-3 py-2 lg:min-h-[40px]'

/**
 * Buduje obiekt payloadu do zapisu w tabeli `items`.
 * Dla banknotu ustawia pola banknotowe, dla monety - monetowe (i zeruje przeciwne).
 */
export function buildPayload(values, effectiveTyp) {
  const payload = {
    typ: effectiveTyp,
    nominal: values.nominal.trim(),
    kraj: values.kraj.trim(),
    rok: values.rok ? parseInt(values.rok, 10) : null,
    data_wydania: values.data_wydania || null,
    ilosc: values.ilosc ? parseInt(values.ilosc, 10) : 1,
    do_kupienia: values.do_kupienia,
    unc: values.unc,
    bardzo_rzadki: values.bardzo_rzadki,
    rzadki: values.rzadki,
    gwiazdka_przed: values.gwiazdka_przed,
    gwiazdka_za: values.gwiazdka_za,
    mennica: values.mennica.trim() || null,
    material: values.material.trim() || null,
    waga_g: values.waga_g ? parseFloat(values.waga_g) : null,
    srednica_mm: values.srednica_mm ? parseFloat(values.srednica_mm) : null,
    data_zakupu: values.data_zakupu || null,
    cena_zakupu: values.cena_zakupu ? parseFloat(values.cena_zakupu) : null,
    cena_zakupu_do: values.cena_zakupu_do ? parseFloat(values.cena_zakupu_do) : null,
    uwagi: values.uwagi.trim() || null,
  }

  if (effectiveTyp === 'banknot') {
    payload.miasto_wydania = values.miasto_wydania.trim() || null
    payload.seria = values.seria.trim() || null
    payload.kn_seria = values.kn_seria.trim() || null
    payload.nadruk = values.nadruk.trim() || null
    payload.kod_drukarni = values.kod_drukarni.trim() || null
    payload.znak_wodny = values.znak_wodny.trim() || null
    payload.naklad = null
    payload.unikat = values.unikat
  } else {
    payload.miasto_wydania = null
    payload.seria = null
    payload.kn_seria = null
    payload.nadruk = null
    payload.kod_drukarni = null
    payload.znak_wodny = null
    payload.naklad = values.naklad.trim() || null
    payload.unikat = false
  }

  return payload
}

/**
 * Waliduje formularz. Zwraca obiekt błędów (pusty = OK).
 */
export function validateItemForm(values) {
  const errors = {}

  if (!values.kraj.trim()) errors.kraj = 'Kraj jest wymagany.'
  if (!values.nominal.trim()) errors.nominal = 'Nominał jest wymagany.'

  const rokNum = values.rok ? parseInt(values.rok, 10) : null
  const hasRok = rokNum !== null && !isNaN(rokNum)
  const hasData = values.data_wydania.trim() !== ''

  if (!hasRok && !hasData) {
    errors.date_required = 'Podaj przynajmniej rok lub datę emisji.'
  }

  return errors
}

/**
 * Mapuje rekord z bazy (lub obiekt do duplikowania) na wartości formularza.
 * Wszystkie wartości jako string (poza `unikat`).
 */
export function mapItemToFormState(item) {
  return {
    typ: item.typ || 'moneta',
    nominal: item.nominal || '',
    kraj: item.kraj || '',
    rok: item.rok ? String(item.rok) : '',
    data_wydania: item.data_wydania || '',
    miasto_wydania: item.miasto_wydania || '',
    seria: item.seria || '',
    kn_seria: item.kn_seria || '',
    nadruk: item.nadruk || '',
    kod_drukarni: item.kod_drukarni || '',
    znak_wodny: item.znak_wodny || '',
    naklad: item.naklad || '',
    unikat: !!item.unikat,
    ilosc: item.ilosc ? String(item.ilosc) : '1',
    do_kupienia: !!item.do_kupienia,
    unc: !!item.unc,
    bardzo_rzadki: !!item.bardzo_rzadki,
    rzadki: !!item.rzadki,
    gwiazdka_przed: !!item.gwiazdka_przed,
    gwiazdka_za: !!item.gwiazdka_za,
    mennica: item.mennica || '',
    material: item.material || '',
    waga_g: item.waga_g ? String(item.waga_g) : '',
    srednica_mm: item.srednica_mm ? String(item.srednica_mm) : '',
    data_zakupu: item.data_zakupu || '',
    cena_zakupu: item.cena_zakupu ? String(item.cena_zakupu) : '',
    cena_zakupu_do: item.cena_zakupu_do ? String(item.cena_zakupu_do) : '',
    uwagi: item.uwagi || '',
  }
}

/**
 * Zwraca "puste" wartości formularza. `typ` dobierany z fixedType.
 */
export function getEmptyFormState(fixedType) {
  return {
    typ: fixedType || 'moneta',
    nominal: '',
    kraj: '',
    rok: '',
    data_wydania: '',
    miasto_wydania: '',
    seria: '',
    kn_seria: '',
    nadruk: '',
    kod_drukarni: '',
    znak_wodny: '',
    naklad: '',
    unikat: false,
    ilosc: '1',
    do_kupienia: false,
    unc: false,
    bardzo_rzadki: false,
    rzadki: false,
    gwiazdka_przed: false,
    gwiazdka_za: false,
    mennica: '',
    material: '',
    waga_g: '',
    srednica_mm: '',
    data_zakupu: '',
    cena_zakupu: '',
    cena_zakupu_do: '',
    uwagi: '',
  }
}
