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
    searchLink: string
    blogsLink: string
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
    postersTab: string
    blogTab: string
    allTab: string
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
    locationLabel: string
    locationSearchPlaceholder: string
    addLocationLabel: string
    locations: string[]
    resetFiltersLabel: string
    paginationPrevious: string
    paginationNext: string
    relatedFilesCount: (count: number) => string
    stampSvgPaths: {
      days: { singular: string; plural: string }
      months: { singular: string; plural: string }
      years: { singular: string; plural: string }
    }
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
  detail: {
    navBack: string
    events: string
    noEvents: string
    loadError: string
    posterNotFound: string
    posterLoadError: string
    loadingPoster: string
    backToSearch: string
    relatedProductions: string
    noLinkedProduction: string
    date: string
    time: string
    location: string
    remark: string
    showLess: string
    showMore: string
    credits: string
    genresAndTags: string
    previousImage: string
    nextImage: string
    relatedBlogs: string
  }
  notFound: {
    titleTop: string
    titleAccent: string
    titleBottom: string
    joke: string
    description: string
    homeButton: string
    searchButton: string
  }
  footer: {
    brandLogoAlt: string
    organizationName: string
    about: string
    navigationTitle: string
    navHome: string
    navBlogs: string
    navAgenda: string
    navArchiveSearch: string
    navAbout: string
    contactTitle: string
    addressLine1: string
    addressLine2: string
    phone: string
    email: string
    vatNumber: string
    socialTitle: string
    stayUpdatedCta: string
    newsletterTitle: string
    newsletterText: string
    newsletterPlaceholder: string
    newsletterSubmit: string
    privacy: string
    cookies: string
    disclaimer: string
    privacyAndCookies: string
    rights: (year: number) => string
  }
  settings: {
    title: string
    subtitle: string
    closeAriaLabel: string
    tabAccount: string
    tabEditors: string
    accountSectionTitle: string
    usernameLabel: string
    usernameHint: string
    saveButton: string
    saving: string
    securitySectionTitle: string
    securityHint: string
    changePasswordButton: string
    currentPasswordLabel: string
    newPasswordLabel: string
    confirmPasswordLabel: string
    savePasswordButton: string
    savingPassword: string
    cancelButton: string
    passwordMismatchError: string
    accountSavedSuccess: string
    accountSaveError: string
    passwordChangedSuccess: string
    passwordChangeError: string
    editorsSectionTitle: string
    editorsLoadError: string
    noEditorsTitle: string
    noEditorsHint: string
    clickToManageHint: string
    newEditorTitle: string
    editEditorTitle: string
    addNewEditorButton: string
    editorUsernameLabel: string
    temporaryPasswordLabel: string
    temporaryPasswordHint: string
    passwordMinLengthHint: string
    createEditorButton: string
    creatingEditor: string
    editorCreatedSuccess: string
    editorCreateError: string
    saveUsernameButton: string
    resetPasswordTitle: string
    resetPasswordHint: string
    resetPasswordPlaceholder: string
    resetPasswordButton: string
    resettingPassword: string
    editorPasswordResetSuccess: string
    editorPasswordResetError: string
    dangerZoneTitle: string
    dangerZoneHint: string
    deleteEditorButton: string
    deletingEditor: string
    deleteEditorConfirm: string
    editorSavedSuccess: string
    editorSaveError: string
    editorDeleteError: string
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
      posters: string
      gallery: string
      organisation: string
      settings: string
      dashboardIconAlt: string
      productionsIconAlt: string
      postersIconAlt: string
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
      tableColLanguage: string
      tableColDate: string
      tableColActions: string
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
    notFound: {
      titleTop: string
      titleAccent: string
      titleBottom: string
      joke: string
      description: string
      dashboardButton: string
    }
    posters: {
      pageTitle: string
      pageSubtitle: string
      formTitleLabel: string
      formProductionLabel: string
      formFileLabel: string
      formFileHint: string
      addFileButton: string
      submitButton: string
      submittingButton: string
      overviewHeading: string
      searchPlaceholder: string
      searchButton: string
      loadingMessage: string
      emptyMessage: string
      noProductionsAvailable: string
      searchProductionPlaceholder: string
      noProductionsFound: string
      deleteButton: string
      deletingButton: string
      deleteConfirm: string
      deleteError: string
      validationTitleRequired: string
      validationProductionRequired: string
      validationFileRequired: string
      validationInvalidFileType: string
      loadPostersError: string
      loadProductionsError: string
      noProductionAssigned: string
      filesSelectedCount: (count: number) => string
      filesCountLabel: (count: number) => string
      pdfPreviewTitle: (title: string) => string
    }
  }

  editHeader: {
    back: string
    publish: string
    saveOnDraft: string
  }

  blogs: {
    placeholder: string
    navBack: string

    languageError:string
    loadingBlog: string
    loadingProductions: string
    relatedProductions: string
    untitledBlog: string

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
    removeProductionAriaLabel: string
    savingButton: string
    deletingButton: string
    deleteButton: string
    deleteConfirm: string
    deleteError: string
    blogNotFound: string
    noTitleError:string
    filledLanguageNeedsTitleError: string
    filledLanguageNeedsContentError: string
    publishConfirmTitle: string
    publishConfirmWithoutEnglish: string
    publishConfirmWithoutDutch: string
    publishConfirmCancel: string
    publishConfirmProceed: string

    productionPopUp : {
      title:string
      cancelButton: string
      addButton: string
      close: string
      queryHint: string
      noProductionFound:string
    }
    bannerUpload: {
      title: string
      subtitle: string
      label: string
      addButton: string
      allowedFormats: string
      invalidFileTypes: (fileNames: string) => string
      alreadyUploaded: (count: number) => string
      uploadedImagesLabel: string
      setThumbnailButton: string
      pendingUploadLabel: (count: number) => string
      removeButton: string
      coverLabel: string
      deleteImageAriaLabel: string
      coverHint: string
    }
  }
}