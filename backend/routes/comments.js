const express = require('express')
const router = express.Router()
const Comment = require('../models/Comment')
const Article = require('../models/Article')
const { protect, optionalAuth } = require('../middleware/auth')
const { AppError, asyncHandler } = require('../middleware/errorHandler')

router.get('/article/:articleId', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query

  const comments = await Comment.find({
    article: req.params.articleId,
    parentComment: null
  })
    .populate('author', 'username email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))

  const total = await Comment.countDocuments({
    article: req.params.articleId,
    parentComment: null
  })

  res.status(200).json({
    status: 'success',
    results: comments.length,
    total,
    page: parseInt(page),
    data: comments
  })
}))

router.post('/', protect, asyncHandler(async (req, res, next) => {
  const { content, article, parentComment } = req.body

  if (!content || !content.trim()) {
    return next(new AppError('评论内容不能为空', 400))
  }

  if (!article) {
    return next(new AppError('缺少文章ID', 400))
  }

  const existingArticle = await Article.findById(article)
  if (!existingArticle) {
    return next(new AppError('文章不存在', 404))
  }

  if (parentComment) {
    const parent = await Comment.findById(parentComment)
    if (!parent) {
      return next(new AppError('父评论不存在', 404))
    }
  }

  const comment = await Comment.create({
    content: content.trim(),
    article,
    author: req.user.id,
    parentComment: parentComment || null
  })

  await comment.populate('author', 'username email')

  res.status(201).json({
    status: 'success',
    data: comment
  })
}))

router.delete('/:id', protect, asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id)

  if (!comment) {
    return next(new AppError('评论不存在', 404))
  }

  if (comment.author.toString() !== req.user.id) {
    return next(new AppError('无权删除此评论', 403))
  }

  await Comment.findByIdAndDelete(req.params.id)

  await Comment.deleteMany({ parentComment: req.params.id })

  res.status(200).json({
    status: 'success',
    message: '删除成功'
  })
}))

module.exports = router