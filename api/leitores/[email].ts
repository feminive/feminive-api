import type { VercelRequest, VercelResponse } from '@vercel/node'

const allowedOrigins = [
  'https://feminive-fanfics.vercel.app',
  'http://localhost:4321'
]

function applyCors (req: VercelRequest, res: VercelResponse): void {
  const requestOrigin = req.headers.origin
  const originToAllow = requestOrigin !== undefined && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0]

  res.setHeader('Access-Control-Allow-Origin', originToAllow)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  try {
    res.status(200).json({
      ok: true,
      method: req.method,
      query: req.query
    })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? 'error' })
  }
}
