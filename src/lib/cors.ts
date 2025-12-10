import type { VercelRequest, VercelResponse } from '@vercel/node'

export interface CorsOptions {
  methods?: string
  allowHeaders?: string
  allowCredentials?: boolean
  maxAgeSeconds?: number
  allowOrigin?: string
}

const DEFAULT_METHODS = 'GET,POST,OPTIONS'
const DEFAULT_HEADERS = 'Content-Type, Authorization, X-Requested-With'
const DEFAULT_MAX_AGE = 86400

export const applyCors = (req: VercelRequest, res: VercelResponse, options: CorsOptions = {}): void => {
  const originHeader = typeof req.headers?.origin === 'string' ? req.headers.origin : ''
  const allowOrigin = options.allowOrigin ?? (originHeader !== '' ? originHeader : '*')

  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', options.methods ?? DEFAULT_METHODS)
  res.setHeader('Access-Control-Allow-Headers', options.allowHeaders ?? DEFAULT_HEADERS)
  res.setHeader('Vary', 'Origin')

  if (options.allowCredentials === true && originHeader !== '') {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  const maxAge = typeof options.maxAgeSeconds === 'number' && Number.isFinite(options.maxAgeSeconds)
    ? options.maxAgeSeconds
    : DEFAULT_MAX_AGE

  res.setHeader('Access-Control-Max-Age', String(maxAge))
}
