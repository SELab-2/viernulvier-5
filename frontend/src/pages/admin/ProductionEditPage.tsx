import ProductionTabContent from '../../components/admin/ProductionTabContent'
import ProductionTab from '../../components/admin/ProductionTab'
import AdminLayout from '../../components/admin/AdminLayout'
import SectionHeading from '../../components/admin/SectionHeading'
import EventsEdit from '../../components/admin/ManageEvents'

import type { Language, ProductionContent, ProductionContentFields, ProductionForm, ProductionSettingsFields, LocalizedText, ProductionResponse } from '../../types/production'
import type { Locale } from '../../i18n/types'
import type { Event, EventForm } from '../../types/event'

import { useNavigate, useParams } from 'react-router-dom'
import { getMessages } from '../../i18n'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import EventPopup from '../../components/admin/EventPopup'
import ProductionSidebar from '../../components/admin/ProductionSidebar'
import ProductionEditHeader from '../../components/admin/ProductionEditHeader'
import { useLocale } from '../../components/admin/useLocale'

const defaultContentForm : ProductionContent = {
    nl: {title: '', slug: '', content: ''},
    en: {title: '', slug: '', content: ''}
}

const defaultSettingsForm : ProductionSettingsFields = {
    artist: '',
    banner: '',
    extraPictures: [],
    genres: [],
    tags: []
}

const defaultForm : ProductionForm = {
    content: defaultContentForm,
    settings: defaultSettingsForm,
    events: []
}

const defaultEventForm : EventForm = {
    startDateTime: '',
    endDateTime: '',
    location: '',
    tags: []
}

type ProductionEditPageProps = {
    /**
     * If true this will create a new production else it will try
     * to open an existing production
     */
    create?: boolean
}

/**
 * Admin page for editing/creating a production
 * 
 * This page should provide a easy way to edit the contents of detail
 * pages in English and Dutch, edit or add events linked to this production,
 * change status, genre, banner or extra pictures and artist.
 * 
 * After a user is done with the edit they should be able to save it as
 * draft or publish it.
 */
