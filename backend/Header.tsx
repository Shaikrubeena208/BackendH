'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import HeaderSearch from './HeaderSearch'

export default function HeaderClean() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen || isUserMenuOpen) {
        setIsMobileMenuOpen(false)
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMobileMenuOpen, isUserMenuOpen])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="HAL-TAYYIB Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-dark-green">HAL TAYYIB</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-sage-green">
              Home
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-sage-green">
              Products
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-sage-green">
              About
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-sage-green">
              Blog
            </Link>
            <Link href="/vendor" className="text-gray-700 hover:text-sage-green">
              Become a Vendor
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-sage-green hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <HeaderSearch />

            {/* Cart Icon */}
            <Link href="/cart" className="text-gray-700 hover:text-sage-green">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </Link>

            {/* Login Button */}
            {isLoggedIn ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-sage-green"
                >
                  <div className="w-8 h-8 bg-sage-green rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">{user?.firstName || 'User'}</span>
                </button>
                <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ${isUserMenuOpen ? 'block' : 'hidden'}`}>
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Profile
                  </Link>
                  <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="bg-sage-green text-white px-4 py-2 rounded-md hover:bg-dark-green">
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" className="block px-3 py-2 rounded-md text-gray-700 hover:text-sage-green hover:bg-gray-50">
                Home
              </Link>
              <Link href="/products" className="block px-3 py-2 rounded-md text-gray-700 hover:text-sage-green hover:bg-gray-50">
                Products
              </Link>
              <Link href="/about" className="block px-3 py-2 rounded-md text-gray-700 hover:text-sage-green hover:bg-gray-50">
                About
              </Link>
              <Link href="/blog" className="block px-3 py-2 rounded-md text-gray-700 hover:text-sage-green hover:bg-gray-50">
                Blog
              </Link>
              <Link href="/vendor" className="block px-3 py-2 rounded-md text-gray-700 hover:text-sage-green hover:bg-gray-50">
                Become a Vendor
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
