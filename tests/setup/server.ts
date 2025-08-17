// tests/setup/server.ts
export function jsonReq(
  method: string,
  url = "http://localhost/api/test",
  body?: any,
  headers: Record<string, string> = {}
) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function readJson(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Response is not JSON: ${text}`)
  }
}
