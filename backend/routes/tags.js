const express = require('express')
const router = express.Router()
const Tag = require('../models/Tag')
const Article = require('../models/Article')
const { protect } = require('../middleware/auth')
const { AppError, asyncHandler } = require('../middleware/errorHandler')

router.get('/', asyncHandler(async (req, res) => {
  const sortBy = req.query.sortBy || 'count'
  const sortOrder = req.query.order === 'asc' ? 1 : -1

  const sortOptions = {}
  sortOptions[sortBy] = sortOrder
  if (sortBy !== 'createdAt') {
    sortOptions.createdAt = -1
  }

  const tags = await Tag.find().sort(sortOptions)

  res.status(200).json({
    status: 'success',
    results: tags.length,
    data: tags
  })
}))

router.get('/popular', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10

  const tags = await Tag.find()
    .sort({ count: -1, createdAt: -1 })
    .limit(limit)

  res.status(200).json({
    status: 'success',
    results: tags.length,
    data: tags
  })
}))

router.get('/:name', asyncHandler(async (req, res, next) => {
  const tag = await Tag.findOne({ name: req.params.name })

  if (!tag) {
    return next(new AppError('标签不存在', 404))
  }

  const articles = await Article.find({ tags: req.params.name })
    .populate('author', 'username')
    .sort({ createdAt: -1 })
    .limit(20)

  res.status(200).json({
    status: 'success',
    data: {
      tag,
      articles,
      articleCount: articles.length
    }
  })
}))

router.post('/', protect, asyncHandler(async (req, res, next) => {
  const { name, description, color } = req.body

  if (!name || !name.trim()) {
    return next(new AppError('标签名称不能为空', 400))
  }

  const trimmedName = name.trim()
  const existingTag = await Tag.findOne({ name: trimmedName })

  if (existingTag) {
    return next(new AppError('标签已存在', 400))
  }

  const tag = await Tag.create({
    name: trimmedName,
    description: description || '',
    color: color || '#667eea'
  })

  res.status(201).json({
    status: 'success',
    data: tag
  })
}))

router.put('/:id', protect, asyncHandler(async (req, res, next) => {
  const { name, description, color } = req.body
  const tag = await Tag.findById(req.params.id)

  if (!tag) {
    return next(new AppError('标签不存在', 404))
  }

  if (name && name.trim() && name.trim() !== tag.name) {
    const existingTag = await Tag.findOne({ name: name.trim() })
    if (existingTag && existingTag._id.toString() !== tag._id.toString()) {
      return next(new AppError('标签名称已存在', 400))
    }
    tag.name = name.trim()
  }

  if (description !== undefined) {
    tag.description = description
  }

  if (color) {
    tag.color = color
  }

  await tag.save()

  res.status(200).json({
    status: 'success',
    data: tag
  })
}))

router.delete('/:id', protect, asyncHandler(async (req, res, next) => {
  const tag = await Tag.findById(req.params.id)

  if (!tag) {
    return next(new AppError('标签不存在', 404))
  }

  await Tag.findByIdAndDelete(req.params.id)

  await Article.updateMany(
    { tags: tag.name },
    { $pull: { tags: tag.name } }
  )

  res.status(200).json({
    status: 'success',
    message: '删除成功'
  })
}))

module.exports = router