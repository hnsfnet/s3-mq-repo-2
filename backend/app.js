const express = require('express')
const cors = require('cors')

const logger = require('./middleware/logger')
const { notFound, errorHandler } = require('./middleware/errorHandler')

const createApp = () => {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(logger)

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Blog API is running',
      timestamp: new Date().toISOString()
    })
  })

  app.use('/api/auth', require('./routes/auth'))
  app.use('/api/articles', require('./routes/articles'))
  app.use('/api/comments', require('./routes/comments'))
  app.use('/api/tags', require('./routes/tags'))

  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = createApp