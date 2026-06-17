const mongoose = require('mongoose')
const createApp = require('./app')

const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err.message)
  process.exit(1)
})

const app = createApp()

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