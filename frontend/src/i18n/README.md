# i18n Scaffold

This scaffold provides a minimal translation structure for Dutch (`nl`) and English (`en`):

- `types.ts`: message shape
- `locales/nl.ts`: Dutch messages
- `locales/en.ts`: English messages
- `index.ts`: locale resolution + message lookup

Current behavior:

- Defaults to Dutch (`nl`)
- Resolves browser locale (`navigator.language`) to `nl` or `en`
- Is intentionally lightweight so features can migrate incrementally
