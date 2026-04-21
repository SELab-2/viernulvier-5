export type Locale = 'nl' | 'en'

export type Messages = {
  common: {
    loading: string
    brandName: string
    brandLogoAlt: string
  }
  nav: {
    home: string
    archive: string
    searchAriaLabel: string
    searchPlaceholder: string
    navAriaLabel: string
    openMenuLabel: string
    closeMenuLabel: string
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
    onThisDayHeading: string
    onThisDaySubheading: string
    onThisDayViewAll: string
    onThisDayEmpty: string
    onThisDayFallbackHeading: string
    onThisDayFallbackSubheading: string
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
  search: {
    heading: string
    subtitle: string
    productionsTab: string
    blogTab: string
    resultsCount: string
    resultsSuffix: string
    sortLabel: string
    sortDefault: string
    sortRecent: string
    sortOldest: string
    shareLabel: string
    shareCopiedLabel: string
    filterOpenLabel: string
    filterCloseLabel: string
    filterCloseOverlayLabel: string
    noResults: string
    loadErrorPrefix: string
    activeFilterTags: string[]
    searchPlaceholder: string
    fallbackUntitled: string
    fallbackTag: string
    fallbackVenue: string
    resultsPerPageAriaLabel: string
    resultsPerPageSuffix: string
    loadingStatusLabel: string
    loadingQuotes: string[]
    genreLabel: string
    genres: string[]
    periodLabel: string
    periodMin: string
    periodCurrent: string
    periodMax: string
    locationLabel: string
    locationSearchPlaceholder: string
    addLocationLabel: string
    locations: string[]
    resetFiltersLabel: string
    paginationPrevious: string
    paginationNext: string
  }
  auth: {
    localeToggleLabel: string
    darkModeLabel: string
    lightModeLabel: string
    adminLabel: string
    loginTitle: string
    loginSubtitle: string
    usernameLabel: string
    usernamePlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    rememberMeLabel: string
    submit: string
    submitting: string
    loginFailed: string
    invalidCredentials: string
    rateLimitReached: string
    navigationTitle: string
    dashboardLabel: string
    dashboardTitle: string
    dashboardDescription: string
    productionsLabel: string
    statisticsLabel: string
    archiveLabel: string
    logoutLabel: string
  }
  footer: {
    brandLogoAlt: string
    organizationName: string
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
  admin: {
    themeToggleDark: string
    themeToggleLight: string
    localeToggleAriaLabel: string
    openSidebarLabel: string
    closeSidebarLabel: string
    navigationDrawerLabel: string
    nav: {
      dashboard: string
      productions: string
      gallery: string
      organisation: string
      settings: string
      dashboardIconAlt: string
      productionsIconAlt: string
      galleryIconAlt: string
      organisationIconAlt: string
      settingsIconAlt: string
    }
    dashboard: {
      pageTitle: string
      pageSubtitle: string
      pageNote: string
      loadingMessage: string
      recentlyEdited: string
      tableColTitle: string
      tableColType: string
      tableColStatus: string
      tableColLanguage: string
      tableColDate: string
      tableColActions: string
      statusAvailable: string
      actionView: string
      actionEdit: string
      emptyRecent: string
      paginationShowing: (from: number, to: number, total: number) => string
      paginationPrev: string
      paginationNext: string
      notSyncedYet: string
      lastSync: string
      syncStatusPending: string
      visitorsPlaceholder: string
      visitorsNote: string
      visitorsChange: string
      editorsActive: (count: number) => string
      statProductions: string
      statBlogConcepts: string
      statVisitors: string
      statMediaItems: string
      deltaVsLastMonth: string
      statLastSync: string
      statSyncPending: string
      languageStatusComplete: string
      languageStatusAttention: string
      languageStatusMissing: string
      pageSizeLabel: string
      pageSizeAuto: string
    }
    archiveEdit: {
      pageTitle: string
      itemIdLabel: string
    }
  }

  editHeader: {
    back: string
    publish: string
    saveOnDraft: string
  }

  blogs: {
    dutchOption:string
    englishOption:string
    title: string
    content: string
    editBlogTitle: string
    editBlogDescription: string
    createBlogTitle: string
    createBlogDescription: string
    manageProduction: string
    manageProductionButton: string
    savingButton: string
    deletingButton: string
    deleteButton: string
    deleteConfirm: string
    deleteError: string
    blogNotFound: string
    noTitleError:string
    filledLanguageNeedsTitleError: string

    productionPopUp : {
      title:string
      cancelButton: string
      addButton: string
      close: string
      queryHint: string
      noProductionFound:string
    }
  }
}
