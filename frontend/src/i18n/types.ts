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
    loginTitle: string
    usernameLabel: string
    passwordLabel: string
    submit: string
    loginFailed: string
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
