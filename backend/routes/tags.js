const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Tag = require('../models/Tag')
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
    const tags = await Tag.find()
      .sort({ count: -1, createdAt: -1 })
    res.json(tags)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const tags = await Tag.find()
      .sort({ count: -1 })
      .limit(limit)
    res.json(tags)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, color } = req.body
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: '标签名称不能为空' })
    }
    
    const trimmedName = name.trim()
    const existingTag = await Tag.findOne({ name: trimmedName })
    
    if (existingTag) {
      return res.status(400).json({ message: '标签已存在' })
    }
    
    const tag = await Tag.create({
      name: trimmedName,
      description: description || '',
      color: color || '#667eea'
    })
    
    res.status(201).json(tag)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, color } = req.body
    const tag = await Tag.findById(req.params.id)
    
    if (!tag) {
      return res.status(404).json({ message: '标签不存在' })
    }
    
    if (name && name.trim() && name.trim() !== tag.name) {
      const existingTag = await Tag.findOne({ name: name.trim() })
      if (existingTag && existingTag._id.toString() !== tag._id.toString()) {
        return res.status(400).json({ message: '标签名称已存在' })
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
    res.json(tag)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id)
    
    if (!tag) {
      return res.status(404).json({ message: '标签不存在' })
    }
    
    await Tag.findByIdAndDelete(req.params.id)
    
    await Article.updateMany(
      { tags: tag.name },
      { $pull: { tags: tag.name } }
    )
    
    res.json({ message: '删除成功' })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

const updateTagCounts = async (tags) => {
  for (const tagName of tags) {
    const count = await Article.countDocuments({ tags: tagName })
    await Tag.findOneAndUpdate(
      { name: tagName },
      { $set: { count } },
      { upsert: true }
    )
  }
}

module.exports = router
module.exports.updateTagCounts = updateTagCounts