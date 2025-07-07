export interface AxiosError {
  response?: {
    status: number
    headers: Record<string, string>
  }
}
