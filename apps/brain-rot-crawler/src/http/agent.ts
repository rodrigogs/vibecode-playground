import axios from 'axios'
import { ddosGuardBypass } from 'axios-ddos-guard-bypass'
import { CookieJar } from 'tough-cookie'

export const buildAxiosAgent = () => {
  // Create a cookie jar for handling cookies
  const cookieJar = new CookieJar()

  // Create axios instance with cookie jar
  const agent = axios.create({
    jar: cookieJar,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://italianbrainrot.miraheze.org',
    },
  })

  // Enable DDoS Guard bypass
  ddosGuardBypass(agent)

  return agent
}
