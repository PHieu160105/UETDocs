import axios from 'axios'
import { authService } from '../api/auth'


export const testAPIConnection = async () => {
  try {
    console.log('Testing API connection...')
    const response = await axios.get('http://localhost:8080/health')
    console.log('API connection OK:', response.data)
    return true
  } catch (error) {
    console.error('API connection failed:', error.message)
    return false
  }
}

export const testLogin = async (email = 'test@example.com', password = 'password123') => {
  try {
    console.log('Testing login...')
    const response = await authService.login(email, password)
    console.log('Login successful:', response.data)
    return response.data
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message)
    return null
  }
}

export const testSignup = async (name = 'Test User', email = 'test@example.com', password = 'password123') => {
  try {
    console.log('Testing signup...')
    const response = await authService.signup(name, email, password)
    console.log('Signup successful:', response.data)
    return response.data
  } catch (error) {
    console.error('Signup failed:', error.response?.data || error.message)
    return null
  }
}

export const testLocalStorage = () => {
  const token = localStorage.getItem('token')
  const tokenExpiresAt = localStorage.getItem('token_expires_at')
  const user = localStorage.getItem('user')
  
  console.log(' localStorage:')
  console.log('  token:', token ? ' Stored' : ' Not found')
  console.log('  token_expires_at:', tokenExpiresAt || ' Not found')
  console.log('  user:', user ? ' Stored' : ' Not found')
  
  if (user) {
    console.log('  user data:', JSON.parse(user))
  }
  
  return { token: !!token, user: !!user }
}

export const testAuthService = () => {
  console.log(' Auth Service Tests:')
  console.log('  getCurrentUser:', authService.getCurrentUser())
  console.log('  getToken:', authService.getToken())
  console.log('  getTokenExpiresAt:', authService.getTokenExpiresAt?.())
  return true
}


export const runAllTests = async () => {
  console.log('Running all authentication tests...\n')
  
  const results = {
    apiConnection: await testAPIConnection(),
    localStorage: testLocalStorage(),
    authService: testAuthService(),
  }
  
  console.log('\nTest Summary:')
  console.log(results)
  
  return results
}

window.authTests = {
  testAPIConnection,
  testLogin,
  testSignup,
  testLocalStorage,
  testAuthService,
  runAllTests,
}
