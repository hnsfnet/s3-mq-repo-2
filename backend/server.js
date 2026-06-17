const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const logger = require('./middleware/logger')
const { notFound, errorHandler } = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(logger)

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err.message)
  process.exit(1)
})

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

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...')
  console.error(err.name, err.message)
  process.exit(1)
})

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...')
  console.error(err.name, err.message)
  process.exit(1)
})

app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`)
  console.log(`API URL: http://localhost:${PORT}/api`)
})