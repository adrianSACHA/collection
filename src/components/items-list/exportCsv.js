// Eksport kolekcji do pliku CSV (czytelnego w Excelu PL).
// Czyste funkcje - bez zależności od Reacta, łatwe do testowania.

const CSV_COLUMNS = [
  { key: 'typ', label: 'Typ' },
  { key: 'kraj', label: 'Emitent / Kraj' },
  { key: 'nominal', label: 'Nominał' },
  { key: 'rok', label: 'Rok' },
  { key: 'ilosc', label: 'Ilość' },
  { key: 'wariant', label: 'Wariant' },
  { key: 'naklad', label: 'Nakład' },
  { key: 'mennica', label: 'Mennica' },
  { key: 'material', label: 'Materiał' },
  { key: 'waga_g', label: 'Waga (g)' },
  { key: 'srednica_mm', label: 'Średnica (mm)' },
  { key: 'seria', label: 'KN-seria' },
  { key: 'nadruk', label: 'Udr.-Bst.' },
  { key: 'kod_drukarni', label: 'FZ-kod drukarni' },
  { key: 'data_wydania', label: 'Data emisji' },
  { key: 'znak_wodny', label: 'Znak wodny' },
  { key: 'unc', label: 'UNC' },
  { key: 'unikat', label: 'Unikat' },
  { key: 'bardzo_rzadki', label: 'Bardzo rzadki' },
  { key: 'rzadki', label: 'Rzadki' },
  { key: 'do_kupienia', label: 'Do kupienia' },
  { key: 'cena_zakupu', label: 'Cena od' },
  { key: 'cena_zakupu_do', label: 'Cena do' },
  { key: 'data_zakupu', label: 'Data zakupu' },
  { key: 'sprzedawca', label: 'Sprzedawca' },
  { key: 'wartosc_aktualna', label: 'Wartość aktualna' },
  { key: 'lokalizacja', label: 'Lokalizacja' },
  { key: 'uwagi', label: 'Uwagi' },
]

function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportItemsToCsv(items, { scope = 'widoczne' } = {}) {
  // Średnik jako separator + BOM, żeby Excel (PL) poprawnie otwierał plik.
  const header = CSV_COLUMNS.map((c) => escapeCsvValue(c.label)).join(';')

  const rows = items.map((item) =>
    CSV_COLUMNS.map((c) => escapeCsvValue(item[c.key])).join(';')
  )

  const csv = '\uFEFF' + [header, ...rows].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `kolekcja-${scope}-${stamp}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
