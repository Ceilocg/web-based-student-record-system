import React, { useState } from 'react'
import { auth } from '../firebaseConfig'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('error')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err) {
      setSnackbarMessage('Failed to log in. Please check your credentials.')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setSnackbarMessage('Please enter your email to reset your password.')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setSnackbarMessage('Password reset email sent. Please check your inbox.')
      setSnackbarSeverity('success')
      setOpenSnackbar(true)
    } catch (error) {
      setSnackbarMessage('Error sending password reset email. Please try again.')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
    }
  }

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Form Area with Background Image */}
      <div
        className="w-3/4 flex flex-col justify-center items-center p-12 relative"
        style={{
          backgroundImage: 'url("https://www.panaynews.net/wp-content/uploads/2019/10/DEPED-Salong-National-High-School-in-Kabankalan-City-Negros-Occidental.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(0px)',
        }}
      >
        <div className="bg-gray-800 bg-opacity-75 p-12 rounded-lg text-white relative z-10">
          <h1 className="text-4xl font-bold mb-2 text-center">Valentina B. Boncan</h1>
          <h2 className="text-3xl mb-8 text-center">National High School</h2>
          <h3 className="text-3xl mb-6 text-center">Log In</h3>

          <form onSubmit={handleLogin} className="w-full max-w-md">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded bg-gray-600 text-white placeholder-gray-400"
              required
            />
            <div className="relative w-full mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-gray-700 text-white placeholder-gray-400"
                required
              />
              <span
                className="absolute right-3 top-3 cursor-pointer text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button
              type="submit"
              className="w-full p-2 mb-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => navigate('/request-form')}
              className="w-full p-2 mb-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
            >
              Certificate request
            </button>
            <a
              href="#"
              onClick={handleForgotPassword}
              className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Forgot Password?
            </a>
          </form>
        </div>
      </div>

      {/* Sidebar Area */}
      <div className="w-1/4 bg-white flex flex-col justify-between items-center p-12">
        <button
          type="button"
          onClick={() => navigate('/about')}
          className="text-3xl font-bold bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          About Us
        </button>

        <a href="https://ibb.co/qBFMV75" target="_blank" rel="noopener noreferrer">
          <img
            src="https://i.ibb.co/qBFMV75/school-logo.png" // Replace with the correct image URL
            alt="Valentina B. Boncan National High School Logo"
            className="w-70 h-55"
          />
        </a>

        <div className="text-center">
          <div className="flex justify-center space-x-4 mb-2">
            <a
              href="https://web.facebook.com/gatenhsofficial"
              className="flex items-center hover:text-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>

            <a
              href="mailto:gatenhsoffial@gmail.com"
              className="flex items-center hover:text-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <svg className="w-6 h-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email
            </a>
          </div>
          <p className="text-sm text-gray-600">
            2023-2024 © Valentina B. Boncan National High School
          </p>
        </div>
      </div>

      {/* Snackbar for Alerts */}
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  )
}
