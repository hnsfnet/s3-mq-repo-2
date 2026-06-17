const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { AppError, asyncHandler } = require('../middleware/errorHandler')

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

const createSendResponse = (user, statusCode, res) => {
  const token = signToken(user._id)
  user.password = undefined

  const userData = {
    id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt
  }

  res.status(statusCode).json({
    status: 'success',
    token,
    data: userData
  })
}

router.post('/register', asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return next(new AppError('请填写用户名、邮箱和密码', 400))
  }

  if (password.length < 6) {
    return next(new AppError('密码长度至少6位', 400))
  }

  const userExists = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (userExists) {
    if (userExists.username === username) {
      return next(new AppError('用户名已被使用', 400))
    }
    return next(new AppError('邮箱已被注册', 400))
  }

  const user = await User.create({
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password
  })

  createSendResponse(user, 201, res)
}))

router.post('/login', asyncHandler(async (req, res, next) => {
  const { username, password } = req.body

  if (!username || !password) {
    return next(new AppError('请提供用户名和密码', 400))
  }

  const user = await User.findOne({ username }).select('+password')

  if (!user) {
    return next(new AppError('用户名或密码错误', 401))
  }

  const isMatch = await user.matchPassword(password)

  if (!isMatch) {
    return next(new AppError('用户名或密码错误', 401))
  }

  createSendResponse(user, 200, res)
}))

router.get('/me', asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('未登录，请先登录', 401))
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey')
  const user = await User.findById(decoded.id).select('-password')

  if (!user) {
    return next(new AppError('用户不存在', 401))
  }

  res.status(200).json({
    status: 'success',
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
}))

module.exports = router