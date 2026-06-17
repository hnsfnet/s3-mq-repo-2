const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const userExists = await User.findOne({ $or: [{ username }, { email }] })
    
    if (userExists) {
      return res.status(400).json({ message: '用户名或邮箱已存在' })
    }
    
    const user = await User.create({ username, email, password })
    const token = jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '7d' })
    
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    
    if (!user) {
      return res.status(400).json({ message: '用户名或密码错误' })
    }
    
    const isMatch = await user.matchPassword(password)
    
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误' })
    }
    
    const token = jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '7d' })
    
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router