const { errorLogStream, formatLogEntry } = require('./logger')

class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

const notFound = (req, res, next) => {
  const error = new AppError(`无法找到 ${req.method} ${req.originalUrl} 这个路由`, 404)
  next(error)
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || '服务器内部错误'
  const requestId = req.requestId || 'unknown'

  if (err.name === 'CastError') {
    message = `无效的 ${err.path}: ${err.value}`
    statusCode = 400
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    message = `重复的 ${field} 值，请使用其他值`
    statusCode = 400
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message)
    message = `输入数据无效: ${errors.join(', ')}`
    statusCode = 400
  }

  if (err.name === 'JsonWebTokenError') {
    message = '无效的令牌，请重新登录'
    statusCode = 401
  }

  if (err.name === 'TokenExpiredError') {
    message = '令牌已过期，请重新登录'
    statusCode = 401
  }

  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    message = '请求体格式错误，请检查 JSON 格式'
    statusCode = 400
  }

  const errorLog = formatLogEntry('error', requestId, message, {
    statusCode,
    errorName: err.name,
    isOperational: err.isOperational || false,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
  errorLogStream.write(errorLog)

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${requestId}] [Error] ${err.name}: ${err.message}`)
    console.error(err.stack)
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  })
}

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = {
  AppError,
  notFound,
  errorHandler,
  asyncHandler
}