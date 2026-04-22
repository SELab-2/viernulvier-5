import ArchiveTabContent from '../../components/admin/ArchiveTabContent'
import ArchiveTab from '../../components/admin/ArchiveTab'
import AdminLayout from '../../components/admin/AdminLayout'
import SectionHeading from '../../components/admin/SectionHeading'
import EventsEdit from '../../components/admin/ManageEvents'

import type { Language, ProductionContent, ProductionContentFields, ProductionForm, ProductionSettingsFields } from '../../types/production'
import type { Locale } from '../../i18n/types'
import type { Event, EventForm } from '../../types/event'
import type { ProductionResponse } from '../../../../backend/src/modules/productions/productions.schema'

import { useNavigate, useParams } from 'react-router-dom'
import { getMessages } from '../../i18n'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import EventPopup from '../../components/admin/EventPopup'
import ArchiveSidebar from '../../components/admin/ArchiveSidebar'
import ArchiveEditHeader from '../../components/admin/ArchiveEditHeader'

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
function ArchiveEditPage({ create } : ProductionEditPageProps) {
    const messages = getMessages()
    const navigate = useNavigate()
    const { id } = useParams()          // current production id

    // Production state
    const [form, setForm] = useState<ProductionForm>(defaultForm)
    // const [prod, setProd] = useState<ProductionResponse>()
    const [languageTab, setLanguageTab] = useState<Locale>('nl')
    // const [form, setForm] = useState<ProductionContent>(defaultForm)
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
        // api.get<LocationResponse>(`/archive/locations`)
        //     .then()
        //     .catch()
        if (create) return 

        // TODO: make use of the slug
        // const fetch = async () => {
        //     const production = await api.get<ProductionResponse>(`/archinve/productions/${id}`)


        // }
        // const production = await api.get<ProductionResponse>(`/archive/productions/${id}`)

        // api.get<ProductionResponse>(`/archive/productions/${id}`)
        //     .then( data => {
        //         setForm({
        //             content: {
        //                 nl: {title: data?.title?.nl, slug: '', content: data?.description?.nl},
        //                 en: {title: data?.title?.en, slug: '', content: data?.description?.en},
        //             },
        //             genres: [],
        //             artist: '',
        //             events: [],
        //             banner: '',
        //             extraPictures: []
        //         })
        //         setProd(data)
        //     })
        //     .catch( err => {
        //         console.error(err)
        //     })
    }, [id, create])

    const back = () => {
        navigate("/admin")
    }

    const publish = async () => {
        saveProduction(
            // false
        )
    }

    // const saveAsDraft = async () => {
    //     saveProduction(true)
    // }

    // Prodcution functions

    const saveProduction = async ( /* asDraft: boolean = false // Extra draft feature */ ) => {
        // TODO: an extra field is required in the schema for drafts
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
                    // isDraft: asDraft
                })

                // TODO: Use a slug
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
                    // isDraft: asDraft
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

    // const onChangeForm = (field: keyof ProductionContentFields, value: string) => {
    //     setForm(prev => ({
    //         ...prev,
    //         [languageTab]: { ...prev[languageTab] , [field]: value }
    //     }))
    // }

    // Adding a tag to a new or existing production
    const onAddProductionTag = (tagName?: string) => {
        const trimmed = (tagName || tagInput).trim()
        if (!trimmed) return
        
        // Case-insensitive check
        const exists = form.settings.tags.some(t => t.toLowerCase() === trimmed.toLowerCase())
        if (exists) return

        changeSettings('tags', [...form.settings.tags, trimmed])
        setTagInput('')
    }

    const onAddProductionGenre = (genreName?: string) => {
        const trimmed = (genreName || genreInput).trim()
        if (!trimmed) return

        // Case-insensitive check
        const exists = form.settings.genres.some(g => g.toLowerCase() === trimmed.toLowerCase())
        if (exists) return

        changeSettings('genres', [...form.settings.genres, trimmed])
        setGenreInput('')
    }
    
    // const onAddProductionGenre = () => {
    //     const trimmed = genreInput.trim()
    //     if (!trimmed || form.settings.genres.includes(trimmed)) return
    //     changeSettings('genres', [...form.settings.tags, trimmed])
    //     setGenreInput('')
    // }

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

    const onRemoveProductionTag = (tag: string) => {
        changeSettings('tags', form.settings.tags.filter(t => t !== tag))
    }

    const onRemoveProductionGenre = (genre: string) => {
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
        setEditingEvent(undefined) // creating a new event, so set to undefined
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
            // left here
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
                <ArchiveEditHeader
                    backLabel={messages.production.back}
                    publishLabel={messages.production.publish}
                    back={back}
                    publish={publish}   
                    // saveAsDraftLabel={messages.production.saveOnDraft}
                    // saveAsDraft={saveAsDraft}
                />
            }
            sidebar={
                <ArchiveSidebar
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
                title={messages.admin.archiveEdit.pageTitle}
                subTitle={`${messages.admin.archiveEdit.itemIdLabel} ${id}`}
            />

            {/* Tabs for english and dutch contents of a production */}
            <ArchiveTab
                language={languageTab}
                options={languageOptions}
                setTab={setTab}
            />

            <ArchiveTabContent
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

export default ArchiveEditPage