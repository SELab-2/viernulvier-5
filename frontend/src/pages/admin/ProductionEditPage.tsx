import ProductionContentTab from '../../components/admin/ProductionTabContent'
import ProductionTab from '../../components/admin/ProductionTab'
import AdminLayout from '../../components/admin/AdminLayout'
import SectionHeading from '../../components/admin/SectionHeading'
import EventsEdit from '../../components/admin/ManageEvents'

import type { Language, ProductionContent, ProductionFields } from '../../types/production'
import type { Locale } from '../../i18n/types'
import type { Event } from '../../types/event'

import { useLocation, useNavigate } from 'react-router-dom'
import { getMessages } from '../../i18n'
import { useState } from 'react'
import EventPopup from '../../components/admin/EventPopup'


const defaultForm : ProductionContent = {
    nl: {title: '', slug: '', content: ''},
    en: {title: '', slug: '', content: ''}
}

/**
 * Amin page for editing or creating a production
 */
function ProductionEditPage() {
    const messages = getMessages()
    const navigate = useNavigate()

    // TODO: for now this is fine but later we want maybe variable length language tabs...
    const [languageTab, setLanguageTab] = useState<Locale>('nl')
    const [form, setForm] = useState<ProductionContent>(defaultForm)
    const [slug, setSlug] = useState("")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")

    const languageOptions: { key: Language, label: string}[] = [
        { key: 'nl', label: messages.production.dutchOption},
        { key: 'en', label: messages.production.englishOption},
    ]

    const back = () => {
        navigate("/admin")
    }
    
    const saveAsDraft = () => {
        // TODO: save as draft impl.
    }

    const publish = () => {
        // TODO: publish impl.
    }

    const setTab = (key: Locale) => {
        setLanguageTab(key)

        // TODO: proper impl 
    }

    const changeTitle = (value: string) => {
        setTitle(value)
    }

    const changeSlug = (value: string) => {
        setSlug(value)
    }
    
    const changeContent = (value: string) => {
        setContent(value)
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

    const changeLanguage = (field: keyof ProductionFields, value: string) => {
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
            title={messages.home.title}
            productionSettingsLabel={messages.production.productionSettingsLabel}
            archiveLabel={messages.nav.archive}
            searchAriaLabel={messages.nav.searchAriaLabel}
            searchPlaceholder={messages.nav.searchPlaceholder}
            statusLabel={messages.production.statusLabel}
            genreLabel={messages.production.genreLabel}
            bannerLabel={messages.production.bannerLabel}
            extraPicturesLabel={messages.production.extraPicturesLabel}
            artistLabel={messages.production.artistLabel}
            backLabel={messages.production.back}
            saveAsDraftLabel={messages.production.saveOnDraft}
            publishLabel={messages.production.publish}
            back={back}
            saveAsDraft={saveAsDraft}
            publish={publish}   
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
                title={title}
                slug={slug}
                content={content}
                currentTab={form}
                changeLanguage={changeLanguage}
                changeTitle={changeTitle}
                changeSlug={changeSlug}
                changeContent={changeContent}
                fields={form[languageTab]}

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