# @repo/logger

Context-aware logging utilities with automatic namespace detection.

## API

### createLogger

```typescript
import { createLogger } from '@repo/logger'

const logger = createLogger('service')

logger.info('User created successfully')
logger.error('Database connection failed', { error: 'timeout' })
logger.warn('Deprecated API usage')
logger.debug('Processing request data')
```

Creates namespaced debug loggers: `{root}:{level}:{package}:{namespace}`

## Environment Control

```bash
# Enable all logs
DEBUG=* npm start

# Enable specific package
DEBUG=api:* npm start

# Enable specific levels
DEBUG=*:error,*:warn npm start
```
