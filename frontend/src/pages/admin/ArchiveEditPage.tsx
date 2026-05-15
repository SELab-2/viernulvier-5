import ArchiveTabContent from '../../components/admin/ArchiveTabContent'
import ArchiveTab from '../../components/admin/ArchiveTab'
import AdminLayout from '../../components/admin/AdminLayout'
import SectionHeading from '../../components/admin/SectionHeading'
import EventsEdit from '../../components/admin/ManageEvents'

import type { Language, ProductionPayload, LocalizedText, ProductionPayloadRespone } from '../../types/production'
import type { Locale } from '../../i18n/types'
import type { Event, EventLinks } from '../../types/event'

import { useNavigate, useParams } from 'react-router-dom'
import { getMessages } from '../../i18n'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import EventPopup from '../../components/admin/EventPopup'
import ArchiveSidebar from '../../components/admin/ArchiveSidebar'
import ArchiveEditHeader from '../../components/admin/ArchiveEditHeader'
import { useLocale } from '../../components/admin/useLocale'
import { useTagInput } from '../../components/admin/hooks/useTagInput'

const defaultLocalizedText: LocalizedText = {
    nl: '',
    fr: '',
    en: '',
}

const defaultProduciton: ProductionPayload = {
    super_title: defaultLocalizedText,
    title: defaultLocalizedText,
    artist: defaultLocalizedText,
    teaser: defaultLocalizedText,
    description: defaultLocalizedText,
    description_2: defaultLocalizedText,
}

const basicFields: (keyof ProductionPayload)[] = [
    "super_title",
    "title",
    "artist",
    "teaser",
];

const descriptionFields: (keyof ProductionPayload)[] = [
    "description",
    "description_2"
];

