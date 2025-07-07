# Brain-rot Crawler 🧠

A modern, organized web crawler for extracting character data from the Italian Brain-rot Wiki. Built with TypeScript, Playwright, and a clean ETL (Extract-Transform-Load) architecture.

## 🚀 **Recent Major Improvements**

### ✅ **Organized Architecture**
- **Service-based architecture** with clean separation of concerns
- **90% reduction** in main server file size (891 → 90 lines)
- **Centralized state management** and logging
- **Comprehensive testing** with 23+ unit tests

### ✅ **Environment Configuration**
- **Validated environment variables** with Zod schema
- **Comprehensive `.env.example`** with all options documented
- **Type-safe configuration** access throughout the app

### ✅ **Centralized Logging**
- **Structured logging** replacing 47+ console.log instances
- **Configurable log levels** (debug, info, warn, error)
- **Namespace-based loggers** for different modules

### ✅ **Development Experience**
- **Development utilities** and debugging tools
- **Performance monitoring** helpers
- **Memory usage tracking**
- **Browser debugging configuration**

## 📋 **Quick Start**

### 1. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. **Installation & Build**
```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### 3. **Running the Crawler**

#### **Full Development Mode** (Recommended)
```bash
# Start both API server and web interface
npm run dev:full
```

#### **API Server Only**
```bash
# Start just the API server
npm run dev:api
```

#### **Core Crawler Only**
```bash
# Run the crawler directly
npm run dev
```

#### **Web Interface Only**
```bash
# Start just the web interface
npm run dev:web
```

## 🔧 **Configuration Options**

### **Basic Configuration**
```env
# API Server
API_PORT=3001

# Logging
DEBUG_LOGS=false
LOG_LEVEL=info

# Crawler Limits (for testing)
MAX_CHARACTERS=10
```

### **Browser Configuration**
```env
# Run in headless mode
HEADLESS_BROWSER=true

# Slow motion for debugging (milliseconds)
BROWSER_SLOW_MO=500
```

### **Performance Tuning**
```env
# Memory limits
MAX_LOGS_IN_MEMORY=1000
MAX_CHARACTER_PAYLOADS=100

# Timeouts
PAGE_LOAD_TIMEOUT=30000
CHARACTER_PROCESSING_DELAY=1000
```

### **AI Integration** (Optional)
```env
# OpenAI for enhanced processing
OPENAI_API_KEY=your_key_here

# Or DeepSeek alternative
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_API_URL=https://api.deepseek.com
DEFAULT_PROVIDER=deepseek
```

## 🏗️ **Architecture Overview**

```
src/
├── core/                    # Core crawler logic
│   ├── config/             # Configuration management
│   │   ├── constants.ts    # Application constants
│   │   └── environment.ts  # Environment validation
│   ├── etl/                # ETL pipeline
│   │   ├── extractor.ts    # Web scraping logic
│   │   ├── transformer.ts  # Data transformation
│   │   ├── loader.ts       # Data storage
│   │   └── pipeline.ts     # Pipeline orchestration
│   └── utils/              # Utilities
│       ├── logger.ts       # Centralized logging
│       └── common.ts       # Helper functions
├── server/                  # API server
│   ├── services/           # Business logic
│   │   ├── crawler-state.ts
│   │   ├── logging.ts
│   │   ├── health.ts
│   │   └── approval.ts
│   ├── routes/             # API endpoints
│   │   ├── status.ts
│   │   ├── crawler.ts
│   │   └── health.ts
│   └── api-server.ts       # Main server
└── client/                  # Web interface
```

## 🧪 **Testing**

### **Run All Tests**
```bash
npm test
```

### **Unit Tests Only**
```bash
npm run test:unit
```

### **Integration Tests**
```bash
npm run test:integration
```

### **Watch Mode**
```bash
npm run test -- --watch
```

## 🔍 **Development & Debugging**

### **Debug Mode**
```bash
# Enable debug logging
DEBUG_LOGS=true npm run dev:api

# Enable browser devtools
ENABLE_DEVTOOLS=true npm run dev:api
```

### **Memory Monitoring**
```bash
# Enable verbose logging with memory stats
ETL_VERBOSE=true DEBUG_LOGS=true npm run dev:api
```

### **Performance Profiling**
The crawler includes built-in performance monitoring:
- Automatic memory usage tracking
- Request/response timing
- ETL pipeline stage profiling

## 📊 **API Endpoints**

### **Status & Monitoring**
- `GET /api/status` - Crawler status and configuration
- `GET /api/logs` - Recent crawler logs with metadata
- `GET /api/health` - System health metrics
- `GET /api/results` - Latest crawling results

### **Crawler Control**
- `POST /api/crawler/initialize` - Initialize the crawler
- `POST /api/crawler/run` - Start crawling process
- `POST /api/crawler/pause` - Pause active crawling
- `POST /api/crawler/resume` - Resume paused crawling
- `POST /api/crawler/stop` - Stop crawler gracefully

### **Manual Approval** (Optional)
- `POST /api/manual-mode` - Toggle manual approval mode
- `POST /api/approve-step` - Approve/reject pending steps

### **Data Inspection**
- `GET /api/log-payload/:logId` - Inspect detailed log data

## 🛠️ **Customization**

### **Adding New Extractors**
```typescript
// src/core/etl/extractors/custom-extractor.ts
export class CustomExtractor {
  async extract(page: Page): Promise<CustomData> {
    // Your extraction logic
  }
}
```

### **Custom Transformers**
```typescript
// src/core/etl/transformers/custom-transformer.ts
export class CustomTransformer {
  async transform(data: RawData): Promise<TransformedData> {
    // Your transformation logic
  }
}
```

### **Adding New API Routes**
```typescript
// src/server/routes/custom.ts
export async function getCustomData(req: Request, res: Response) {
  // Your route logic
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Browser Launch Fails**
```bash
# Install browser dependencies
npx playwright install-deps chromium
```

#### **Memory Issues**
```env
# Reduce memory limits in .env
MAX_LOGS_IN_MEMORY=500
MAX_CHARACTER_PAYLOADS=50
```

#### **Network Timeouts**
```env
# Increase timeouts in .env
PAGE_LOAD_TIMEOUT=60000
CHARACTER_PROCESSING_DELAY=2000
```

### **Debug Information**
```bash
# Enable all debug logging
DEBUG_LOGS=true LOG_LEVEL=debug npm run dev:api

# Check environment configuration
node -e "console.log(process.env)" | grep -E "(API_|DEBUG_|LOG_)"
```

## 📈 **Performance Optimization**

### **Memory Management**
- Automatic cleanup of old logs and payloads
- Configurable memory limits
- Built-in memory monitoring

### **Rate Limiting**
- Configurable delays between requests
- Respectful crawling with slow-motion option
- Timeout management for all operations

### **Caching**
- Character payload caching
- Image processing optimization
- ETL pipeline result caching

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the existing architecture
4. **Add tests** for new functionality
5. **Run the test suite**: `npm test`
6. **Submit a pull request**

### **Development Guidelines**
- Use the centralized logger instead of console.log
- Add environment variables to the schema in `environment.ts`
- Follow the service-based architecture pattern
- Write tests for new functionality
- Update documentation for new features

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Italian Brain-rot Wiki** for providing the data source
- **Playwright** for excellent web automation
- **TypeScript** for type safety and developer experience
- **Vite** for fast development builds 