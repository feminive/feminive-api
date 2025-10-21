import type { VercelResponse } from '@vercel/node'

export const sendJson = (res: VercelResponse, status: number, payload: unknown): void => {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(payload))
}

export const sendError = (res: VercelResponse, status: number, mensagem: string, detalhes?: unknown): void => {
  sendJson(res, status, detalhes !== undefined ? { mensagem, detalhes } : { mensagem })
}
