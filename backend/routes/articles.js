const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Article = require('../models/Article')

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: '未授权' })
  }
  jwt.verify(token, 'secretkey', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '无效令牌' })
    }
    req.user = decoded
    next()
  })
}

router.get('/', async (req, res) => {
  try {
    const articles = await Article.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 })
    res.json(articles)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'username')
    
    if (!article) {
      return res.status(404).json({ message: '文章不存在' })
    }
    
    article.views++
    await article.save()
    
    res.json(article)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body
    const article = await Article.create({
      title,
      content,
      author: req.user.id,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    })
    await article.populate('author', 'username')
    res.status(201).json(article)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    
    if (!article) {
      return res.status(404).json({ message: '文章不存在' })
    }
    
    if (article.author.toString() !== req.user.id) {
      return res.status(403).json({ message: '无权修改' })
    }
    
    const { title, content, category, tags } = req.body
    article.title = title
    article.content = content
    article.category = category
    article.tags = tags ? tags.split(',').map(t => t.trim()) : []
    article.updatedAt = Date.now
    
    await article.save()
    await article.populate('author', 'username')
    res.json(article)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    
    if (!article) {
      return res.status(404).json({ message: '文章不存在' })
    }
    
    if (article.author.toString() !== req.user.id) {
      return res.status(403).json({ message: '无权删除' })
    }
    
    await Article.findByIdAndDelete(req.params.id)
    res.json({ message: '删除成功' })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router