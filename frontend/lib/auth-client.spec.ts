// Test the actual auth-client configuration
// Note: This file tests the module exports from better-auth/react
// Since better-auth creates complex client objects, we verify the structure

describe('auth-client', () => {
  beforeAll(() => {
    // Import the actual module to test
    jest.isolateModules(() => {
      require('./auth-client')
    })
  })

  it('module can be imported', () => {
    expect(() => require('./auth-client')).not.toThrow()
  })

  it('exports authClient', () => {
    const module = require('./auth-client')
    expect(module.authClient).toBeDefined()
  })

  it('authClient has signIn method', () => {
    const { authClient } = require('./auth-client')
    expect(authClient.signIn).toBeDefined()
    expect(typeof authClient.signIn.email).toBe('function')
  })

  it('authClient has signUp method', () => {
    const { authClient } = require('./auth-client')
    expect(authClient.signUp).toBeDefined()
    expect(typeof authClient.signUp.email).toBe('function')
  })

  it('authClient has signOut method', () => {
    const { authClient } = require('./auth-client')
    expect(typeof authClient.signOut).toBe('function')
  })

  it('authClient has getSession method', () => {
    const { authClient } = require('./auth-client')
    expect(typeof authClient.getSession).toBe('function')
  })

  it('authClient has emailOtp methods', () => {
    const { authClient } = require('./auth-client')
    expect(authClient.emailOtp).toBeDefined()
    expect(typeof authClient.emailOtp.sendVerificationOtp).toBe('function')
    expect(typeof authClient.emailOtp.verifyEmail).toBe('function')
    expect(typeof authClient.emailOtp.resetPassword).toBe('function')
  })

  it('authClient has organization methods', () => {
    const { authClient } = require('./auth-client')
    expect(authClient.organization).toBeDefined()
    expect(typeof authClient.organization.list).toBe('function')
    expect(typeof authClient.organization.create).toBe('function')
  })

  it('authClient has twoFactor methods', () => {
    const { authClient } = require('./auth-client')
    expect(authClient.twoFactor).toBeDefined()
    expect(typeof authClient.twoFactor.enableTotp).toBe('function')
    expect(typeof authClient.twoFactor.disableTotp).toBe('function')
  })

  it('authClient has useActive hook', () => {
    const { authClient } = require('./auth-client')
    expect(typeof authClient.useActive).toBe('function')
  })

  it('authClient has user Sessions', () => {
    const { authClient } = require('./auth-client')
    expect(authClient.user.Sessions).toBeDefined()
    expect(typeof authClient.user.Sessions.list).toBe('function')
    expect(typeof authClient.user.Sessions.revoke).toBe('function')
  })
})
