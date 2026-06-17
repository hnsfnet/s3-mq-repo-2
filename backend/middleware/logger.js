const fs = require('fs')
const path = require('path')

const LOG_DIR = path.join(__dirname, '..', 'logs')

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

const getLogStream = (filename) => {
  const filePath = path.join(LOG_DIR, filename)
  return {
    write: (message) => {
      try {
        fs.appendFileSync(filePath, message)
      } catch (err) {
        console.error('Failed to write log:', err.message)
      }
    }
  }
}

const accessLogStream = getLogStream('access.log')
const errorLogStream = getLogStream('error.log')

const generateRequestId = () => {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

const formatLogEntry = (level, requestId, message, meta = {}) => {
  const timestamp = new Date().toISOString()
  const entry = {
    timestamp,
    level,
    requestId,
    message,
    ...meta
  }
  return JSON.stringify(entry) + '\n'
}

const logger = (req, res, next) => {
  const start = Date.now()
  const requestId = generateRequestId()
  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)

  const { method, url, ip } = req
  const userAgent = req.headers['user-agent']?.substring(0, 120) || ''
  const userId = req.user?.id || 'anonymous'

  const accessLog = formatLogEntry('info', requestId, 'Incoming request', {
    method,
    url,
    ip,
    userAgent,
    userId
  })
  accessLogStream.write(accessLog)

  console.log(
    `[${new Date().toLocaleString('zh-CN')}] [${requestId}] ${method} ${url} - ${ip} - user:${userId}`
  )

  const originalSend = res.send
  const originalJson = res.json

  let responseBody = null

  res.json = function(body) {
    responseBody = body
    return originalJson.call(this, body)
  }

  res.send = function(body) {
    if (!responseBody) {
      responseBody = typeof body === 'string' ? body.substring(0, 200) : body
    }
    return originalSend.call(this, body)
  }

  res.on('finish', () => {
    const duration = Date.now() - start
    const { statusCode } = res
    const isError = statusCode >= 400

    const logEntry = formatLogEntry(
      isError ? 'error' : 'info',
      requestId,
      'Request completed',
      {
        method,
        url,
        statusCode,
        duration,
        userId,
        ip,
        responseStatus: responseBody?.status
      }
    )

    accessLogStream.write(logEntry)

    if (isError) {
      errorLogStream.write(logEntry)
    }

    const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m'
    const resetColor = '\x1b[0m'

    console.log(
      `  [${requestId}] ${statusColor}${statusCode}${resetColor} - ${duration}ms - ${method} ${url}`
    )
  })

  res.on('error', (err) => {
    const errorLog = formatLogEntry('error', requestId, 'Response error', {
      method,
      url,
      error: err.message
    })
    errorLogStream.write(errorLog)
    console.error(`[${requestId}] [Error] ${method} ${url} - ${err.message}`)
  })

  next()
}

module.exports = logger
module.exports.accessLogStream = accessLogStream
module.exports.errorLogStream = errorLogStream
module.exports.formatLogEntry = formatLogEntry