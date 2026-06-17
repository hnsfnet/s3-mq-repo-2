const request = require('supertest')
const createApp = require('../../app')
const Comment = require('../../models/Comment')
const Article = require('../../models/Article')
const User = require('../../models/User')
const { mockComment, mockArticle, mockUser, generateTestToken, mockFindChain } = require('../helpers/testSetup')

jest.mock('../../models/Comment')
jest.mock('../../models/Article')
jest.mock('../../models/User')

const app = createApp()

describe('Comments API', () => {
  const token = generateTestToken()

  const setupAuthMock = () => {
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/comments/article/:articleId', () => {
    it('should return comments for an article', async () => {
      Comment.find = jest.fn().mockReturnValue(mockFindChain([mockComment]))
      Comment.countDocuments = jest.fn().mockResolvedValue(1)

      const res = await request(app)
        .get(`/api/comments/article/${mockComment.article}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'success')
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should return empty array when no comments', async () => {
      Comment.find = jest.fn().mockReturnValue(mockFindChain([]))
      Comment.countDocuments = jest.fn().mockResolvedValue(0)

      const res = await request(app)
        .get(`/api/comments/article/${mockComment.article}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })
  })

  describe('POST /api/comments', () => {
    it('should create a comment with valid data', async () => {
      setupAuthMock()
      Article.findById = jest.fn().mockResolvedValue(mockArticle)
      const createdComment = {
        ...mockComment,
        populate: jest.fn().mockResolvedValue({
          ...mockComment.toObject(),
          author: { username: 'testuser', email: 'test@example.com' }
        })
      }
      Comment.create = jest.fn().mockResolvedValue(createdComment)

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '这是一条新评论',
          article: mockComment.article
        })

      expect([200, 201]).toContain(res.status)
      expect(Comment.create).toHaveBeenCalled()
    })

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/comments')
        .send({
          content: '测试评论',
          article: mockComment.article
        })

      expect(res.status).toBe(401)
    })

    it('should return 400 for empty content', async () => {
      setupAuthMock()

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '',
          article: mockComment.article
        })

      expect(res.status).toBe(400)
    })

    it('should return 400 for missing article', async () => {
      setupAuthMock()

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '测试评论'
        })

      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/comments/:id', () => {
    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .delete(`/api/comments/${mockComment._id}`)

      expect(res.status).toBe(401)
    })

    it('should return 404 for non-existent comment', async () => {
      setupAuthMock()
      Comment.findById = jest.fn().mockResolvedValue(null)

      const res = await request(app)
        .delete(`/api/comments/${mockComment._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })
})