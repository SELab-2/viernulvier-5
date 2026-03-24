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
  search: {
    heading: string
    subtitle: string
    productionsTab: string
    blogTab: string
    resultsCount: string
    resultsSuffix: string
    sortLabel: string
    sortDefault: string
    shareLabel: string
    shareCopiedLabel: string
    filterOpenLabel: string
    filterCloseLabel: string
    noResults: string
    activeFilterTags: string[]
    searchPlaceholder: string
    genreLabel: string
    genres: string[]
    periodLabel: string
    periodMin: string
    periodCurrent: string
    periodMax: string
    locationLabel: string
    locations: string[]
    resetFiltersLabel: string
    paginationPrevious: string
    paginationNext: string
    paginationPages: string[]
    paginationCurrent: string
    items: Array<{
      id: string
      tag: string
      date: string
      title: string
      excerpt: string
      venue: string
      imageClassName: string
    }>
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
