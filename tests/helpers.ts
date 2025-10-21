export interface MockResponse {
  statusCode: number
  body: any
  headers: Record<string, string>
  status: (code: number) => MockResponse
  setHeader: (name: string, value: string) => MockResponse
  send: (payload: string) => void
}

export const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status (code: number) {
      this.statusCode = code
      return this
    },
    setHeader (name: string, value: string) {
      this.headers[name] = value
      return this
    },
    send (payload: string) {
      this.body = JSON.parse(payload)
    }
  }

  return res
}
