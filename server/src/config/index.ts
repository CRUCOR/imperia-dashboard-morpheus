import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // File upload configuration
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedExtensions: ['.json', '.csv', '.txt'],
    uploadPath: process.env.UPLOAD_PATH || './data/input',
    outputPath: process.env.OUTPUT_PATH || './data/output',
  },

  // Morpheus CLI configuration
  morpheus: {
    cliCommand: process.env.MORPHEUS_CLI_COMMAND || 'morpheus', // Command to execute Morpheus
    host: process.env.MORPHEUS_HOST || 'localhost', // Host where Morpheus is running
    port: process.env.MORPHEUS_PORT || 8888,
    timeout: 600000, // 10 minutes for long-running ML processes
    retryAttempts: 3,
    workingDirectory: process.env.MORPHEUS_WORK_DIR || '/tmp/morpheus',
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
} as const