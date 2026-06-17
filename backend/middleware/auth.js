const jwt = require('jsonwebtoken')
const { AppError, asyncHandler } = require('./errorHandler')
const User = require('../models/User')

const protect = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('未授权访问，请先登录', 401))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey')
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user) {
      return next(new AppError('用户不存在', 401))
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email
    }
    next()
  } catch (err) {
    return next(new AppError('无效的令牌，请重新登录', 401))
  }
})

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey')
      const user = await User.findById(decoded.id).select('-password')
      
      if (user) {
        req.user = {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    } catch (err) {
    }
  }

  next()
})

module.exports = {
  protect,
  optionalAuth
}