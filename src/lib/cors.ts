import type { VercelRequest, VercelResponse } from '@vercel/node'

export interface CorsOptions {
  methods?: string
  allowHeaders?: string
  allowCredentials?: boolean
  maxAgeSeconds?: number
}

const DEFAULT_METHODS = 'GET,POST,OPTIONS'
const DEFAULT_HEADERS = 'Content-Type, Authorization, X-Requested-With'

export const applyCors = (req: VercelRequest, res: VercelResponse, options: CorsOptions = {}): void => {
  const originHeader = typeof req.headers?.origin === 'string' ? req.headers.origin : ''
  const allowOrigin = originHeader !== '' ? originHeader : '*'

  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', options.methods ?? DEFAULT_METHODS)
  res.setHeader('Access-Control-Allow-Headers', options.allowHeaders ?? DEFAULT_HEADERS)
  res.setHeader('Vary', 'Origin')

  if (options.allowCredentials === true && originHeader !== '') {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  if (typeof options.maxAgeSeconds === 'number' && Number.isFinite(options.maxAgeSeconds)) {
    res.setHeader('Access-Control-Max-Age', String(options.maxAgeSeconds))
  }
}
