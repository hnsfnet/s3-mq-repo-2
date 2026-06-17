const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Article = require('../models/Article')
const Tag = require('../models/Tag')

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

router.get('/', async (req, res) => {
  try {
    const { search, tag, category } = req.query
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

    const articles = await Article.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
    res.json(articles)
  } catch (err) {
    console.error(err)
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
    const newTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []
    const article = await Article.create({
      title,
      content,
      author: req.user.id,
      category,
      tags: newTags
    })
    await article.populate('author', 'username')
    await updateTagCounts([], newTags)
    res.status(201).json(article)
  } catch (err) {
    console.error(err)
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
    const oldTags = article.tags || []
    const newTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []
    
    article.title = title
    article.content = content
    article.category = category
    article.tags = newTags
    article.updatedAt = Date.now()
    
    await article.save()
    await article.populate('author', 'username')
    await updateTagCounts(oldTags, newTags)
    res.json(article)
  } catch (err) {
    console.error(err)
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
    
    const oldTags = article.tags || []
    await Article.findByIdAndDelete(req.params.id)
    await updateTagCounts(oldTags, [])
    res.json({ message: '删除成功' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router