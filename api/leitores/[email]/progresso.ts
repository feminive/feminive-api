import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
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
