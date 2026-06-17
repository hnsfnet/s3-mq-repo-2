const request = require('supertest')
const createApp = require('../../app')
const Tag = require('../../models/Tag')
const Article = require('../../models/Article')
const User = require('../../models/User')
const { mockTag, mockUser, generateTestToken, mockFindChain } = require('../helpers/testSetup')

jest.mock('../../models/Tag')
jest.mock('../../models/Article')
jest.mock('../../models/User')

const app = createApp()

describe('Tags API', () => {
  const token = generateTestToken()

  const setupAuthMock = () => {
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/tags', () => {
    it('should return a list of tags', async () => {
      Tag.find = jest.fn().mockReturnValue(mockFindChain([mockTag]))

      const res = await request(app)
        .get('/api/tags')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'success')
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('GET /api/tags/popular', () => {
    it('should return popular tags', async () => {
      Tag.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockTag])
        })
      })

      const res = await request(app)
        .get('/api/tags/popular?limit=5')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'success')
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('POST /api/tags', () => {
    it('should create a new tag with valid data', async () => {
      setupAuthMock()
      Tag.findOne = jest.fn().mockResolvedValue(null)
      Tag.create = jest.fn().mockResolvedValue(mockTag)

      const res = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'React',
          description: 'React 框架',
          color: '#61dafb'
        })

      expect([200, 201]).toContain(res.status)
    })

    it('should return 400 for duplicate tag name', async () => {
      setupAuthMock()
      Tag.findOne = jest.fn().mockResolvedValue(mockTag)

      const res = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Vue',
          description: 'Duplicate'
        })

      expect(res.status).toBe(400)
    })

    it('should return 400 for empty name', async () => {
      setupAuthMock()

      const res = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
          description: 'Empty name'
        })

      expect(res.status).toBe(400)
    })

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/tags')
        .send({
          name: 'NewTag'
        })

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /api/tags/:id', () => {
    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .delete(`/api/tags/${mockTag._id}`)

      expect(res.status).toBe(401)
    })

    it('should return 404 for non-existent tag', async () => {
      setupAuthMock()
      Tag.findById = jest.fn().mockResolvedValue(null)

      const res = await request(app)
        .delete(`/api/tags/${mockTag._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })

    it('should delete tag and update articles', async () => {
      setupAuthMock()
      Tag.findById = jest.fn().mockResolvedValue(mockTag)
      Tag.findByIdAndDelete = jest.fn().mockResolvedValue({})
      Article.updateMany = jest.fn().mockResolvedValue({})

      const res = await request(app)
        .delete(`/api/tags/${mockTag._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(Tag.findByIdAndDelete).toHaveBeenCalledWith(mockTag._id)
    })
  })
})