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
  detail: {
    navBackToOverview: string
    dates: string
    noEvents: string
    date: string
    time: string
    location: string
    showLess: string
    showMore: string
    credits: string
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
