import ProductionContentTab from '../../components/admin/ProductionTabContent'
import ProductionTab from '../../components/admin/ProductionTab'
import AdminLayout from '../../components/admin/AdminLayout'
import SectionHeading from '../../components/admin/SectionHeading'
import EventsEdit from '../../components/admin/ManageEvents'

import type { Language, ProductionContent, ProductionFields } from '../../types/production'
import type { Locale } from '../../i18n/types'
import type { Event } from '../../types/event'
import type { ProductionResponse } from '../../../../backend/src/modules/productions/productions.schema'

import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
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

    // TODO: for now this is fine but later we want maybe variable length language tabs...
    const [prod, setProd] = useState<ProductionResponse>()
    const [languageTab, setLanguageTab] = useState<Locale>('nl')
    const [form, setForm] = useState<ProductionContent>(defaultForm)

    const languageOptions: { key: Language, label: string}[] = [
        { key: 'nl', label: messages.production.dutchOption},
        { key: 'en', label: messages.production.englishOption},
    ]

    useEffect(() => {
        if (create) return 

        // TODO: make use of the slug
        api.get<ProductionResponse>(`/archive/productions/${id}`)
            .then( data => {
                console.log(data)
                // slug is redundant? only if we just how them how it looks?
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

    const saveProduction = async (asDraft: boolean = false) => {
        // TODO: an extra field is required in the prisma schema for drafts
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
    
    const saveAsDraft = async () => {
        saveProduction(true)
    }

    const publish = () => {
        saveProduction(false)
    }

    const setTab = (key: Locale) => {
        setLanguageTab(key)

        // TODO: proper impl 
    }

    const makeEvent = () => {
        // TODO: impl
        console.log("Making event")
    }

    const editEvent = () => {
        // TODO: impl
        console.log("editing event")
    }

    const deleteEvent = () => {
        // TODO: impl
        console.log("deleting event")
    }

    const onChangeForm = (field: keyof ProductionFields, value: string) => {
        setForm(prev => ({
            ...prev,
            [languageTab]: { ...prev[languageTab] , [field]: value }
        }))
        // TODO: change field into a proper type ?
    }

    const placeholderEvents: Event[] = [
        { key: "1", date: "01-10-2016", time: "15:45", location: "Viernulvier", comment: "yes"},
        { key: "2", date: "06-10-2016", time: "10:15", location: "Viernulvier", comment: "no"},
        { key: "3", date: "12-10-2016", time: "16:00", location: "Viernulvier", comment: "maybe"}
    ]

    return (
        <AdminLayout
            header={
                <ProductionEditHeader
                    backLabel={messages.production.back}
                    saveAsDraftLabel={messages.production.saveOnDraft}
                    publishLabel={messages.production.publish}
                    back={back}
                    saveAsDraft={saveAsDraft}
                    publish={publish}   
                />
            }
            sidebar={
                <ProductionSidebar
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
                events={placeholderEvents}
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

            {/* <EventPopup>

            </EventPopup> */}
        </AdminLayout>
    )
}

export default ProductionEditPage