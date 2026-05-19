import ArchiveTabContent from '../../components/admin/ArchiveTabContent'
import ArchiveTab from '../../components/admin/ArchiveTab'
import AdminLayout from '../../components/admin/AdminLayout'
import SectionHeading from '../../components/admin/SectionHeading'
import EventsEdit from '../../components/admin/ManageEvents'

import type { Language, ProductionPayload, LocalizedText, ProductionPayloadRespone } from '../../types/production'
import type { Locale } from '../../i18n/types'
import type { Event, EventPayload, EventPayloadRepsone } from '../../types/event'

import { useNavigate, useParams } from 'react-router-dom'
import { getMessages } from '../../i18n'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import EventPopup from '../../components/admin/EventPopup'
import ArchiveSidebar from '../../components/admin/ArchiveSidebar'
import ArchiveEditHeader from '../../components/admin/ArchiveEditHeader'
import { useLocale } from '../../components/admin/useLocale'
import { useTagInput } from '../../components/admin/hooks/useTagInput'
import { getGenresByProductionId } from '../../api/genres'
import { getTagsByProductionId } from '../../api/tags'
import { loadGallerySlots, saveGallerySlots, type ImageSlot } from '../../api/media'
import { createLocation } from '../../api/locations'
import { createSpace } from '../../api/spaces'
import { createHall } from '../../api/halls'
import {useOptionalAdminSession} from "../../auth/useAdminSessionContext.ts";

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
];

const descriptionFields: (keyof ProductionPayload)[] = [
    "teaser",
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
}

// Convert the backend datetime YYYY-MM-DDTHH:mm:ss.sssZ to YYYY-MM-DDTHH:mm
const convertDateTime = (dateTime?: string) => {
    if (!dateTime) return '';
    return dateTime.slice(0, 16);
}

