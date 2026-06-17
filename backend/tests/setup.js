global.console.log = jest.fn()
global.console.error = jest.fn()

process.env.JWT_SECRET = 'secretkey'
process.env.NODE_ENV = 'test'