import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setUser } from '../redux/userSlice'
import axios from 'axios'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  let dispatch = useDispatch()
 

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }
    try {
      setLoading(true)
      setError(null)
      
      console.log('Sending login request with:', { email: formData.email });
      
      const response = await axios.post('http://localhost:3000/api/auth/login', 
        {
          email: formData.email,
          password: formData.password
        },
        {
          withCredentials: true, 
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Login response:', response.data);

      const { user } = response.data;

      if (user) {
        console.log('Setting user data:', user);
        dispatch(setUser(user));
      } else {
        throw new Error('No user data received from server');
      }

    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
      {/* Abstract blurred shape */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 opacity-40 rounded-full filter blur-3xl z-0"></div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 opacity-30 rounded-full filter blur-2xl z-0"></div>
      {/* Glassmorphism card */}
      <div className="max-w-md w-full relative z-10 bg-white/30 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-white/40">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-6 px-6">
          <h2 className="text-3xl font-bold text-white text-center">Login</h2>
          <p className="text-blue-100 text-center mt-2">Welcome back! Sign in to chat</p>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="xyz@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login