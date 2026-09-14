import { useItemForm } from './item-form/useItemForm'
import { inputClass } from './item-form/formHelpers'
import FormField from './item-form/FormField'
import PhotoPicker from './item-form/PhotoPicker'

export default function ItemForm({ itemId, duplicateFrom, onSaved, onCancel, fixedType }) {
    const {
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
    } = useItemForm({ itemId, duplicateFrom, fixedType, onSaved })

        const v = values // alias dla czytelności w JSX

    // Proporcja kadrowania: monety kwadratowe, banknoty 16:9.
    const photoAspect = effectiveTyp === 'banknot' ? 16 / 9 : 1

    return (
        <form onSubmit={(e) => handleSubmit(e, 'default')} className="min-h-screen p-4 lg:p-8 lg:bg-gray-50">
            <div className="mx-auto max-w-md lg:max-w-6xl">
                                <h2 className="mb-6 text-xl font-semibold text-gray-800">
                    {isEditMode
                        ? 'Edytuj przedmiot'
                        : duplicateFrom
                            ? 'Duplikuj przedmiot'
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
                                        onClick={() => setField('typ', 'moneta')}
                                        className={`flex-1 min-h-[44px] rounded-lg px-4 py-2 font-medium transition-colors lg:min-h-[40px] ${v.typ === 'moneta' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Moneta
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setField('typ', 'banknot')}
                                        className={`flex-1 min-h-[44px] rounded-lg px-4 py-2 font-medium transition-colors lg:min-h-[40px] ${v.typ === 'banknot' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Banknot
                                    </button>
                                </div>
                            </div>
                        )}

                        <FormField
                            label="Nominał"
                            htmlFor="nominal"
                            required
                            error={fieldErrors.nominal}
                        >
                            <input
                                ref={nominalInputRef}
                                id="nominal"
                                type="text"
                                value={v.nominal}
                                onChange={(e) => setField('nominal', e.target.value)}
                                placeholder="np. 100 zł"
                                className={`${inputClass} ${fieldErrors.nominal ? 'border-red-500' : 'border-gray-300'}`}
                            />
                        </FormField>

                                                <FormField
                            label={effectiveTyp === 'banknot' ? 'Emitent' : 'Kraj'}
                            htmlFor="kraj"
                            required
                            error={fieldErrors.kraj}
                        >
                            <input
                                id="kraj"
                                type="text"
                                value={v.kraj}
                                onChange={(e) => setField('kraj', e.target.value)}
                                placeholder={effectiveTyp === 'banknot' ? 'np. Narodowy Bank Polski' : 'np. Polska'}
                                className={`${inputClass} ${fieldErrors.kraj ? 'border-red-500' : 'border-gray-300'}`}
                            />
                        </FormField>

                        {/* Rok (tylko monety), Data emisji/wydania oraz Nakład (tylko monety) */}
                        <div className="flex gap-3">
                            {effectiveTyp === 'moneta' && (
                                <FormField label="Rok" htmlFor="rok" className="flex-1">
                                    <input
                                        id="rok"
                                        type="number"
                                        value={v.rok}
                                        onChange={(e) => setField('rok', e.target.value)}
                                        placeholder="np. 2023"
                                        className={`${inputClass} border-gray-300`}
                                    />
                                </FormField>
                            )}
                            <FormField
                                label={effectiveTyp === 'banknot' ? 'Data emisji' : 'Data wydania'}
                                htmlFor="data_wydania"
                                hint="Format: DD.MM.YYYY"
                                className="flex-1"
                            >
                                <input
                                    id="data_wydania"
                                    type="date"
                                    value={v.data_wydania}
                                    onChange={(e) => setField('data_wydania', e.target.value)}
                                    className={`${inputClass} border-gray-300`}
                                />
                            </FormField>
                            {effectiveTyp === 'moneta' && (
                                <FormField label="Nakład" htmlFor="naklad" className="flex-1">
                                    <input
                                        id="naklad"
                                        type="text"
                                        value={v.naklad}
                                        onChange={(e) => setField('naklad', e.target.value)}
                                        placeholder="np. 1 mln szt."
                                        className={`${inputClass} border-gray-300`}
                                    />
                                </FormField>
                            )}
                        </div>

                                                <div className="flex gap-3">
                            <FormField label="Ilość" htmlFor="ilosc" className="w-28">
                                <input
                                    id="ilosc"
                                    type="number"
                                    min="1"
                                    value={v.ilosc}
                                    onChange={(e) => setField('ilosc', e.target.value)}
                                    placeholder="1"
                                    className={`${inputClass} border-gray-300`}
                                />
                            </FormField>
                        </div>

                                                {/* Cechy (flagi) - niezależne checkboxy */}
                        <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3">
                            <label className="flex items-center gap-2">
                                <input
                                    id="do_kupienia"
                                    type="checkbox"
                                    checked={v.do_kupienia}
                                    onChange={(e) => setField('do_kupienia', e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Do kupienia</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    id="unc"
                                    type="checkbox"
                                    checked={v.unc}
                                    onChange={(e) => setField('unc', e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">UNC</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    id="unikat"
                                    type="checkbox"
                                    checked={v.unikat}
                                    onChange={(e) => setField('unikat', e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Unikat</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    id="bardzo_rzadki"
                                    type="checkbox"
                                    checked={v.bardzo_rzadki}
                                    onChange={(e) => setField('bardzo_rzadki', e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Bardzo rzadki</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    id="rzadki"
                                    type="checkbox"
                                    checked={v.rzadki}
                                    onChange={(e) => setField('rzadki', e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Rzadki</span>
                            </label>
                        </div>

                        {effectiveTyp === 'moneta' && (
                            <>
                                <div className="flex gap-3">
                                    <FormField label="Mennica" htmlFor="mennica" className="flex-1">
                                        <input
                                            id="mennica"
                                            type="text"
                                            value={v.mennica}
                                            onChange={(e) => setField('mennica', e.target.value)}
                                            placeholder="np. Warszawa (MW)"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>
                                    <FormField label="Materiał / stop" htmlFor="material" className="flex-1">
                                        <input
                                            id="material"
                                            type="text"
                                            value={v.material}
                                            onChange={(e) => setField('material', e.target.value)}
                                            placeholder="np. Cu-Ni, Ag 925"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>
                                </div>

                                <div className="flex gap-3">
                                    <FormField label="Waga (g)" htmlFor="waga_g" className="flex-1">
                                        <input
                                            id="waga_g"
                                            type="number"
                                            step="0.01"
                                            value={v.waga_g}
                                            onChange={(e) => setField('waga_g', e.target.value)}
                                            placeholder="np. 5.00"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>
                                    <FormField label="Średnica (mm)" htmlFor="srednica_mm" className="flex-1">
                                        <input
                                            id="srednica_mm"
                                            type="number"
                                            step="0.01"
                                            value={v.srednica_mm}
                                            onChange={(e) => setField('srednica_mm', e.target.value)}
                                            placeholder="np. 24.00"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>
                                </div>
                            </>
                        )}

                                                {effectiveTyp === 'banknot' && (
                                                    <>
                                                                                                                <div className="flex gap-3">
                                                            <FormField label="Udr.-BST." htmlFor="nadruk" className="flex-1">
                                                                <input
                                                                    id="nadruk"
                                                                    type="text"
                                                                    value={v.nadruk}
                                                                    onChange={(e) => setField('nadruk', e.target.value)}
                                                                    placeholder="opis"
                                                                    className={`${inputClass} border-gray-300`}
                                                                />
                                                            </FormField>

                                                            <FormField label="FZ" htmlFor="kod_drukarni" className="flex-1">
                                                                <input
                                                                    id="kod_drukarni"
                                                                    type="text"
                                                                    value={v.kod_drukarni}
                                                                    onChange={(e) => setField('kod_drukarni', e.target.value)}
                                                                    placeholder="np. WZP"
                                                                    className={`${inputClass} border-gray-300`}
                                                                />
                                                            </FormField>

                                                            <FormField label="KN" htmlFor="seria" className="flex-1">
                                                                <input
                                                                    id="seria"
                                                                    type="text"
                                                                    value={v.seria}
                                                                    onChange={(e) => setField('seria', e.target.value)}
                                                                    placeholder="np. AA 1234567"
                                                                    className={`${inputClass} border-gray-300`}
                                                                />

                                                                <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={v.gwiazdka}
                                                                        onChange={(e) => setField('gwiazdka', e.target.checked)}
                                                                        className="h-4 w-4 rounded border-gray-300"
                                                                    />
                                                                    <span>✻ oznacz</span>
                                                                </label>
                                                            </FormField>
                                                        </div>

                                                        <FormField label="Znak wodny (opis)" htmlFor="znak_wodny">
                                                            <input
                                                                id="znak_wodny"
                                                                type="text"
                                                                value={v.znak_wodny}
                                                                onChange={(e) => setField('znak_wodny', e.target.value)}
                                                                placeholder="opis znaku wodnego"
                                                                className={`${inputClass} border-gray-300`}
                                                            />
                                                        </FormField>
                                                    </>
                                                )}

                                                <div className="flex gap-3">
                            <FormField label="Data zakupu" htmlFor="data_zakupu" className="flex-1">
                                <input
                                    id="data_zakupu"
                                    type="date"
                                    value={v.data_zakupu}
                                    onChange={(e) => setField('data_zakupu', e.target.value)}
                                    className={`${inputClass} border-gray-300`}
                                />
                            </FormField>
                            <FormField label="Cena od (PLN)" htmlFor="cena_zakupu" className="flex-1">
                                <input
                                    id="cena_zakupu"
                                    type="number"
                                    step="0.01"
                                    value={v.cena_zakupu}
                                    onChange={(e) => setField('cena_zakupu', e.target.value)}
                                    placeholder="0.00"
                                    className={`${inputClass} border-gray-300`}
                                />
                            </FormField>
                            <FormField label="Cena do (PLN)" htmlFor="cena_zakupu_do" className="flex-1">
                                <input
                                    id="cena_zakupu_do"
                                    type="number"
                                    step="0.01"
                                    value={v.cena_zakupu_do}
                                    onChange={(e) => setField('cena_zakupu_do', e.target.value)}
                                    placeholder="0.00"
                                    className={`${inputClass} border-gray-300`}
                                />
                            </FormField>
                        </div>

                        <FormField label="Uwagi" htmlFor="uwagi">
                            <textarea
                                id="uwagi"
                                value={v.uwagi}
                                onChange={(e) => setField('uwagi', e.target.value)}
                                placeholder="Dodatkowe informacje..."
                                rows="3"
                                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2"
                            />
                        </FormField>
                    </div>


                    {/* Prawa kolumna: zdjęcia (opcjonalne) */}
                    <div className="lg:pt-0">
                        <div className="rounded-lg border border-gray-200 p-4 lg:sticky lg:top-8">
                            <h3 className="mb-2 text-sm font-semibold text-gray-700">Zdjęcia (opcjonalne)</h3>
                            <p className="mb-3 text-xs text-gray-500">
                                Możesz dodać zdjęcie poglądowe - nie jest wymagane do zapisania przedmiotu.
                                Na telefonie przycisk otworzy od razu aparat.
                            </p>


                                                        <div key={photoResetKey} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                <PhotoPicker
                                    label="Awers"
                                    aspect={photoAspect}
                                    existingUrl={existingPhotos.awers}
                                    onChange={setAwersFile}
                                    onRemoveExisting={isEditMode ? () => deleteExistingPhoto('awers') : null}
                                    removing={photoDeleting === 'awers'}
                                />
                                <PhotoPicker
                                    label="Rewers"
                                    aspect={photoAspect}
                                    existingUrl={existingPhotos.rewers}
                                    onChange={setRewersFile}
                                    onRemoveExisting={isEditMode ? () => deleteExistingPhoto('rewers') : null}
                                    removing={photoDeleting === 'rewers'}
                                />
                                {effectiveTyp === 'banknot' && (
                                    <PhotoPicker
                                        label="Znak wodny"
                                        aspect={photoAspect}
                                        existingUrl={existingPhotos.znak_wodny}
                                        onChange={setZnakWodnyFile}
                                        onRemoveExisting={isEditMode ? () => deleteExistingPhoto('znak_wodny') : null}
                                        removing={photoDeleting === 'znak_wodny'}
                                    />
                                )}
                            </div>


                            {photoUploading && <p className="mt-2 text-xs text-blue-600">Wgrywanie zdjęć...</p>}
                        </div>
                    </div>
                </div>


                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        {loading && savingMode === 'default'
                            ? 'Zapisywanie...'
                            : isEditMode
                                ? 'Zaktualizuj'
                                : duplicateFrom
                                    ? 'Dodaj duplikat'
                                    : 'Dodaj'}
                    </button>


                    {!isEditMode && (
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'addAnother')}
                            disabled={loading}
                            className="flex-1 rounded-lg bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-300"
                        >
                            {loading && savingMode === 'addAnother' ? 'Zapisywanie...' : 'Zapisz i dodaj kolejny'}
                        </button>
                    )}


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