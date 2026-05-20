/// <reference types="vitest" />
import '@testing-library/jest-dom/vitest'

if (!window.matchMedia) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		}),
	})
}

Object.defineProperty(window, 'localStorage', {
	writable: true,
	value: {
		getItem: () => {},
		setItem: () => {},
		removeItem: () => {},
		clear: () => {},
	},
})

window.localStorage.setItem('locale', 'nl')
document.documentElement.lang = 'nl'

Object.defineProperty(window, 'scrollTo', {
	writable: true,
	value: () => {},
})
