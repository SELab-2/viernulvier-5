import ProductionContentTab from '../../components/admin/ProductionTabContent'
import ProductionTab from '../../components/admin/ProductionTab'
import AdminLayout from '../../components/admin/AdminLayout'
import SectionHeading from '../../components/admin/SectionHeading'
import EventsEdit from '../../components/admin/ManageEvents'

import type { Language, ProductionContent, ProductionFields } from '../../types/production'
import type { Locale } from '../../i18n/types'
import type { Event, EventForm } from '../../types/event'
import type { ProductionResponse } from '../../../../backend/src/modules/productions/productions.schema'
import type { LocationResponse } from '../../../../backend/src/modules/locations/locations.schema'

import { useNavigate, useParams } from 'react-router-dom'
import { getMessages } from '../../i18n'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import EventPopup from '../../components/admin/EventPopup'
import ProductionSidebar from '../../components/admin/ProductionSidebar'
import ProductionEditHeader from '../../components/admin/ProductionEditHeader'

const defaultForm : ProductionContent = {
    nl: {title: '', slug: '', content: ''},
    en: {title: '', slug: '', content: ''}
}

const defaultEventForm : EventForm = {
    startDateTime: '',
    endDateTime: '',
    location: '',
    tags: []
}

const defaultEvents: Event[] = []

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
    const messages = getMessages()
    const navigate = useNavigate()
    const { id } = useParams()          // current production id

    // Production state
    const [prod, setProd] = useState<ProductionResponse>()
    const [languageTab, setLanguageTab] = useState<Locale>('nl')
    const [form, setForm] = useState<ProductionContent>(defaultForm)
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])
    
    // Event state
    const [popupOpen, setPopupOpen] = useState(false)
    const [events, setEvents] = useState<Event[]>(defaultEvents)
    const [editingEvent, setEditingEvent] = useState<Event | undefined>()
    const [eventForm, setEventForm] = useState<EventForm>(defaultEventForm)
    const [eventTagInput, setEventTagInput] = useState('')

    const languageOptions: { key: Language, label: string}[] = [
        { key: 'nl', label: messages.production.dutchOption},
        { key: 'en', label: messages.production.englishOption},
    ]

    // Load all data of an existing production or create a new one
    useEffect(() => {
        api.get<LocationResponse>(`/archive/locations`)
            .then()
            .catch()
        if (create) return 

        // TODO: make use of the slug
        api.get<ProductionResponse>(`/archive/productions/${id}`)
            .then( data => {
                setForm({
                    nl: {title: data?.title?.nl, slug: '', content: data?.description?.nl},
                    en: {title: data?.title?.en, slug: '', content: data?.description?.en},
                })
                setProd(data)
            })
            .catch( err => {
                console.error(err)
            })
    }, [id])

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
                        nl: form.nl.title,
                        en: form.en.title,
                    },
                    description: {
                        nl: form.nl.content,
                        en: form.en.content,
                    },
                    // isDraft: asDraft
                })

                // TODO: Use a slug
                navigate(`/admin/productions/${res.id}/edit`, { replace: true })
            } else {
                await api.put(`/archive/productions/${id}`, {
                    title: {
                        nl: form.nl.title,
                        en: form.en.title,
                    },
                    description: {
                        nl: form.nl.content,
                        en: form.en.content,
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

    const onChangeForm = (field: keyof ProductionFields, value: string) => {
        setForm(prev => ({
            ...prev,
            [languageTab]: { ...prev[languageTab] , [field]: value }
        }))
    }

    // Adding a tag to a new or existing production
    const onAddTag = () => {
        const trimmed = tagInput.trim()
        if (!trimmed || tags.includes(trimmed)) return  
        setTags(prev => [...prev, trimmed])
        setTagInput('')
    }

    // Adding a tag to a new or existing event
    const onAddEventTag = () => {
        const trimmed = eventTagInput.trim()
        if(!trimmed || eventForm.tags.includes(trimmed)) return
        setEventForm(prev => ({...prev, tags: [...prev.tags, trimmed]}))
        setEventTagInput('')
    }

    const onChangeProductionTagInput = (tag: string) => {
        setTagInput(tag)
    }

    const onRemoveProductionTag = (tag: string) => {
        setTags(prev => prev.filter(e => e !== tag))
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
        const event = events.find(e => e.key === key)
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
        setEvents(prev => prev.filter(e => e.key !== key))
    }

    const saveEvent = () => {
        if (editingEvent) {
            setEvents(prev => prev.map(e => e.key === editingEvent.key
                ? { ...eventForm, key: e.key } : e
            ))
        } else {
            setEvents(prev => [...prev, {...eventForm, key: crypto.randomUUID()}])
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
                    // saveAsDraftLabel={messages.production.saveOnDraft}
                    // saveAsDraft={saveAsDraft}
                />
            }
            sidebar={
                <ProductionSidebar
                    tag={tagInput}
                    tags={tags}
                    onAddTag={onAddTag}
                    onChangeTag={onChangeProductionTagInput}
                    onRemoveTag={onRemoveProductionTag}

                    productionSettingsLabel={messages.production.productionSettingsLabel}
                    statusLabel={messages.production.statusLabel}
                    genreLabel={messages.production.genreLabel}
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

            <ProductionContentTab
                fields={form[languageTab]}
                onChange={onChangeForm}

                titleLabel={messages.production.title}
                slugLabel={messages.production.slug}
                contentLabel={messages.production.content}
            />

            <SectionHeading
                title={messages.production.eventsEditTitle}
                subTitle={messages.production.eventsEditSubTitle}
            />

            <EventsEdit
                events={events}
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