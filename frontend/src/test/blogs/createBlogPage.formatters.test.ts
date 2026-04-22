import { describe, expect, it, vi } from 'vitest'
import { formatBlogDetailForForm, validateBlogPublishInput } from '../../pages/admin/createBlogPage.formatters'
import type { BlogContent } from '../../types/blog'

vi.mock('quill', () => {
  return {
    default: class MockQuill {
      root = { innerHTML: '' }

      constructor() {
        this.root = { innerHTML: '' }
      }

      setContents(value: { ops?: Array<{ insert?: unknown }> }) {
        this.root.innerHTML = Array.isArray(value?.ops)
          ? value.ops
              .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
              .join('')
          : ''
      }
    },
  }
})

function createForm(overrides?: Partial<BlogContent>): BlogContent {
  return {
    nl: { title: '', content: '' },
    en: { title: '', content: '' },
    ...overrides,
  }
}

describe('validateBlogPublishInput', () => {
  it('returns atLeastOneLanguageRequired when both languages are empty', () => {
    const result = validateBlogPublishInput(createForm(), { nl: null, en: null })

    expect(result).toBe('atLeastOneLanguageRequired')
  })

  it('returns filledLanguageNeedsTitle when a language has content but no title', () => {
    const result = validateBlogPublishInput(
      createForm({
        nl: { title: '', content: '<p>Content zonder titel</p>' },
      }),
      { nl: null, en: null },
    )

    expect(result).toBe('filledLanguageNeedsTitle')
  })

  it('returns ok when one language has both title and content', () => {
    const result = validateBlogPublishInput(
      createForm({
        nl: { title: 'Titel', content: '<p>Inhoud</p>' },
      }),
      { nl: null, en: null },
    )

    expect(result).toBe('allLanguageFilled')
  })

  it('treats embedded json ops content as filled and valid when title exists', () => {
    const result = validateBlogPublishInput(
      createForm({
        nl: { title: 'Titel', content: '' },
      }),
      { nl: { ops: [{ insert: { image: 'https://example.com/image.jpg' } }] }, en: null },
    )

    expect(result).toBe('allLanguageFilled')
  })

  it('treats whitespace-only html/json content as empty', () => {
    const result = validateBlogPublishInput(
      createForm({
        nl: { title: '', content: '<p>&nbsp;</p>' },
        en: { title: '', content: '' },
      }),
      { nl: { ops: [{ insert: '   ' }, { attributes: { bold: true } }] }, en: null },
    )

    expect(result).toBe('atLeastOneLanguageRequired')
  })

  it('requires title when locale has non-ops rich content object', () => {
    const result = validateBlogPublishInput(
      createForm({
        nl: { title: '', content: '' },
      }),
      { nl: { custom: true }, en: null },
    )

    expect(result).toBe('filledLanguageNeedsTitle')
  })
})

describe('formatBlogDetailForForm', () => {
  it('maps localized direct content shape to form html/json', () => {
    const result = formatBlogDetailForForm({
      id: 'blog-1',
      title: JSON.stringify({ nl: 'NL titel', en: 'EN title' }),
      content: {
        nl: '<p>NL inhoud</p>',
        en: '<p>EN content</p>',
      },
      productions: [],
    })

    expect(result.form.nl.title).toBe('NL titel')
    expect(result.form.en.title).toBe('EN title')
    expect(result.form.nl.content).toContain('NL inhoud')
    expect(result.form.en.content).toContain('EN content')
    expect(result.contentJson.nl).toBe('<p>NL inhoud</p>')
    expect(result.contentJson.en).toBe('<p>EN content</p>')
  })

  it('maps legacy nested locale content shape to form html/json', () => {
    const result = formatBlogDetailForForm({
      id: 'blog-legacy',
      title: JSON.stringify({ nl: 'Legacy NL', en: 'Legacy EN' }),
      content: {
        nl: { content: '<p>Legacy NL inhoud</p>' },
        en: { content: '<p>Legacy EN content</p>' },
      },
      productions: [],
    })

    expect(result.form.nl.content).toContain('Legacy NL inhoud')
    expect(result.form.en.content).toContain('Legacy EN content')
    expect(result.contentJson.nl).toBe('<p>Legacy NL inhoud</p>')
    expect(result.contentJson.en).toBe('<p>Legacy EN content</p>')
  })

  it('handles invalid title json and locale delta content objects', () => {
    const result = formatBlogDetailForForm({
      id: 'blog-delta',
      title: '{invalid json',
      content: {
        nl: { ops: [{ insert: 'NL delta tekst' }] },
        en: { ops: [{ insert: 'EN delta text' }] },
      },
      productions: [],
    })

    expect(result.form.nl.title).toBe('')
    expect(result.form.en.title).toBe('')
    expect(result.form.nl.content).toContain('NL delta tekst')
    expect(result.form.en.content).toContain('EN delta text')
    expect(result.contentJson.nl).toEqual({ ops: [{ insert: 'NL delta tekst' }] })
    expect(result.contentJson.en).toEqual({ ops: [{ insert: 'EN delta text' }] })
  })

  it('maps scalar content into both locales and json payload', () => {
    const result = formatBlogDetailForForm({
      id: 'blog-scalar',
      title: null,
      content: '<p>One shared content body</p>',
      productions: [],
    })

    expect(result.form.nl.content).toContain('One shared content body')
    expect(result.form.en.content).toContain('One shared content body')
    expect(result.contentJson.nl).toBe('<p>One shared content body</p>')
    expect(result.contentJson.en).toBe('<p>One shared content body</p>')
  })

  it('normalizes locale json when content wrappers are missing or undefined', () => {
    const result = formatBlogDetailForForm({
      id: 'blog-mixed',
      title: JSON.stringify({ nl: 'Titel', en: 'Title' }),
      content: {
        nl: { raw: 'without-content-key' },
        en: { content: undefined },
      },
      productions: [],
    })

    expect(result.form.nl.content).toBe('')
    expect(result.form.en.content).toBe('')
    expect(result.contentJson.nl).toEqual({ raw: 'without-content-key' })
    expect(result.contentJson.en).toBeNull()
  })
})
