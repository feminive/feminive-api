import { DEFAULT_POLL_OPTIONS } from '../config/pollOptions.js'

export type PollOptionsMap = Record<string, string[]>

let cachedOptions: PollOptionsMap | null = null
let overrideOptions: PollOptionsMap | null = null

const sanitizeOptions = (options: unknown): string[] => {
  if (!Array.isArray(options)) {
    return []
  }

  return options
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

const parseEnvOptions = (): PollOptionsMap => {
  const envValue = process.env.POLL_OPTIONS ??
    process.env.POLL_DEFINITIONS ??
    process.env.POLL_CONFIG ??
    ''

  const trimmed = envValue?.trim()

  if (!trimmed) {
    return {}
  }

  try {
    const parsed = JSON.parse(trimmed)

    if (Array.isArray(parsed)) {
      console.warn('[pollOptions] Esperava objeto { pollId: string[] }, mas recebi array. Ignorando valor.')
      return {}
    }

    if (parsed != null && typeof parsed === 'object') {
      const entries = Object.entries(parsed as Record<string, unknown>)
      const result: PollOptionsMap = {}

      for (const [key, value] of entries) {
        const options = sanitizeOptions(value)

        if (options.length > 0) {
          result[key.trim()] = options
        }
      }

      return result
    }
  } catch (err) {
    console.error('[pollOptions] Falha ao interpretar configuração de enquetes', err)
  }

  return {}
}

const getOptionsFromSource = (): PollOptionsMap => {
  if (overrideOptions != null) {
    return overrideOptions
  }

  if (cachedOptions != null) {
    return cachedOptions
  }

  const envOptions = parseEnvOptions()

  cachedOptions = {
    ...DEFAULT_POLL_OPTIONS,
    ...envOptions
  }
  return cachedOptions
}

export const getPollOptions = (pollId: string): string[] | null => {
  const options = getOptionsFromSource()[pollId]
  return options?.length ? options : null
}

export const getAllPollOptions = (): PollOptionsMap => {
  return { ...getOptionsFromSource() }
}

export const overridePollOptions = (options: PollOptionsMap | null): void => {
  overrideOptions = options
  cachedOptions = null
}
