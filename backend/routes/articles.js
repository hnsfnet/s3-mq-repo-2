const express = require('express')
const router = express.Router()
const Article = require('../models/Article')
const Tag = require('../models/Tag')
const { protect } = require('../middleware/auth')
const { AppError, asyncHandler } = require('../middleware/errorHandler')

const updateTagCounts = async (oldTags, newTags) => {
  const allTags = [...new Set([...(oldTags || []), ...(newTags || [])])]
  for (const tagName of allTags) {
    const count = await Article.countDocuments({ tags: tagName })
    await Tag.findOneAndUpdate(
      { name: tagName },
      { $set: { count } },
      { upsert: true, setDefaultsOnInsert: true }
    )
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const { search, tag, category, sort, limit, page } = req.query
  let query = {}

  if (search) {
    const searchRegex = new RegExp(search, 'i')
    query.$or = [
      { title: searchRegex },
      { content: searchRegex }
    ]
  }

  if (tag) {
    query.tags = { $in: [tag] }
  }

  if (category) {
    query.category = category
  }

  let sortOptions = { createdAt: -1 }
  if (sort === 'views') {
    sortOptions = { views: -1, createdAt: -1 }
  } else if (sort === 'oldest') {
    sortOptions = { createdAt: 1 }
  }

  const articles = await Article.find(query)
    .populate('author', 'username email')
    .sort(sortOptions)
    .limit(limit ? parseInt(limit) : 0)
    .skip(page && limit ? (parseInt(page) - 1) * parseInt(limit) : 0)

  const total = await Article.countDocuments(query)

  res.status(200).json({
    status: 'success',
    results: articles.length,
    total,
    data: articles
  })
}))

router.get('/:id', asyncHandler(async (req, res, next) => {
  const article = await Article.findById(req.params.id)
    .populate('author', 'username email')

  if (!article) {
    return next(new AppError('文章不存在', 404))
  }

  article.views += 1
  await article.save()

  res.status(200).json({
    status: 'success',
    data: article
  })
}))

router.post('/', protect, asyncHandler(async (req, res) => {
  const { title, content, category, tags } = req.body

  if (!title || !title.trim()) {
    return next(new AppError('文章标题不能为空', 400))
  }

  if (!content || !content.trim()) {
    return next(new AppError('文章内容不能为空', 400))
  }

  const newTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []

  const article = await Article.create({
    title: title.trim(),
    content,
    author: req.user.id,
    category: category || '默认',
    tags: newTags
  })

  await article.populate('author', 'username email')
  await updateTagCounts([], newTags)

  res.status(201).json({
    status: 'success',
    data: article
  })
}))

router.put('/:id', protect, asyncHandler(async (req, res, next) => {
  const article = await Article.findById(req.params.id)

  if (!article) {
    return next(new AppError('文章不存在', 404))
  }

  if (article.author.toString() !== req.user.id) {
    return next(new AppError('无权修改此文章', 403))
  }

  const oldTags = article.tags || []
  const { title, content, category, tags } = req.body
  const newTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []

  article.title = title || article.title
  article.content = content || article.content
  article.category = category || article.category
  article.tags = newTags
  article.updatedAt = Date.now()

  await article.save()
  await article.populate('author', 'username email')
  await updateTagCounts(oldTags, newTags)

  res.status(200).json({
    status: 'success',
    data: article
  })
}))

router.delete('/:id', protect, asyncHandler(async (req, res, next) => {
  const article = await Article.findById(req.params.id)

  if (!article) {
    return next(new AppError('文章不存在', 404))
  }

  if (article.author.toString() !== req.user.id) {
    return next(new AppError('无权删除此文章', 403))
  }

  const oldTags = article.tags || []
  await Article.findByIdAndDelete(req.params.id)
  await updateTagCounts(oldTags, [])

  res.status(200).json({
    status: 'success',
    message: '删除成功'
  })
}))

module.exports = router