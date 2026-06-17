const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Comment = require('../models/Comment')

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

router.get('/article/:articleId', async (req, res) => {
  try {
    const comments = await Comment.find({ article: req.params.articleId, parentComment: null })
      .populate('author', 'username email')
      .sort({ createdAt: -1 })
    res.json(comments)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { content, article, parentComment } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({ message: '评论内容不能为空' })
    }
    if (!article) {
      return res.status(400).json({ message: '缺少文章ID' })
    }

    const comment = await Comment.create({
      content: content.trim(),
      article,
      author: req.user.id,
      parentComment: parentComment || null
    })
    await comment.populate('author', 'username email')
    
    const result = comment.toObject()
    result.createdAt = comment.createdAt
    
    res.status(201).json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' })
    }
    
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: '无权删除' })
    }
    
    await Comment.findByIdAndDelete(req.params.id)
    res.json({ message: '删除成功' })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router