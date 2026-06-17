const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

mongoose.connect('mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/articles', require('./routes/articles'))
app.use('/api/comments', require('./routes/comments'))

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})