const REQUIRED_FIELDS: (keyof ProductionPayload)[] = ['title', 'super_title', 'artist', 'description'];


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
    const session = useOptionalAdminSession()
    const currentUser = session?.user

    const languageOptions: { key: Language, label: string}[] = [
        { key: 'nl', label: messages?.production?.dutchOption ?? 'Dutch' },
        { key: 'en', label: messages?.production?.englishOption ?? 'English' },
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
    const [deletedEventsIds, setDeletedEventsIds] = useState<string[]>([]);
    const [popupOpen, setPopupOpen] = useState(false)

    const [galleryId, setGalleryId] = useState<string | undefined>(undefined);
    const [bannerSlot, setBannerSlot ] = useState<ImageSlot | null>(null);
    const [extraSlots, setExtraSlots] = useState<ImageSlot[]>([]);
    const [removedCropIds, setRemovedCropIds] = useState<string[]>([]);
    const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

    // Visual indicators
    const [saving, setSaving] = useState(false);
    const [saveAction, setSaveAction] = useState<'publish' | 'draft' | null>(null)
    const [error, setError] = useState<string | null>(null);


    // ---- API handeling ----

    // fetch production (does nothing when creating a production)
    useEffect(() => {
        if (!id) return;

        const fetchProduction = async () => {
            try {
                const response = await api.get<ProductionPayloadRespone>(`/archive/productions/${id}`);
                setProduction(response.data);
        
                // fetch genres
                const genreResponse = await getGenresByProductionId(id);
                for (const g of genreResponse.data) {
                    genreState.add(g.id, g.name)
                }
                
                // fetch tags
                const tagResponse = await getTagsByProductionId(id);
                for (const t of tagResponse.data) {
                    tagState.add(t.id, t.name)
                }

                // TODO: fetch banner and pictures
                const mediaGalleryId = (response.data as {media_gallery_id?: string}).media_gallery_id;
                
                if(mediaGalleryId) {
                    setGalleryId(mediaGalleryId);
                    const { banner, extras } = await loadGallerySlots(mediaGalleryId)

                    if (banner) setBannerSlot(banner);
                    setExtraSlots(extras)
                }
            } catch (err) {
                setError("Failed to load production: " + err)
            }
        }
        fetchProduction();
    
    // HACK: maybe find another way to fetch genres and tags, without disabling eslint
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    
    // fetch events linked to production (does nothing when creating a production)
    useEffect(() => {
        if (!id) return;
        const fetchEvents = async () => {
            try {
                const res = await api.get<{ data: EventPayloadRepsone[] }>(`/archive/events?productionId=${id}`);

                // Filter all unique hall_id's
                const hallIds = [...new Set(
                    res.data.map(e => e.hall_id).filter(Boolean)
                )] as string[];

                const halls = await Promise.all(
                    hallIds.map(async id => {
                        const hall = await api.get<{data: {id: string, name: LocalizedText}}>(`/archive/halls/${id}`);
                        return {id: hall.data.id, name: hall.data.name};
                    })
                );

                const mapped = res.data.map(e => ({
                    id: e.id,
                    key: e.id ?? crypto.randomUUID(),
                    production_id: e.production_id,
                    starts_at: convertDateTime(e.starts_at),
                    ends_at: convertDateTime(e.ends_at),
                    hall_id: e.hall_id,
                    hall_name: halls.find(h => h.id === e.hall_id)?.name,
                    info: e.info?.['en'] ?? e.info?.['nl'] ?? ''
                }));

                setEvents(mapped);
            } catch (err) {
                setError("Failed to load production Events: " + err)
            }
        }

        fetchEvents();
    }, [id]);

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
 
        // Check required localized fields in each required language
        for (const field of REQUIRED_FIELDS) {
            const value = production?.[field]?.['nl'];
            if (!value) {
                errors[`${field}_nl`] = `"${field}" (nl) is required in a language`;
            }
        }
        
        if (Object.keys(errors).length !== 0) {
            for (const field of REQUIRED_FIELDS) {
                const value = production?.[field]?.['en'];
                if (!value) {
                    errors[`${field}_en`] = `"${field}" (en) is required in a language`;
                }
            }
        }
        
        return Object.keys(errors).length === 0;
    }

    const save = async (asDraft = false) => {
        if (saving) return;
        setError(null);

        if (!validate()) {
            setError(messages.production.invalidProductionError + "(" +  REQUIRED_FIELDS.join(', ') +")");
            return;
        }

        setSaving(true);
        setSaveAction(asDraft ? 'draft' : 'publish')

        try {
            // in case anything fails rollback changes
            const createdEventIds: string[] = [];

            if (!id){ 
                const newGalleryId = await saveGallerySlots({
                    galleryId: undefined,
                    banner: bannerSlot,
                    extras: extraSlots,
                    removedCropIds: [],
                    removedItemIds: []
                });


                // create production
                const res: ProductionPayloadRespone = await api.post(`/archive/productions`, {
                    super_title: production.super_title,
                    title: production.title,
                    artist: production.artist,
                    teaser: production.teaser,
                    description: production.description,
                    description_2:  production.description_2,
                    genre_ids: genreState.items.map(g => g.id),
                    tag_ids: tagState.items.map(t => t.id),
                    draft: asDraft,
                    media_gallery_id: newGalleryId,
                });

                const productionId = res.data.id;

                // add editor
                try {
                    if (currentUser) {
                        await api.post(`/archive/productions/${productionId}/editors`, {
                            editorId: currentUser.id,
                        })
                    }
                } catch (error) {
                    if (!(error instanceof Error && error.message.includes('409'))) {
                        console.log(error)
                    }
                }
                
                try {
                    for (const e of events) {
                        // Post new events 
                        const eventRes = await api.post<EventPayload>('/archive/events', {
                            starts_at: e.starts_at,
                            ends_at: e.ends_at,
                            production_id: productionId,
                            hall_id: e.hall_id,
                            info: {en: e.info, nl: e.info}
                        });

                        createdEventIds.push(eventRes.data.id);
                    }
                } catch (err) {
                    await Promise.allSettled(createdEventIds.map(
                        id => api.delete(`/archive/events/${id}`)
                    ));

                    await api.delete(`/archive/productions/${productionId}`)
                    throw err;
                }

                navigate(asDraft ? '/admin/drafts/productions' : `/archive/${productionId}`)
            } else { 
                
                const updateGalleryId = await saveGallerySlots({
                    galleryId,
                    banner: bannerSlot,
                    extras: extraSlots,
                    removedCropIds,
                    removedItemIds
                })

                // saving production 
                await api.patch(`/archive/productions/${id}`, {
                    super_title: production.super_title,
                    title: production.title,
                    artist: production.artist,
                    teaser: production.teaser,
                    description: production.description,
                    description_2:  production.description_2,
                    genre_ids: genreState.items.map(g => g.id),
                    tag_ids: tagState.items.map(t => t.id),
                    draft: asDraft,
                    media_gallery_id: updateGalleryId
                });

                // add editor
                try {
                    if (currentUser) {
                        await api.post(`/archive/productions/${id}/editors`, {
                            editorId: currentUser.id,
                        })
                    }
                } catch (error) {
                    if (!(error instanceof Error && error.message.includes('409'))) {
                        console.log(error)
                    }
                }
                
                // save events changes
                await Promise.all(deletedEventsIds.map(id => api.delete(`/archive/events/${id}`)));
                setDeletedEventsIds([]);

                try {
                    for (const e of events) {
                        if(e.id) {
                            // Patch existing events
                            await api.patch<EventPayload>(`/archive/events/${e.id}`, {
                                starts_at: e.starts_at,
                                ends_at: e.ends_at,
                                hall_id: e.hall_id,
                                info: {en: e.info, nl: e.info}
                            });
                        } else {
                            // Post new events 
                            const eventRes = await api.post<EventPayload>('/archive/events', {
                                starts_at: e.starts_at,
                                ends_at: e.ends_at,
                                production_id: id,
                                hall_id: e.hall_id,
                                info: {en: e.info, nl: e.info}
                            });

                            createdEventIds.push(eventRes.data.id);
                        }
                    }

                    navigate(asDraft ? '/admin/drafts/productions' : `/archive/${id}`)
                } catch (err) {
                    // Rollback newly created events, keep the previous ones
                    await Promise.allSettled(createdEventIds.map(
                        id => api.delete(`/archive/events/${id}`)
                    ));

                    throw err;
                }
            }

        } catch (err){
            setError("Failed to create the production or events: " + err);
        } finally {
            setSaving(false);
            setSaveAction(null);
        }
    }

    // ---- image slot manipulation functions ----

    const handleBannerChange = (slot: ImageSlot | null) => {
        if (bannerSlot?.kind === 'existing') {
            setRemovedCropIds(prev => [...prev, bannerSlot.crop_id])
            setRemovedItemIds(prev => [...prev, bannerSlot.item_id])
        }

        setBannerSlot(slot)
    }

    const handleExtraSlotsChange = (nextSlots: ImageSlot[]) => {
        const removeSlots = extraSlots.filter(
            s => s.kind === 'existing' && !nextSlots.some(
                ns => ns.kind === 'existing' && ns.crop_id === s.crop_id
            )
        ) as Extract<ImageSlot, {kind: 'existing'}>[]

        if (removeSlots.length) {
            setRemovedCropIds(prev => [...prev, ...removeSlots.map(s => s.crop_id)])
            setRemovedItemIds(prev => [...prev, ...removeSlots.map(s => s.item_id)])
        }

        setExtraSlots(nextSlots)
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
        editingEventHallState.clear();
        setEditingEvent(event ?? defaultEvent);
        // if hall_id is defined then also the hall_name
        if(event?.hall_id && event?.hall_name) editingEventHallState.add(event?.hall_id, event.hall_name);
        setPopupOpen(true);
    }
    
    // remove events from the event list
    const removeEvent = (key: string) => {
        const event = events.find(e => e.key === key);
        
        if(event?.id) {
            setDeletedEventsIds(prev => [...prev, event.id!])
        }
        setEvents(events.filter(e => e.key !== key));
    }


    // Change the fields of the currently selected event
    const onChangeEditingEvent = (field: keyof Event, value: string) => {
        setEditingEvent(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const createEventLocation = async (name: string, address: string) => {
        const trimmedName = name.trim()
        const trimmedAddress = address.trim()

        const localizedName = { nl: trimmedName }

        const locationRes = await createLocation({
            name: localizedName,
            street: trimmedAddress,
        })

        const spaceRes = await createSpace({
            name: localizedName,
            location_id: locationRes.data.id,
        })

        const hallRes = await createHall({
            name: localizedName,
            space_id: spaceRes.data.id,
        })

        editingEventHallState.clear()
        editingEventHallState.add(hallRes.data.id, hallRes.data.name)
    }
    

    // ---- Production manipulation functions ----
    
    // Change the fields of a production (e.g. title, super title, artist, teaser, ...)
    const onChangeContent = (field: keyof ProductionPayload, lang: Locale, value: string) => {

        // clear validation error
        setError(null);

        setProduction(prev => ({
            ...prev,
            [field] : {
                ...prev[field],
                [lang]: value
            }
        }))
    }

    return (
        <AdminLayout showSidebar>   
            <ArchiveEditHeader
                publish={save}
                saveAsDraft={() => save(true)}
                saveAsDraftLabel={messages.production.saveOnDraft}
                publishLabel={messages.production.publish}
                saving={saving}
                saveAction={saveAction}
            />

            <div className='flex'>
                <div className='flex-1 overflow-hidden'>

                    {error && (
                        <div className="mx-4 mt-4 flex items-start gap-3 rounded-md border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                        <button
                            className="ml-auto text-red-500 hover:text-red-700"
                            onClick={() => setError(null)}
                            aria-label="Dismiss"
                        >
                            ✕
                        </button>
                        </div>
                    )}
                    
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
                    bannerSlot={bannerSlot}
                    extraSlots={extraSlots}
                    onBannerChange={handleBannerChange}
                    onExtraSlotsChange={handleExtraSlotsChange}
                    
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
                    onCreateLocation={createEventLocation}
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
