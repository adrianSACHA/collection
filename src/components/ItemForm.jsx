import { useItemForm } from './item-form/useItemForm'
import { inputClass } from './item-form/formHelpers'
import FormField from './item-form/FormField'
import PhotoPicker from './item-form/PhotoPicker'

const rarityOptions = [
    {
        value: 'zwykly',
        label: 'Zwykły',
        description: 'Bez oznaczenia rzadkości',
    },
    {
        value: 'rzadki',
        label: 'Rzadki',
        description: 'Rzadko spotykany',
    },
    {
        value: 'bardzo_rzadki',
        label: 'Bardzo rzadki',
        description: 'Bardzo trudny do zdobycia',
    },
    {
        value: 'unikat',
        label: 'Unikat',
        description: 'Wyjątkowy egzemplarz',
    },
]

function getRarityValue(values) {
    if (values.unikat) return 'unikat'
    if (values.bardzo_rzadki) return 'bardzo_rzadki'
    if (values.rzadki) return 'rzadki'
    return 'zwykly'
}

// Podgląd buduje identyfikator banknotu w tej samej kolejności co lista
// (formatBanknoteSeries): nadruk -> FZ -> seria -> [✻] KN [✻] -> litera końcowa.
// Gwiazdka pokazuje się wyłącznie przy istniejącym numerze KN.
function getSeriesPreview(values) {
    const kn = values.kn_seria?.trim() || ''

    const parts = [
        values.nadruk?.trim(),
        values.kod_drukarni?.trim(),
        values.seria?.trim(),
        values.gwiazdka_przed && kn ? '✻' : null,
        kn || null,
        values.gwiazdka_za && kn ? '✻' : null,
        values.koncowka_serii?.trim(),
    ].filter(Boolean)

    return parts.join(' ')
}

