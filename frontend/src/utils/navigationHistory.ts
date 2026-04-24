function stripLocale(path: string) {
    return path.replace(/^\/(nl|en)(?=\/|$)/, '')
}

let previousStrippedPath: string | null = null
let currentStrippedPath: string | null = null

export function trackNavigation(path: string) {
    const stripped = stripLocale(path)
    // only update when the stripped path actually changes — locale switches are ignored
    if (stripped !== currentStrippedPath) {
        previousStrippedPath = currentStrippedPath
        currentStrippedPath = stripped
    }
}

export function getPreviousStrippedPath(): string | null {
    return previousStrippedPath
}