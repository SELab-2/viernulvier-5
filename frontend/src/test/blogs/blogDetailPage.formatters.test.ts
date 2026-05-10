import { describe, expect, it } from 'vitest'
import {
  getLocalizedContent,
  getLocalizedTitle,
  getProductionExcerpt,
  getProductionLabel,
  getProductionVenue,
  hasLocalizedTitle,
  normalizeContent,
  parsePossibleJson,
} from '../../pages/public/blogDetailPage.formatters'
import type { BlogLinkedProduction } from '../../pages/public/blogDetailPage.formatters'

describe('blogDetailPage.formatters', () => {
  it('parses json strings and returns plain values', () => {
    expect(parsePossibleJson('"hello"')).toBe('hello')
    expect(parsePossibleJson(42)).toBe(42)
    expect(parsePossibleJson('{not valid json')).toBe('{not valid json')
  })

  it('returns localized content and falls back to the raw string', () => {
    expect(getLocalizedContent(JSON.stringify({ nl: 'Nederlandse inhoud', en: 'English content' }), 'nl')).toBe('Nederlandse inhoud')
    expect(getLocalizedContent(JSON.stringify({ nl: 'Nederlandse inhoud', en: 'English content' }), 'en')).toBe('English content')
    expect(getLocalizedContent('Losse tekst', 'nl')).toBe('Losse tekst')
  })

  it('returns localized titles and detects missing titles', () => {
    expect(getLocalizedTitle(JSON.stringify({ nl: '  Titel NL  ', en: 'Title EN' }), 'nl')).toBe('Titel NL')
    expect(getLocalizedTitle('  Plain title  ', 'en')).toBe('Plain title')
    expect(hasLocalizedTitle(JSON.stringify({ nl: '', en: 'Title EN' }), 'nl')).toBe(false)
    expect(hasLocalizedTitle(JSON.stringify({ nl: '  Titel NL  ', en: 'Title EN' }), 'nl')).toBe(true)
    expect(hasLocalizedTitle('  Plain title  ', 'en')).toBe(true)
  })

  it('normalizes quill content only when ops are present', () => {
    expect(normalizeContent(null)).toBeNull()
    expect(normalizeContent('{not valid json')).toBeNull()
    expect(normalizeContent(JSON.stringify({ ops: [{ insert: 'Hello' }] }))).toEqual({ ops: [{ insert: 'Hello' }] })
  })

  it('uses the production id when the title is missing', () => {
    const production: BlogLinkedProduction = {
      id: 'production-99',
      title: null,
      description_short: null,
      description: null,
      teaser: null,
      image_url: null,
      created_at: '2026-04-21T00:00:00.000Z',
      venue_name: null,
      venue_names: [],
      attendance_mode: null,
    }

    expect(getProductionLabel(production, 'nl')).toBe('production-99')
  })

  it('prefers description_short and truncates long excerpts', () => {
    const production: BlogLinkedProduction = {
      id: 'production-1',
      title: { nl: 'Titel', en: 'Title' },
      description_short: { nl: '  <strong>' + 'a'.repeat(170) + '</strong>&nbsp;  ', en: 'English short' },
      description: { nl: 'Fallback description', en: 'Fallback description' },
      teaser: { nl: 'Fallback teaser', en: 'Fallback teaser' },
      image_url: null,
      created_at: '2026-04-21T00:00:00.000Z',
      venue_name: null,
      venue_names: [],
      attendance_mode: null,
    }

    const excerpt = getProductionExcerpt(production, 'nl')
    expect(excerpt).toHaveLength(160)
    expect(excerpt.endsWith('...')).toBe(true)
  })

  it('falls back to description, teaser and then the label for excerpts', () => {
    const descriptionProduction: BlogLinkedProduction = {
      id: 'production-desc',
      title: { nl: 'Titel beschrijving', en: 'Description title' },
      description_short: null,
      description: { nl: 'Omschrijving <em>met html</em>', en: 'Description' },
      teaser: null,
      image_url: null,
      created_at: '2026-04-21T00:00:00.000Z',
      venue_name: null,
      venue_names: [],
      attendance_mode: null,
    }

    const teaserProduction: BlogLinkedProduction = {
      ...descriptionProduction,
      id: 'production-teaser',
      description: null,
      teaser: { nl: 'Teaser &nbsp;tekst', en: 'Teaser text' },
    }

    const labelProduction: BlogLinkedProduction = {
      ...descriptionProduction,
      id: 'production-label',
      title: null,
      description_short: null,
      description: null,
      teaser: null,
    }

    expect(getProductionExcerpt(descriptionProduction, 'nl')).toBe('Omschrijving met html')
    expect(getProductionExcerpt(teaserProduction, 'nl')).toBe('Teaser tekst')
    expect(getProductionExcerpt(labelProduction, 'nl')).toBe('production-label')
  })

  it('returns venue names and falls back to venue_name or attendance_mode', () => {
    const production: BlogLinkedProduction = {
      id: 'production-venue',
      title: { nl: 'Titel', en: 'Title' },
      description_short: null,
      description: null,
      teaser: null,
      image_url: null,
      created_at: '2026-04-21T00:00:00.000Z',
      venue_name: 'Hoofdzaal',
      venue_names: ['  Zaal A  ', '', 'Zaal B'],
      attendance_mode: 'offline',
    }

    expect(getProductionVenue(production)).toBe('Zaal A • Zaal B')
    expect(getProductionVenue({ ...production, venue_names: [], venue_name: '  Hoofdzaal  ' })).toBe('Hoofdzaal')
    expect(getProductionVenue({ ...production, venue_names: [], venue_name: null, attendance_mode: '  online  ' })).toBe('online')
    expect(getProductionVenue({ ...production, venue_names: [], venue_name: null, attendance_mode: null })).toBe('')
  })
})