export default function ItemForm({
    itemId,
    duplicateFrom,
    onSaved,
    onCancel,
    fixedType,
}) {
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
    } = useItemForm({
        itemId,
        duplicateFrom,
        fixedType,
        onSaved,
    })

    const v = values
    const isBanknote = effectiveTyp === 'banknot'
    const isCoin = effectiveTyp === 'moneta'
    const photoAspect = isBanknote ? 16 / 9 : 1
    const seriesPreview = isBanknote ? getSeriesPreview(v) : ''

    const setRarity = (rarity) => {
        setField('rzadki', rarity === 'rzadki')
        setField('bardzo_rzadki', rarity === 'bardzo_rzadki')
        setField('unikat', rarity === 'unikat')
    }

    return (
        <form
            onSubmit={(event) => handleSubmit(event, 'default')}
            className="min-h-screen p-4 lg:bg-gray-50 lg:p-8"
        >
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
                    <div className="space-y-5">
                                                {!fixedType && (
                            <div>
                                <span
                                    id="typ-label"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Typ *
                                </span>

                                <div
                                    role="group"
                                    aria-labelledby="typ-label"
                                    className="flex gap-2"
                                >
                                    <button
                                        type="button"
                                        aria-pressed={v.typ === 'moneta'}
                                        onClick={() => setField('typ', 'moneta')}
                                        className={`min-h-[44px] flex-1 rounded-lg px-4 py-2 font-medium transition-colors lg:min-h-[40px] ${v.typ === 'moneta'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Moneta
                                    </button>

                                                                        <button
                                        type="button"
                                        aria-pressed={v.typ === 'banknot'}
                                        onClick={() => setField('typ', 'banknot')}
                                        className={`min-h-[44px] flex-1 rounded-lg px-4 py-2 font-medium transition-colors lg:min-h-[40px] ${v.typ === 'banknot'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Banknot
                                    </button>
                                </div>
                            </div>
                        )}

                        <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                            <h3 className="text-sm font-semibold text-gray-800">
                                Podstawowe informacje
                            </h3>

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
                                    value={v.nominal || ''}
                                    onChange={(event) =>
                                        setField('nominal', event.target.value)
                                    }
                                    placeholder={isBanknote ? 'np. 50 mld marek' : 'np. 100 zł'}
                                    className={`${inputClass} ${fieldErrors.nominal ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                            </FormField>

                            {isBanknote ? (
                                                                <FormField
                                    label="Emitent"
                                    htmlFor="kraj"
                                    required
                                    error={fieldErrors.kraj}
                                    hint="Np. Darmstadt"
                                >
                                    <input
                                        id="kraj"
                                        type="text"
                                        value={v.kraj || ''}
                                        onChange={(event) =>
                                            setField('kraj', event.target.value)
                                        }
                                        placeholder="np. Darmstadt"
                                        className={`${inputClass} ${fieldErrors.kraj
                                                ? 'border-red-500'
                                                : 'border-gray-300'
                                            }`}
                                    />
                                </FormField>
                            ) : (
                                <FormField
                                    label="Kraj"
                                    htmlFor="kraj"
                                    required
                                    error={fieldErrors.kraj}
                                >
                                    <input
                                        id="kraj"
                                        type="text"
                                        value={v.kraj || ''}
                                        onChange={(event) =>
                                            setField('kraj', event.target.value)
                                        }
                                        placeholder="np. Polska"
                                        className={`${inputClass} ${fieldErrors.kraj ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                </FormField>
                            )}
                            <div className="grid gap-3 sm:grid-cols-2">
                                {isCoin && (
                                    <FormField label="Rok" htmlFor="rok">
                                        <input
                                            id="rok"
                                            type="number"
                                            value={v.rok || ''}
                                            onChange={(event) => setField('rok', event.target.value)}
                                            placeholder="np. 2023"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>
                                )}

                                <FormField
                                    label={isBanknote ? 'Data emisji' : 'Data wydania'}
                                    htmlFor="data_wydania"
                                    hint="Format: DD.MM.RRRR"
                                    className={isCoin ? '' : 'sm:col-span-2'}
                                >
                                    <input
                                        id="data_wydania"
                                        type="date"
                                        value={v.data_wydania || ''}
                                        onChange={(event) =>
                                            setField('data_wydania', event.target.value)
                                        }
                                        className={`${inputClass} border-gray-300`}
                                    />
                                </FormField>

                                {isCoin && (
                                    <FormField label="Nakład" htmlFor="naklad">
                                        <input
                                            id="naklad"
                                            type="text"
                                            value={v.naklad || ''}
                                            onChange={(event) =>
                                                setField('naklad', event.target.value)
                                            }
                                            placeholder="np. 1 mln szt."
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>
                                )}
                            </div>
                        </section>

                        {isBanknote && (
                            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800">
                                        Seria i numer banknotu
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Wpisz tylko elementy, które występują na danym banknocie.
                                        Puste pola nie zostaną pokazane na liście.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                    <FormField
                                        label="Seria"
                                        htmlFor="seria"
                                        hint="Np. B"
                                    >
                                                                                <input
                                                                                    id="seria"
                                                                                    type="text"
                                                                                    value={v.seria || ''}
                                                                                    onChange={(event) =>
                                                                                        setField('seria', event.target.value)
                                                                                    }
                                                                                    placeholder="np. B"
                                                                                    maxLength="10"
                                                                                    className={`${inputClass} border-gray-300`}
                                                                                />
                                    </FormField>

                                                                        <FormField
                                        label="BZ - FZ"
                                        htmlFor="kod_drukarni"
                                        hint="Nr arkusza - kod drukarni"
                                    >
                                        <input
                                            id="kod_drukarni"
                                            type="text"
                                            value={v.kod_drukarni || ''}
                                            onChange={(event) =>
                                                setField('kod_drukarni', event.target.value)
                                            }
                                            placeholder="np. 12 - WZP"
                                            maxLength="20"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>

                                    <FormField
                                        label="KN / numer"
                                        htmlFor="kn_seria"
                                        hint="Np. 123456"
                                    >
                                        <input
                                            id="kn_seria"
                                            type="text"
                                            inputMode="numeric"
                                            value={v.kn_seria || ''}
                                            onChange={(event) =>
                                                setField('kn_seria', event.target.value)
                                            }
                                            placeholder="np. 123456"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Litera końcowa"
                                        htmlFor="koncowka_serii"
                                        hint="Po numerze lub gwiazdce"
                                    >
                                                                                <input
                                            id="koncowka_serii"
                                            type="text"
                                            value={v.koncowka_serii || ''}
                                            onChange={(event) =>
                                                setField('koncowka_serii', event.target.value)
                                            }
                                            placeholder="np. A"
                                            maxLength="10"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>
                                </div>

                                <fieldset>
                                    <legend className="mb-2 text-sm font-medium text-gray-700">
                                        Położenie gwiazdki
                                    </legend>

                                    <div className="grid grid-cols-3 gap-2">
                                        <label
                                            className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${!v.gwiazdka_przed && !v.gwiazdka_za
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="pozycja_gwiazdki"
                                                checked={!v.gwiazdka_przed && !v.gwiazdka_za}
                                                onChange={() => {
                                                    setField('gwiazdka_przed', false)
                                                    setField('gwiazdka_za', false)
                                                }}
                                                className="sr-only"
                                            />
                                            Bez gwiazdki
                                        </label>

                                        <label
                                            className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${v.gwiazdka_przed
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="pozycja_gwiazdki"
                                                checked={Boolean(v.gwiazdka_przed)}
                                                onChange={() => {
                                                    setField('gwiazdka_przed', true)
                                                    setField('gwiazdka_za', false)
                                                }}
                                                className="sr-only"
                                            />
                                            ✻ przed KN
                                        </label>

                                        <label
                                            className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${v.gwiazdka_za
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="pozycja_gwiazdki"
                                                checked={Boolean(v.gwiazdka_za)}
                                                onChange={() => {
                                                    setField('gwiazdka_przed', false)
                                                    setField('gwiazdka_za', true)
                                                }}
                                                className="sr-only"
                                            />
                                            ✻ po KN
                                        </label>
                                    </div>
                                </fieldset>

                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Podgląd zapisu serii
                                    </p>
                                    <p className="mt-1 min-h-5 text-sm font-semibold text-gray-800">
                                        {seriesPreview || 'Uzupełnij serię lub numer KN'}
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormField
                                        label="Udr.-Bst. / nadruk"
                                        htmlFor="nadruk"
                                        hint="Opcjonalny opis lub nadruk"
                                    >
                                        <input
                                            id="nadruk"
                                            type="text"
                                            value={v.nadruk || ''}
                                            onChange={(event) =>
                                                setField('nadruk', event.target.value)
                                            }
                                            placeholder="opis nadruku"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Znak wodny (opis)"
                                        htmlFor="znak_wodny"
                                    >
                                        <input
                                            id="znak_wodny"
                                            type="text"
                                            value={v.znak_wodny || ''}
                                            onChange={(event) =>
                                                setField('znak_wodny', event.target.value)
                                            }
                                            placeholder="opis znaku wodnego"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>
                                </div>
                            </section>
                        )}

                        {isCoin && (
                            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    Parametry monety
                                </h3>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormField label="Mennica" htmlFor="mennica">
                                        <input
                                            id="mennica"
                                            type="text"
                                            value={v.mennica || ''}
                                            onChange={(event) =>
                                                setField('mennica', event.target.value)
                                            }
                                            placeholder="np. Warszawa (MW)"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>

                                    <FormField label="Materiał / stop" htmlFor="material">
                                        <input
                                            id="material"
                                            type="text"
                                            value={v.material || ''}
                                            onChange={(event) =>
                                                setField('material', event.target.value)
                                            }
                                            placeholder="np. Cu-Ni, Ag 925"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>

                                    <FormField label="Waga (g)" htmlFor="waga_g">
                                        <input
                                            id="waga_g"
                                            type="number"
                                            step="0.01"
                                            value={v.waga_g || ''}
                                            onChange={(event) =>
                                                setField('waga_g', event.target.value)
                                            }
                                            placeholder="np. 5.00"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>

                                    <FormField label="Średnica (mm)" htmlFor="srednica_mm">
                                        <input
                                            id="srednica_mm"
                                            type="number"
                                            step="0.01"
                                            value={v.srednica_mm || ''}
                                            onChange={(event) =>
                                                setField('srednica_mm', event.target.value)
                                            }
                                            placeholder="np. 24.00"
                                            className={`${inputClass} border-gray-300`}
                                        />
                                    </FormField>
                                </div>
                            </section>
                        )}

                        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800">
                                    Stan, rzadkość i ilość
                                </h3>
                                <p className="mt-1 text-xs text-gray-500">
                                    Stan zachowania oraz rzadkość są rozdzielone, ponieważ opisują
                                    dwie różne cechy egzemplarza.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField
                                    label="Stan zachowania / cecha"
                                    htmlFor="unc"
                                    hint="Np. UNC"
                                >
                                    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-gray-300 px-3 py-2 transition-colors hover:bg-gray-50">
                                        <input
                                            id="unc"
                                            type="checkbox"
                                            checked={Boolean(v.unc)}
                                            onChange={(event) =>
                                                setField('unc', event.target.checked)
                                            }
                                            className="h-5 w-5 rounded border-gray-300"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            UNC — stan nieobiegowy
                                        </span>
                                    </label>
                                </FormField>

                                <FormField
                                    label="Ilość"
                                    htmlFor="ilosc"
                                    hint="Nie jest wyświetlana w pasku listy"
                                >
                                    <input
                                        id="ilosc"
                                        type="number"
                                        min="1"
                                        value={v.ilosc || ''}
                                        onChange={(event) =>
                                            setField('ilosc', event.target.value)
                                        }
                                        placeholder="1"
                                        className={`${inputClass} border-gray-300`}
                                    />
                                </FormField>
                            </div>

                            <fieldset>
                                <legend className="mb-2 text-sm font-medium text-gray-700">
                                    Rzadkość
                                </legend>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {rarityOptions.map((option) => {
                                        const isSelected = getRarityValue(v) === option.value

                                        return (
                                            <label
                                                key={option.value}
                                                className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${isSelected
                                                        ? 'border-blue-600 bg-blue-50'
                                                        : 'border-gray-300 bg-white hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="rzadkosc"
                                                    checked={isSelected}
                                                    onChange={() => setRarity(option.value)}
                                                    className="h-4 w-4 border-gray-300 text-blue-600"
                                                />

                                                <span>
                                                    <span className="block text-sm font-medium text-gray-800">
                                                        {option.label}
                                                    </span>
                                                    <span className="block text-xs text-gray-500">
                                                        {option.description}
                                                    </span>
                                                </span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </fieldset>

                            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-gray-300 px-3 py-2 transition-colors hover:bg-gray-50">
                                <input
                                    id="do_kupienia"
                                    type="checkbox"
                                    checked={Boolean(v.do_kupienia)}
                                    onChange={(event) =>
                                        setField('do_kupienia', event.target.checked)
                                    }
                                    className="h-5 w-5 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Do kupienia
                                </span>
                            </label>
                        </section>

                        <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                            <h3 className="text-sm font-semibold text-gray-800">
                                Zakup i uwagi
                            </h3>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <FormField label="Data zakupu" htmlFor="data_zakupu">
                                    <input
                                        id="data_zakupu"
                                        type="date"
                                        value={v.data_zakupu || ''}
                                        onChange={(event) =>
                                            setField('data_zakupu', event.target.value)
                                        }
                                        className={`${inputClass} border-gray-300`}
                                    />
                                </FormField>

                                <FormField label="Cena od (PLN)" htmlFor="cena_zakupu">
                                    <input
                                        id="cena_zakupu"
                                        type="number"
                                        step="0.01"
                                        value={v.cena_zakupu || ''}
                                        onChange={(event) =>
                                            setField('cena_zakupu', event.target.value)
                                        }
                                        placeholder="0.00"
                                        className={`${inputClass} border-gray-300`}
                                    />
                                </FormField>

                                <FormField label="Cena do (PLN)" htmlFor="cena_zakupu_do">
                                    <input
                                        id="cena_zakupu_do"
                                        type="number"
                                        step="0.01"
                                        value={v.cena_zakupu_do || ''}
                                        onChange={(event) =>
                                            setField('cena_zakupu_do', event.target.value)
                                        }
                                        placeholder="0.00"
                                        className={`${inputClass} border-gray-300`}
                                    />
                                </FormField>
                            </div>

                            <FormField label="Uwagi" htmlFor="uwagi">
                                <textarea
                                    id="uwagi"
                                    value={v.uwagi || ''}
                                    onChange={(event) => setField('uwagi', event.target.value)}
                                    placeholder="Dodatkowe informacje..."
                                    rows="3"
                                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </FormField>
                        </section>
                    </div>

                    <div className="lg:pt-0">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 lg:sticky lg:top-8">
                            <h3 className="mb-2 text-sm font-semibold text-gray-700">
                                Zdjęcia (opcjonalne)
                            </h3>

                            <p className="mb-3 text-xs text-gray-500">
                                Możesz dodać zdjęcie poglądowe. Zdjęcie nie jest wymagane do
                                zapisania przedmiotu. Na telefonie przycisk otworzy aparat.
                            </p>

                            <div
                                key={photoResetKey}
                                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"
                            >
                                <PhotoPicker
                                    label="Awers"
                                    aspect={photoAspect}
                                    existingUrl={existingPhotos.awers}
                                    onChange={setAwersFile}
                                    onRemoveExisting={
                                        isEditMode
                                            ? () => deleteExistingPhoto('awers')
                                            : null
                                    }
                                    removing={photoDeleting === 'awers'}
                                />

                                <PhotoPicker
                                    label="Rewers"
                                    aspect={photoAspect}
                                    existingUrl={existingPhotos.rewers}
                                    onChange={setRewersFile}
                                    onRemoveExisting={
                                        isEditMode
                                            ? () => deleteExistingPhoto('rewers')
                                            : null
                                    }
                                    removing={photoDeleting === 'rewers'}
                                />

                                {isBanknote && (
                                    <PhotoPicker
                                        label="Znak wodny"
                                        aspect={photoAspect}
                                        existingUrl={existingPhotos.znak_wodny}
                                        onChange={setZnakWodnyFile}
                                        onRemoveExisting={
                                            isEditMode
                                                ? () => deleteExistingPhoto('znak_wodny')
                                                : null
                                        }
                                        removing={photoDeleting === 'znak_wodny'}
                                    />
                                )}
                            </div>

                            {photoUploading && (
                                <p className="mt-2 text-xs text-blue-600">
                                    Wgrywanie zdjęć...
                                </p>
                            )}
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
                            onClick={(event) => handleSubmit(event, 'addAnother')}
                            disabled={loading}
                            className="flex-1 rounded-lg bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-300"
                        >
                            {loading && savingMode === 'addAnother'
                                ? 'Zapisywanie...'
                                : 'Zapisz i dodaj kolejny'}
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