function ProductionEditPage({ create } : ProductionEditPageProps) {
    const { locale } = useLocale()
    const messages = getMessages()
    const navigate = useNavigate()
    const { id } = useParams()          // current production id
    const [form, setForm] = useState<ProductionForm>(defaultForm)
    const [languageTab, setLanguageTab] = useState<Locale>('nl')
    const [tagInput, setTagInput] = useState('')
    const [genreInput, setGenreInput] = useState('')
    
    // Event state
    const [popupOpen, setPopupOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | undefined>()
    const [eventForm, setEventForm] = useState<EventForm>(defaultEventForm)
    const [eventTagInput, setEventTagInput] = useState('')

    const languageOptions: { key: Language, label: string}[] = [
        { key: 'nl', label: messages.production.dutchOption},
        { key: 'en', label: messages.production.englishOption},
    ]

    // Load all data of an existing production or create a new one
    useEffect(() => {
        if (create) return 
        // TODO: implement fetching production data
    }, [id, create])

    const back = () => {
        navigate("/admin")
    }

    const publish = async () => {
        saveProduction()
    }

    const saveProduction = async () => {
        try {
            if (create){
                const res = await api.post<ProductionResponse>('/archive/productions', {
                    title: {
                        nl: form.content?.nl.title,
                        en: form.content?.en.title,
                    },
                    description: {
                        nl: form.content?.nl.content,
                        en: form.content?.en.content,
                    },
                    artist: {
                        nl: form.settings.artist,
                        en: form.settings.artist,
                    },
                    // Mapping LocalizedText[] back to what backend expects
                    // Backend schema says tags: z.array(tagSchema).optional()
                    // where tagSchema is z.object({ id: string.uuid().optional() }).passthrough()
                    // For now we might just send names or wait for full implementation
                })

                navigate(`/admin/productions/${res.id}/edit`, { replace: true })
            } else {
                await api.put(`/archive/productions/${id}`, {
                    title: {
                        nl: form.content?.nl.title,
                        en: form.content?.en.title,
                    },
                    description: {
                        nl: form.content?.nl.content,
                        en: form.content?.en.content,
                    }
                })
            } 
        } catch (err) {
            console.error('Failed to save', err)
        }
    }

    const setTab = (key: Locale) => {
        setLanguageTab(key)
    }

    const onChangeContent = (field: keyof ProductionContentFields, value: string) => {
        setForm(prev => ({
            ...prev,
            content:  {
                ...prev.content,
                [languageTab] : {...prev.content[languageTab], [field]: value}
            }
        }))
    }

    const changeSettings = <K extends keyof ProductionSettingsFields>(field: K, value: ProductionSettingsFields[K]) => {
        setForm(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                [field]: value
            }
        }))
    }

    // Adding a tag to a new or existing production
    const onAddProductionTag = (tag: LocalizedText) => {
        const trimmed = (tag[locale] || tag.nl || tag.en || '').trim()
        if (!trimmed) return

        // Case-insensitive check
        const exists = form.settings.tags.some(t => {
            const existingName = (t[locale] || t.nl || t.en || '').trim().toLowerCase()
            return existingName === trimmed.toLowerCase()
        })
        if (exists) return

        changeSettings('tags', [...form.settings.tags, tag])
        setTagInput('')
    }

    const onAddProductionGenre = (genre: LocalizedText) => {
        const trimmed = (genre[locale] || genre.nl || genre.en || '').trim()
        if (!trimmed) return

        // Case-insensitive check
        const exists = form.settings.genres.some(g => {
            const existingName = (g[locale] || g.nl || g.en || '').trim().toLowerCase()
            return existingName === trimmed.toLowerCase()
        })
        if (exists) return

        changeSettings('genres', [...form.settings.genres, genre])
        setGenreInput('')
    }
    
    // Adding a tag to a new or existing event
    const onAddEventTag = () => {
        const trimmed = eventTagInput.trim()
        if(!trimmed ||  eventForm.tags.includes(trimmed)) return
        setEventForm(prev => ({...prev, tags: [...prev.tags, trimmed]}))
        setEventTagInput('')
    }

    const onChangeProductionTagInput = (tag: string) => {
        setTagInput(tag)
    }

    const onChangeProductionGenreInput = (genre: string) => {
        setGenreInput(genre)
    }

    const onRemoveProductionTag = (tag: LocalizedText) => {
        changeSettings('tags', form.settings.tags.filter(t => t !== tag))
    }

    const onRemoveProductionGenre = (genre: LocalizedText) => {
        changeSettings('genres', form.settings.genres.filter(g => g !== genre))
    }

    // Event functions
    const onChangeEventForm = (field: keyof EventForm, value: string) => {
        setEventForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const makeEvent = () => {
        setEventForm(defaultEventForm)
        setEditingEvent(undefined)
        setEventTagInput('')
        setPopupOpen(true)
    }

    const editEvent = (key: string) => {
        const event = form.events.find(e => e.key === key)
        if (!event) return
        setEditingEvent(event)
        setEventForm({
            startDateTime: event.startDateTime,
            endDateTime: event.endDateTime,
            location: event.location,
            tags: event.tags
        })
        setEventTagInput('')
        setPopupOpen(true)
    }

    const deleteEvent = (key: string) => {
        setForm(prev => ({
            ...prev,
            events: prev.events.filter(e => e.key !== key)
        }))
    }

    const saveEvent = () => {
        if (editingEvent) {
            setForm(prev => ({
                ...prev,
                events: (prev.events.map(e => e.key === editingEvent.key 
                    ? {...eventForm, key: e.key} : e
                ))
            }))
        } else {
            setForm(prev => ({
                ...prev,
                events: [...prev.events, {...eventForm, key: crypto.randomUUID()}]
            }))
        }
        setPopupOpen(false)
    }

    const onChangeEventTagInput = (tag: string) => {
        setEventTagInput(tag)
    }

    const onRemoveEventTag = (tag: string) => {
        setEventForm(prev => ({...prev, tags: prev.tags.filter(t => t !== tag)}))
    }

    return (
        <AdminLayout
            header={
                <ProductionEditHeader
                    backLabel={messages.production.back}
                    publishLabel={messages.production.publish}
                    back={back}
                    publish={publish}   
                />
            }
            sidebar={
                <ProductionSidebar
                    fields={form.settings}
                    tag={tagInput}
                    genre={genreInput}
                    onAddTag={onAddProductionTag}
                    onChangeTag={onChangeProductionTagInput}
                    onRemoveTag={onRemoveProductionTag}
                    onAddGenre={onAddProductionGenre}
                    onChangeGenre={onChangeProductionGenreInput}
                    onRemoveGenre={onRemoveProductionGenre}
                    onChange={changeSettings}

                    productionSettingsLabel={messages.production.productionSettingsLabel}
                    statusLabel={messages.production.statusLabel}
                    genreLabel={messages.production.genreLabel}
                    tagLabel={messages.production.tagLabel}
                    bannerLabel={messages.production.bannerLabel}
                    extraPicturesLabel={messages.production.extraPicturesLabel}
                    artistLabel={messages.production.artistLabel}
                />
            }
        >   
            <SectionHeading
                title={messages.production.productionEditTitle}
                subTitle={messages.production.productionEditSubTitle}
            />

            {/* Tabs for english and dutch contents of a production */}
            <ProductionTab
                language={languageTab}
                options={languageOptions}
                setTab={setTab}
            />

            <ProductionTabContent
                fields={form.content[languageTab]}
                onChange={onChangeContent}

                titleLabel={messages.production.title}
                slugLabel={messages.production.slug}
                contentLabel={messages.production.content}
            />

            <SectionHeading
                title={messages.production.eventsEditTitle}
                subTitle={messages.production.eventsEditSubTitle}
            />

            <EventsEdit
                events={form.events}
                makeEvent={makeEvent}
                editEvent={editEvent}
                deleteEvent={deleteEvent}

                makeLabel={messages.production.makeEventsLabel}
                dateLabel={messages.production.eventsDateLabel}
                timeLabel={messages.production.eventsTimeLabel}
                locationLabel={messages.production.eventsLocationLabel}
                commentLabel={messages.production.eventsCommentLabel}
                actionsLabel={messages.production.eventsActionsLabel}
            />

            {popupOpen && (
                <EventPopup
                    fields={eventForm}
                    isEdit={editingEvent !== undefined}
                    locations={[]}
                    eventTag={eventTagInput}
                    onSave={saveEvent}
                    onClose={() => setPopupOpen(false)}
                    onChange={onChangeEventForm}
                    onAddTag={onAddEventTag}
                    onChangeTag={onChangeEventTagInput}
                    onRemoveTag={onRemoveEventTag}

                    saveButtonLabel={messages.event.saveButtonLabel}
                    editLabel={messages.event.editLabel}
                    addLabel={messages.event.addLabel}
                    timeLabel={messages.event.timeLabel}
                    locationLabel={messages.event.locationLabel}
                    tagsLabel={messages.event.tagsLabel}
                />
            )}
        </AdminLayout>
    )
}

export default ProductionEditPage