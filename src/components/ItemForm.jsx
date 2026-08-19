import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { uploadPhoto } from '../lib/uploadPhoto'


export default function ItemForm({ itemId, onSaved, onCancel, fixedType }) {
    const isEditMode = !!itemId


    // Form fields
    const [typ, setTyp] = useState(fixedType || 'moneta')
    const [nominal, setNominal] = useState('')
    const [kraj, setKraj] = useState('')
    const [rok, setRok] = useState('')
    const [data_wydania, setData_wydania] = useState('')
    const [miasto_wydania, setMiasto_wydania] = useState('')
    const [seria, setSeria] = useState('')
    const [nadruk, setNadruk] = useState('')
    const [kod_drukarni, setKodDrukarni] = useState('')
    const [znak_wodny, setZnakWodny] = useState('')
    const [naklad, setNaklad] = useState('')
    const [unikat, setUnikat] = useState(false)
    const [stan_zachowania, setStanZachowania] = useState('')
    const [data_zakupu, setData_zakupu] = useState('')
    const [cena_zakupu, setCena_zakupu] = useState('')
    const [uwagi, setUwagi] = useState('')


    // Zdjęcia (opcjonalne)
    const [awersFile, setAwersFile] = useState(null)
    const [rewersFile, setRewersFile] = useState(null)
    const [znakWodnyFile, setZnakWodnyFile] = useState(null)
    const [existingPhotos, setExistingPhotos] = useState({})
    const [photoUploading, setPhotoUploading] = useState(false)
    const [photoError, setPhotoError] = useState(null)


    // State
    const [stanyZachowaniList, setStanyZachowaniList] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})


    useEffect(() => {
        loadStanyZachowania()
    }, [])


    useEffect(() => {
        if (isEditMode && itemId) {
            loadItem()
            loadPhotos(itemId)
        }
    }, [isEditMode, itemId])


    // Gdy formularz jest otwierany z gotowym typem (zakładka Monety/Banknoty)
    // i nie jest to edycja istniejącego przedmiotu, wymuszamy ten typ.
    useEffect(() => {
        if (fixedType && !isEditMode) setTyp(fixedType)
    }, [fixedType, isEditMode])


    const loadStanyZachowania = async () => {
        try {
            const { data, error: err } = await supabase
                .from('stany_zachowania')
                .select('kod, etykieta')
                .order('kolejnosc', { ascending: true })
            if (err) throw err
            setStanyZachowaniList(data || [])
        } catch (err) {
            console.error('Błąd wczytywania stanów zachowania:', err)
            setError('Nie udało się wczytać stanów zachowania.')
        }
    }


    const loadPhotos = async (targetItemId) => {
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
    }
    const loadItem = async () => {
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


            setTyp(data.typ || 'moneta')
            setNominal(data.nominal || '')
            setKraj(data.kraj || '')
            setRok(data.rok ? String(data.rok) : '')
            setData_wydania(data.data_wydania || '')
            setMiasto_wydania(data.miasto_wydania || '')
            setSeria(data.seria || '')
            setNadruk(data.nadruk || '')
            setKodDrukarni(data.kod_drukarni || '')
            setZnakWodny(data.znak_wodny || '')
            setNaklad(data.naklad || '')
            setUnikat(!!data.unikat)
            setStanZachowania(data.stan_zachowania || '')
            setData_zakupu(data.data_zakupu || '')
            setCena_zakupu(data.cena_zakupu ? String(data.cena_zakupu) : '')
            setUwagi(data.uwagi || '')
        } catch (err) {
            console.error('Błąd wczytywania przedmiotu:', err)
            setError('Nie udało się wczytać przedmiotu: ' + err.message)
        } finally {
            setLoading(false)
        }
    }


    const validateForm = () => {
        const errors = {}
        if (!kraj.trim()) errors.kraj = 'Kraj jest wymagany.'
        if (!nominal.trim()) errors.nominal = 'Nominał jest wymagany.'


        const rokNum = rok ? parseInt(rok, 10) : null
        const hasRok = rokNum !== null && !isNaN(rokNum)
        const hasData = data_wydania.trim() !== ''
        if (!hasRok && !hasData) {
            errors.date_required = 'Podaj przynajmniej rok lub datę wydania.'
        }


        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }


    const uploadSelectedPhotos = async (targetItemId) => {
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
            await loadPhotos(targetItemId)   // <-- KLUCZOWA POPRAWKA: przekazujemy targetItemId
        } catch (err) {
            console.error('Błąd wgrywania zdjęć:', err)
            setPhotoError('Dane zapisane, ale nie udało się wgrać zdjęć: ' + err.message)
        } finally {
            setPhotoUploading(false)
        }
    }


    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)


        if (!validateForm()) return


        try {
            setLoading(true)


            let payload = {
                typ,
                nominal: nominal.trim(),
                kraj: kraj.trim(),
                rok: rok ? parseInt(rok, 10) : null,
                data_wydania: data_wydania || null,
                stan_zachowania: stan_zachowania || null,
                data_zakupu: data_zakupu || null,
                cena_zakupu: cena_zakupu ? parseFloat(cena_zakupu) : null,
                uwagi: uwagi.trim() || null,
            }


            if (typ === 'banknot') {
                payload.miasto_wydania = miasto_wydania.trim() || null
                payload.seria = seria.trim() || null
                payload.nadruk = nadruk.trim() || null
                payload.kod_drukarni = kod_drukarni.trim() || null
                payload.znak_wodny = znak_wodny.trim() || null
                payload.naklad = null
                payload.unikat = unikat
            } else {
                payload.miasto_wydania = null
                payload.seria = null
                payload.nadruk = null
                payload.kod_drukarni = null
                payload.znak_wodny = null
                payload.naklad = naklad.trim() || null
                payload.unikat = false
            }


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
                resetForm()
                if (onSaved) onSaved(data)
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
        }
    }


    const resetForm = () => {
        setTyp(fixedType || 'moneta')
        setNominal('')
        setKraj('')
        setRok('')
        setData_wydania('')
        setMiasto_wydania('')
        setSeria('')
        setNadruk('')
        setKodDrukarni('')
        setZnakWodny('')
        setNaklad('')
        setUnikat(false)
        setStanZachowania('')
        setData_zakupu('')
        setCena_zakupu('')
        setUwagi('')
        setAwersFile(null)
        setRewersFile(null)
        setZnakWodnyFile(null)
        setExistingPhotos({})
        setFieldErrors({})
    }


    return (
        <form onSubmit={handleSubmit} className="min-h-screen p-4 lg:p-8 lg:bg-gray-50">
            <div className="mx-auto max-w-md lg:max-w-6xl">
                <h2 className="mb-6 text-xl font-semibold text-gray-800">
                    {isEditMode
                        ? 'Edytuj przedmiot'
                        : fixedType === 'banknot'
                            ? 'Dodaj banknot'
                            : fixedType === 'moneta'
                                ? 'Dodaj monetę'
                                : 'Dodaj przedmiot'}
                </h2>


                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                        {isEditMode ? 'Przedmiot zaktualizowany!' : 'Przedmiot dodany!'}
                    </div>
                )}
                {fieldErrors.date_required && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        {fieldErrors.date_required}
                    </div>
                )}
                {photoError && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        {photoError}
                    </div>
                )}
                {loading && isEditMode && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                        Wczytywanie danych przedmiotu...
                    </div>
                )}


                <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8">
                    {/* Lewa kolumna: pola danych */}
                    <div className="space-y-3">
                        {/* Przełącznik Typ - chowany, gdy typ jest już wybrany przez zakładkę
                            i nie jesteśmy w edycji istniejącego przedmiotu innego typu */}
                        {!fixedType && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Typ *</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTyp('moneta')}
                                        className={`flex-1 min-h-[44px] rounded-lg px-4 py-2 font-medium transition-colors lg:min-h-[40px] ${typ === 'moneta' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Moneta
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTyp('banknot')}
                                        className={`flex-1 min-h-[44px] rounded-lg px-4 py-2 font-medium transition-colors lg:min-h-[40px] ${typ === 'banknot' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Banknot
                                    </button>
                                </div>
                            </div>
                        )}


                        <div>
                            <label htmlFor="nominal" className="mb-1 block text-sm font-medium text-gray-700">
                                Nominał <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="nominal"
                                type="text"
                                value={nominal}
                                onChange={(e) => {
                                    setNominal(e.target.value)
                                    if (fieldErrors.nominal) setFieldErrors({ ...fieldErrors, nominal: '' })
                                }}
                                placeholder="np. 100 zł"
                                className={`w-full min-h-[44px] rounded-lg border px-3 py-2 lg:min-h-[40px] ${fieldErrors.nominal ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {fieldErrors.nominal && <span className="mt-1 text-xs text-red-600">{fieldErrors.nominal}</span>}
                        </div>


                        <div>
                            <label htmlFor="kraj" className="mb-1 block text-sm font-medium text-gray-700">
                                Kraj <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="kraj"
                                type="text"
                                value={kraj}
                                onChange={(e) => {
                                    setKraj(e.target.value)
                                    if (fieldErrors.kraj) setFieldErrors({ ...fieldErrors, kraj: '' })
                                }}
                                placeholder="np. Polska"
                                className={`w-full min-h-[44px] rounded-lg border px-3 py-2 lg:min-h-[40px] ${fieldErrors.kraj ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {fieldErrors.kraj && <span className="mt-1 text-xs text-red-600">{fieldErrors.kraj}</span>}
                        </div>


                        {/* Rok + Data wydania, a dla monet dodatkowo Nakład w tym samym rzędzie */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label htmlFor="rok" className="mb-1 block text-sm font-medium text-gray-700">Rok</label>
                                <input
                                    id="rok"
                                    type="number"
                                    value={rok}
                                    onChange={(e) => {
                                        setRok(e.target.value)
                                        if (fieldErrors.date_required) setFieldErrors({ ...fieldErrors, date_required: '' })
                                    }}
                                    placeholder="np. 2023"
                                    className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="data_wydania" className="mb-1 block text-sm font-medium text-gray-700">
                                    Data wydania
                                </label>
                                <input
                                    id="data_wydania"
                                    type="date"
                                    value={data_wydania}
                                    onChange={(e) => {
                                        setData_wydania(e.target.value)
                                        if (fieldErrors.date_required) setFieldErrors({ ...fieldErrors, date_required: '' })
                                    }}
                                    className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                                />
                                <span className="mt-1 text-xs text-gray-500">Format: DD.MM.YYYY</span>
                            </div>
                            {typ === 'moneta' && (
                                <div className="flex-1">
                                    <label htmlFor="naklad" className="mb-1 block text-sm font-medium text-gray-700">
                                        Nakład
                                    </label>
                                    <input
                                        id="naklad"
                                        type="text"
                                        value={naklad}
                                        onChange={(e) => setNaklad(e.target.value)}
                                        placeholder="np. 1 mln szt."
                                        className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                                    />
                                </div>
                            )}
                        </div>


                        <div>
                            <label htmlFor="stan_zachowania" className="mb-1 block text-sm font-medium text-gray-700">
                                Stan zachowania
                            </label>
                            <select
                                id="stan_zachowania"
                                value={stan_zachowania}
                                onChange={(e) => setStanZachowania(e.target.value)}
                                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                            >
                                <option value="">-- Wybierz --</option>
                                {stanyZachowaniList.map((stan) => (
                                    <option key={stan.kod} value={stan.kod}>{stan.etykieta}</option>
                                ))}
                            </select>
                        </div>


                        {typ === 'banknot' && (
                            <>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label htmlFor="miasto_wydania" className="mb-1 block text-sm font-medium text-gray-700">
                                            Miasto wydania
                                        </label>
                                        <input
                                            id="miasto_wydania"
                                            type="text"
                                            value={miasto_wydania}
                                            onChange={(e) => setMiasto_wydania(e.target.value)}
                                            placeholder="np. Warszawa"
                                            className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="seria" className="mb-1 block text-sm font-medium text-gray-700">Seria</label>
                                        <input
                                            id="seria"
                                            type="text"
                                            value={seria}
                                            onChange={(e) => setSeria(e.target.value)}
                                            placeholder="np. AA 1234567"
                                            className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                                        />
                                    </div>
                                </div>


                                <div>
                                    <label htmlFor="nadruk" className="mb-1 block text-sm font-medium text-gray-700">Nadruk</label>
                                    <input
                                        id="nadruk"
                                        type="text"
                                        value={nadruk}
                                        onChange={(e) => setNadruk(e.target.value)}
                                        placeholder="opis nadruku"
                                        className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                                    />
                                </div>


                                <div>
                                    <label htmlFor="kod_drukarni" className="mb-1 block text-sm font-medium text-gray-700">
                                        Kod drukarni
                                    </label>
                                    <input
                                        id="kod_drukarni"
                                        type="text"
                                        value={kod_drukarni}
                                        onChange={(e) => setKodDrukarni(e.target.value)}
                                        placeholder="np. WZP"
                                        className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                                    />
                                </div>


                                <div>
                                    <label htmlFor="znak_wodny" className="mb-1 block text-sm font-medium text-gray-700">
                                        Znak wodny (opis)
                                    </label>
                                    <input
                                        id="znak_wodny"
                                        type="text"
                                        value={znak_wodny}
                                        onChange={(e) => setZnakWodny(e.target.value)}
                                        placeholder="opis znaku wodnego"
                                        className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                                    />
                                </div>


                                <div className="flex items-center gap-2">
                                    <input
                                        id="unikat"
                                        type="checkbox"
                                        checked={unikat}
                                        onChange={(e) => setUnikat(e.target.checked)}
                                        className="h-5 w-5 rounded border-gray-300"
                                    />
                                    <label htmlFor="unikat" className="text-sm font-medium text-gray-700">
                                        Unikat
                                    </label>
                                </div>
                            </>
                        )}


                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label htmlFor="data_zakupu" className="mb-1 block text-sm font-medium text-gray-700">
                                    Data zakupu
                                </label>
                                <input
                                    id="data_zakupu"
                                    type="date"
                                    value={data_zakupu}
                                    onChange={(e) => setData_zakupu(e.target.value)}
                                    className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="cena_zakupu" className="mb-1 block text-sm font-medium text-gray-700">
                                    Cena zakupu (PLN)
                                </label>
                                <input
                                    id="cena_zakupu"
                                    type="number"
                                    step="0.01"
                                    value={cena_zakupu}
                                    onChange={(e) => setCena_zakupu(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 lg:min-h-[40px]"
                                />
                            </div>
                        </div>


                        <div>
                            <label htmlFor="uwagi" className="mb-1 block text-sm font-medium text-gray-700">Uwagi</label>
                            <textarea
                                id="uwagi"
                                value={uwagi}
                                onChange={(e) => setUwagi(e.target.value)}
                                placeholder="Dodatkowe informacje..."
                                rows="3"
                                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2"
                            />
                        </div>
                    </div>


                    {/* Prawa kolumna: zdjęcia (opcjonalne) */}
                    <div className="lg:pt-0">
                        <div className="rounded-lg border border-gray-200 p-4 lg:sticky lg:top-8">
                            <h3 className="mb-2 text-sm font-semibold text-gray-700">Zdjęcia (opcjonalne)</h3>
                            <p className="mb-3 text-xs text-gray-500">
                                Możesz dodać zdjęcie poglądowe - nie jest wymagane do zapisania przedmiotu.
                                Na telefonie przycisk otworzy od razu aparat.
                            </p>


                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                <PhotoPicker label="Awers" existingUrl={existingPhotos.awers} onChange={setAwersFile} />
                                <PhotoPicker label="Rewers" existingUrl={existingPhotos.rewers} onChange={setRewersFile} />
                                {typ === 'banknot' && (
                                    <PhotoPicker
                                        label="Znak wodny"
                                        existingUrl={existingPhotos.znak_wodny}
                                        onChange={setZnakWodnyFile}
                                    />
                                )}
                            </div>


                            {photoUploading && <p className="mt-2 text-xs text-blue-600">Wgrywanie zdjęć...</p>}
                        </div>
                    </div>
                </div>


                <div className="mt-6 flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        {loading ? 'Zapisywanie...' : isEditMode ? 'Zaktualizuj' : 'Dodaj'}
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 rounded-lg bg-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300"
                        >
                            Anuluj
                        </button>
                    )}
                </div>
            </div>
        </form>
    )
}


function PhotoPicker({ label, existingUrl, onChange }) {
    const [previewUrl, setPreviewUrl] = useState(null)


    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null
        onChange(file)
        setPreviewUrl(file ? URL.createObjectURL(file) : null)
    }


    const displayUrl = previewUrl || existingUrl


    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            {displayUrl && (
                <img
                    src={displayUrl}
                    alt={label}
                    className="mb-2 h-32 w-full rounded-lg border border-gray-200 object-contain"
                />
            )}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="w-full text-sm"
            />
        </div>
    )
}