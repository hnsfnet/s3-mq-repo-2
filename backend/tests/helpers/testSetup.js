const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey'

const generateTestToken = (userId = '507f1f77bcf86cd799439011') => {
  return jwt.sign({ id: userId }, JWT_SECRET)
}

const generateTestObjectId = () => {
  return new mongoose.Types.ObjectId().toString()
}

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword123',
  toJSON() {
    return {
      _id: this._id,
      username: this.username,
      email: this.email
    }
  },
  select: function() {
    return Promise.resolve({
      _id: this._id,
      username: this.username,
      email: this.email
    })
  }
}

const mockArticle = {
  _id: '507f1f77bcf86cd799439012',
  title: '测试文章',
  content: '这是一篇测试文章的内容，长度超过十个字符。',
  category: '技术',
  tags: ['Vue', 'JavaScript'],
  author: {
    _id: mockUser._id,
    username: mockUser.username
  },
  views: 10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  toJSON() {
    return {
      _id: this._id,
      title: this.title,
      content: this.content,
      category: this.category,
      tags: this.tags,
      author: this.author,
      views: this.views,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

const mockComment = {
  _id: '507f1f77bcf86cd799439013',
  content: '测试评论内容',
  author: {
    _id: mockUser._id,
    username: mockUser.username,
    email: mockUser.email
  },
  article: mockArticle._id,
  parentComment: null,
  createdAt: new Date().toISOString(),
  toObject() {
    return {
      _id: this._id,
      content: this.content,
      author: this.author,
      article: this.article,
      createdAt: this.createdAt
    }
  }
}

const mockTag = {
  _id: '507f1f77bcf86cd799439014',
  name: 'Vue',
  description: 'Vue.js 框架',
  color: '#42b883',
  count: 5,
  createdAt: new Date().toISOString(),
  save: () => Promise.resolve(this)
}

const mockFindChain = (data, total = null) => {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(data)
  }
  chain.then = (resolve) => Promise.resolve(data).then(resolve)
  return chain
}

module.exports = {
  JWT_SECRET,
  generateTestToken,
  generateTestObjectId,
  mockUser,
  mockArticle,
  mockComment,
  mockTag,
  mockFindChain
}