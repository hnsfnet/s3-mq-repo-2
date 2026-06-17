const request = require('supertest')
const createApp = require('../../app')
const Article = require('../../models/Article')
const Tag = require('../../models/Tag')
const User = require('../../models/User')
const { mockArticle, mockUser, generateTestToken, mockFindChain } = require('../helpers/testSetup')

jest.mock('../../models/Article')
jest.mock('../../models/Tag')
jest.mock('../../models/User')

const app = createApp()

describe('Articles API', () => {
  const token = generateTestToken()

  const setupAuthMock = () => {
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/articles', () => {
    it('should return a list of articles', async () => {
      Article.find = jest.fn().mockReturnValue(mockFindChain([mockArticle]))
      Article.countDocuments = jest.fn().mockResolvedValue(1)

      const res = await request(app)
        .get('/api/articles')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'success')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(Article.find).toHaveBeenCalledWith({})
    })

    it('should filter articles by search query', async () => {
      Article.find = jest.fn().mockReturnValue(mockFindChain([mockArticle]))
      Article.countDocuments = jest.fn().mockResolvedValue(1)

      const res = await request(app)
        .get('/api/articles?search=测试')

      expect(res.status).toBe(200)
      expect(Article.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { title: expect.any(RegExp) },
            { content: expect.any(RegExp) }
          ])
        })
      )
    })

    it('should filter articles by tag', async () => {
      Article.find = jest.fn().mockReturnValue(mockFindChain([mockArticle]))
      Article.countDocuments = jest.fn().mockResolvedValue(1)

      const res = await request(app)
        .get('/api/articles?tag=Vue')

      expect(res.status).toBe(200)
      expect(Article.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: { $in: ['Vue'] }
        })
      )
    })

    it('should filter articles by category', async () => {
      Article.find = jest.fn().mockReturnValue(mockFindChain([mockArticle]))
      Article.countDocuments = jest.fn().mockResolvedValue(1)

      const res = await request(app)
        .get('/api/articles?category=技术')

      expect(res.status).toBe(200)
      expect(Article.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: '技术'
        })
      )
    })

    it('should return empty array when no articles found', async () => {
      Article.find = jest.fn().mockReturnValue(mockFindChain([]))
      Article.countDocuments = jest.fn().mockResolvedValue(0)

      const res = await request(app)
        .get('/api/articles?search=不存在的关键词')

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })
  })

  describe('GET /api/articles/:id', () => {
    it('should return a single article', async () => {
      const mockSavedArticle = {
        ...mockArticle,
        views: mockArticle.views + 1,
        save: jest.fn().mockResolvedValue({})
      }
      Article.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSavedArticle)
      })

      const res = await request(app)
        .get(`/api/articles/${mockArticle._id}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'success')
      expect(res.body.data._id).toBe(mockArticle._id)
    })

    it('should return 404 for non-existent article', async () => {
      Article.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      })

      const res = await request(app)
        .get('/api/articles/507f1f77bcf86cd799439999')

      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/articles', () => {
    it('should create a new article with valid data', async () => {
      setupAuthMock()
      Tag.findOneAndUpdate = jest.fn().mockResolvedValue({})

      const savedArticle = {
        ...mockArticle,
        populate: jest.fn().mockResolvedValue(mockArticle)
      }
      Article.create = jest.fn().mockResolvedValue(savedArticle)

      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '新文章',
          content: '这是新文章的内容，长度超过十个字符。',
          category: '技术',
          tags: 'Vue,React'
        })

      expect([200, 201]).toContain(res.status)
      expect(Article.create).toHaveBeenCalled()
    })

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({
          title: '新文章',
          content: '这是新文章的内容'
        })

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /api/articles/:id', () => {
    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .delete(`/api/articles/${mockArticle._id}`)

      expect(res.status).toBe(401)
    })

    it('should return 403 when user is not the author', async () => {
      setupAuthMock()
      Article.findById = jest.fn().mockResolvedValue({
        ...mockArticle,
        author: {
          toString: () => '507f1f77bcf86cd799439999'
        }
      })

      const res = await request(app)
        .delete(`/api/articles/${mockArticle._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(403)
    })

    it('should return 404 for non-existent article', async () => {
      setupAuthMock()
      Article.findById = jest.fn().mockResolvedValue(null)

      const res = await request(app)
        .delete(`/api/articles/${mockArticle._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })

    it('should delete article when user is the author', async () => {
      setupAuthMock()
      Article.findById = jest.fn().mockResolvedValue({
        ...mockArticle,
        author: {
          toString: () => mockUser._id
        }
      })
      Article.findByIdAndDelete = jest.fn().mockResolvedValue({})
      Tag.findOneAndUpdate = jest.fn().mockResolvedValue({})

      const res = await request(app)
        .delete(`/api/articles/${mockArticle._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(Article.findByIdAndDelete).toHaveBeenCalledWith(mockArticle._id)
    })
  })
})