const defaultEvent : Event = {
    key: '',
    starts_at: '',
    ends_at: '',
    production_id: '',
    hall_id: '',
    hall_name: {},
    links: {
        production: '',
        hall: ''
    }
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
function ArchiveEditPage() {
    const locale = useLocale().locale;
    const messages = getMessages(locale);
    const navigate = useNavigate();
    const { id } = useParams() // current production id

    const languageOptions: { key: Language, label: string}[] = [
        { key: 'nl', label: messages.production.dutchOption},
        { key: 'en', label: messages.production.englishOption},
    ]

    // ---- State ----

    // production state
    const [production, setProduction] = useState<ProductionPayload>(defaultProduciton);
    const [events, setEvents] = useState<Event[]>([]);
    const genreState = useTagInput();
    const tagState = useTagInput();
    const [editLanguage, setEditLanguage] = useState<Locale>('nl');
    const [editingEvent, setEditingEvent] = useState<Event>(defaultEvent) // currently selected event
    const editingEventHallState = useTagInput();

    const [popupOpen, setPopupOpen] = useState(false)

    // Visual indicators  TODO:
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // ---- API handeling ----

    // fetch production (does nothing when creating a production)
    useEffect(() => {
        if (!id) return;
        // TODO:
        // api.get<ProductionPayload>(`/archive/${id}`);
    }, [id]);
    
    // fetch events linked to production (does nothing when creating a production)
    useEffect(() => {
        if (!id) return;
        // TODO:
    }, [id]);

    const back = () => {
        navigate("/admin")
    }

    const save = async () => {
        if (!id){ 
            // create production
            try {
                const res: ProductionPayloadRespone = await api.post(`/archive/productions`, {
                    super_title: production.super_title,
                    title: production.title,
                    artist: production.artist,
                    teaser: production.teaser,
                    description: production.description,
                    description_2:  production.description_2,
                });

                const productionId = res.data.id;
                console.log(res, productionId);
            } catch (err) {
                console.error("Failed to save data: ", err);
            }

        } else { 
            // saving production 
            // TODO:
        }
    }

    const saveEvents = async (productionId: string) => {
        // TODO: figure out if you need EventLinks, by looking at the response
        // when creating an event
        Promise.all(events.map(e =>
            api.post('/archive/events', {
                starts_at: e.starts_at,
                ends_at: e.ends_at,
                production_id: productionId,
                hall_id: '' // TODO: figure out halls?
            })
        ));
    }


    // ---- Event manipulation functions ----

    // Add event to the event list
    const addEvent = () => {
        const hallItem = editingEventHallState.items[0];
        // Add hall Id and display name to Event
        const savingEvent = !hallItem ? editingEvent : {
            ...editingEvent,
            hall_id: hallItem.id,
            hall_name: hallItem.name
        }

        if(savingEvent?.key) {
            setEvents(events.map(e => e.key === savingEvent.key ?  {...savingEvent, key: e.key} : e));
        } else {
            setEvents([
                ...events,
                {
                    ...savingEvent,
                    key: crypto.randomUUID()
                }
            ]);
        }
        editingEventHallState.clear();
        setPopupOpen(false);
    }

    // Open the event create popup
    const makeEvent = () => {
        setEditingEvent(defaultEvent)
        setPopupOpen(true)
    }

    // edit event
    const editEvent = (key: string) => {
        const event = events.find(e => e.key === key);
        setEditingEvent(event ?? defaultEvent);
        // if hall_id is defined then also the hall_name
        if(event?.hall_id && event?.hall_name) editingEventHallState.add(event?.hall_id, event.hall_name);
        setPopupOpen(true);
    }
    
    // remove events from the event list
    const removeEvent = (key: string) => {
        setEvents(events.filter(e => e.key !== key));
    }


    // Change the fields of the currently selected event
    const onChangeEditingEvent = (field: keyof Event | keyof EventLinks, value: string) => {
        setEditingEvent(prev => ({
            ...prev,
            [field]: value
        }))
    }
    

    // ---- Production manipulation functions ----
    
    // Change the fields of a production (e.g. title, super title, artist, teaser, ...)
    const onChangeContent = (field: keyof ProductionPayload, lang: Locale, value: string) => {
        setProduction(prev => ({
            ...prev,
            [field] : {
                ...prev[field],
                [lang]: value
            }
        }))
    }

    return (
        <AdminLayout>   
            <ArchiveEditHeader
                backLabel={messages.production.back}
                publishLabel={messages.production.publish}
                back={back}
                publish={save}   
            />

            <div className='flex'>
                <div className='flex-1 overflow-hidden'>
                    <SectionHeading
                        title={messages.production.productionEditTitle}
                        subTitle={messages.production.productionEditSubTitle}
                    />

                    {/* Tabs for english and dutch contents of a production */}
                    <ArchiveTab
                        language={editLanguage}
                        options={languageOptions}
                        setTab={setEditLanguage}
                    />

                    <ArchiveTabContent
                        production={production}
                        basicFields={basicFields}
                        descriptionFields={descriptionFields}
                        editLanguage={editLanguage}
                        onChange={onChangeContent}
                        
                        contentLabels={messages.production.contentLabels}
                    />

                    <SectionHeading
                        title={messages.production.eventsEditTitle}
                        subTitle={messages.production.eventsEditSubTitle}
                    />

                    <EventsEdit
                        events={events}
                        makeEvent={makeEvent}
                        editEvent={editEvent}
                        deleteEvent={removeEvent}

                        makeLabel={messages.production.makeEventsLabel}
                        dateLabel={messages.production.eventsDateLabel}
                        timeLabel={messages.production.eventsTimeLabel}
                        locationLabel={messages.production.eventsLocationLabel}
                        commentLabel={messages.production.eventsCommentLabel}
                        actionsLabel={messages.production.eventsActionsLabel}
                    />
                </div>

                <ArchiveSidebar
                    genre={genreState}
                    tag={tagState}

                    productionSettingsLabel={messages.production.productionSettingsLabel}
                    genreLabel={messages.production.genreLabel}
                    tagLabel={messages.production.tagLabel}
                    bannerLabel={messages.production.bannerLabel}
                    extraPicturesLabel={messages.production.extraPicturesLabel}
                    addGenrePlaceholder={messages.production.addGenrePlaceholder}
                    addTagPlaceholder={messages.production.addTagPlaceholder}
                    chooseFilePlaceholder={messages.production.chooseFilePlaceholder}
                />
            </div>

            {popupOpen && (
                <EventPopup
                    fields={editingEvent}
                    hall={editingEventHallState}
                    isEdit={editingEvent !== undefined}
                    onSave={addEvent}
                    onClose={() => {
                        setPopupOpen(false);
                        editingEventHallState.clear();
                    }}
                    onChange={onChangeEditingEvent}

                    saveButtonLabel={messages.event.saveButtonLabel}
                    editLabel={messages.event.editLabel}
                    addLabel={messages.event.addLabel}
                    timeLabel={messages.event.timeLabel}
                    locationLabel={messages.event.locationLabel}
                    commentLabel={messages.event.commentLabel}
                />
            )}
        </AdminLayout>
    )
}

export default ArchiveEditPage
