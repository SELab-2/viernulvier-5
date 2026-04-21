import { describe, expect, it } from 'vitest'
import { formatBlogDetailForForm, validateBlogPublishInput } from '../../pages/admin/createBlogPage.formatters'
import type { BlogContent } from '../../types/blog'

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

    expect(result).toBe('ok')
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
})
