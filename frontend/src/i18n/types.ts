export type Locale = 'nl' | 'en'

export type Messages = {
  common: {
    loading: string
  }
  nav: {
    home: string
    archive: string
    searchAriaLabel: string
    searchPlaceholder: string
  }
  home: {
    title: string
    intro: string
    heroTagline: string
    heroTitleTop: string
    heroTitleAccent: string
    heroTitleBottom: string
    searchYear: string
    searchGenre: string
    searchLocation: string
    searchButton: string
    popularTagsLabel: string
    popularTagsMore: string
    popularTags: string[]
    latestBlogHeading: string
    latestBlogSubheading: string
    latestBlogTitle: string
    latestBlogParagraphOne: string
    latestBlogParagraphTwoTitle: string
    latestBlogParagraphTwo: string
    latestBlogReadMore: string
    latestBlogViewAll: string
    recentDigitizedHeading: string
    recentDigitizedViewItem: string
    recentDigitizedViewAll: string
    recentDigitizedItems: Array<{
      dateLabel: string
      archiveLabel: string
      title: string
      description: string
    }>
  }
  auth: {
    loginTitle: string
    usernameLabel: string
    passwordLabel: string
    submit: string
    loginFailed: string
  }
  production: {
      // sidbar
      productionSettingsLabel: string
      statusLabel: string
      genreLabel: string
      bannerLabel: string
      extraPicturesLabel: string
      artistLabel: string
      // production edit
      productionEditTitle: string
      productionEditSubTitle: string
      // tab tabs
      dutchOption: string
      englishOption: string
      // tab content
      title: string
      slug: string
      content: string
      back: string
      saveOnDraft: string
      publish: string
      // events edit
      eventsEditTitle: string
      eventsEditSubTitle: string
      makeEventsLabel: string
      eventsDateLabel: string
      eventsTimeLabel: string
      eventsLocationLabel: string
      eventsCommentLabel: string
      eventsActionsLabel: string
  }
  footer: {
    about: string
    navigationTitle: string
    navHome: string
    navAgenda: string
    navArchiveSearch: string
    navAbout: string
    contactTitle: string
    newsletterTitle: string
    newsletterText: string
    newsletterPlaceholder: string
    newsletterSubmit: string
    privacy: string
    cookies: string
    disclaimer: string
    rights: string
  }
}
