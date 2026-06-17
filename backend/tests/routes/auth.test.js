const request = require('supertest')
const createApp = require('../../app')
const User = require('../../models/User')
const { mockUser, generateTestToken } = require('../helpers/testSetup')

jest.mock('../../models/User')

const app = createApp()

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      User.findOne = jest.fn().mockResolvedValue(null)
      User.create = jest.fn().mockResolvedValue({
        ...mockUser,
        _id: mockUser._id,
        createdAt: new Date().toISOString()
      })

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('token')
      expect(res.body).toHaveProperty('status', 'success')
      expect(res.body.data).toHaveProperty('username', 'testuser')
    })

    it('should return 400 if username already exists', async () => {
      User.findOne = jest.fn().mockResolvedValue({
        ...mockUser,
        username: 'testuser'
      })

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'new@example.com',
          password: 'password123'
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('用户名已被使用')
    })

    it('should return 400 for password too short', async () => {
      User.findOne = jest.fn().mockResolvedValue(null)

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123'
        })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...mockUser,
          matchPassword: jest.fn().mockResolvedValue(true)
        })
      })

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('token')
      expect(res.body).toHaveProperty('status', 'success')
    })

    it('should return 401 for incorrect password', async () => {
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...mockUser,
          matchPassword: jest.fn().mockResolvedValue(false)
        })
      })

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })

      expect(res.status).toBe(401)
    })

    it('should return 401 for non-existent user', async () => {
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      })

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')

      expect(res.status).toBe(401)
    })
  })

  describe('Token auth flow', () => {
    it('should authenticate request with valid token', async () => {
      const token = generateTestToken()
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      })

      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'test', content: 'test content that is long enough' })

      expect(res.status).not.toBe(401)
    })
  })
})