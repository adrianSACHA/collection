// Eksport kolekcji do pliku CSV (czytelnego w Excelu PL).
// Czyste funkcje - bez zależności od Reacta, łatwe do testowania.

const CSV_COLUMNS = [
  { key: 'typ', label: 'Typ' },
  { key: 'kraj', label: 'Kraj' },
  { key: 'nominal', label: 'Nominał' },
  { key: 'rok', label: 'Rok' },
  { key: 'ilosc', label: 'Ilość' },
  { key: 'stan_zachowania_etykieta', label: 'Stan zachowania' },
  { key: 'wariant', label: 'Wariant' },
  { key: 'numer_katalogowy', label: 'Nr katalogowy' },
  { key: 'naklad', label: 'Nakład' },
  { key: 'mennica', label: 'Mennica' },
  { key: 'material', label: 'Materiał' },
  { key: 'waga_g', label: 'Waga (g)' },
  { key: 'srednica_mm', label: 'Średnica (mm)' },
  { key: 'seria', label: 'Seria' },
  { key: 'nadruk', label: 'Nadruk' },
  { key: 'kod_drukarni', label: 'Kod drukarni' },
  { key: 'miasto_wydania', label: 'Miasto wydania' },
  { key: 'data_wydania', label: 'Data wydania' },
  { key: 'unikat', label: 'Unikat' },
  { key: 'cena_zakupu', label: 'Cena zakupu' },
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
