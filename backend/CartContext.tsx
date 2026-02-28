'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CartItem {
  _id: string
  product: {
    _id: string
    name: string
    price: number
    images?: { url: string; alt?: string }[]
  }
  quantity: number
}

interface CartContextType {
  cart: CartItem[] | null
  loading: boolean
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  cartCount: number
  cartTotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[] | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
          setCart([])
          setLoading(false)
        return
      }

      
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      
      if (response.ok) {
        const data = await response.json()
        setCart(data.cart?.items || [])
      } else {
        const errorData = await response.json()
        setCart([])
      }
    } catch (error) {
      setCart([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        if (window.confirm('Please login to add items to cart. Click OK to go to login page.')) {
          window.location.href = '/login'
        }
        return
      }

      const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity })
      })


      if (response.ok) {
        const data = await response.json()
        await fetchCart()
        
        // Show success message
        const successMessage = document.createElement('div')
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMessage.textContent = 'Product added to cart!'
        document.body.appendChild(successMessage)
        setTimeout(() => {
          document.body.removeChild(successMessage)
        }, 3000)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to add to cart')
      }
    } catch (error) {
      alert('Failed to add to cart')
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }

      const response = await fetch('http://localhost:5000/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity })
      })


      if (response.ok) {
        const data = await response.json()
        await fetchCart()
      } else {
        const error = await response.json()
      }
    } catch (error) {
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`http://localhost:5000/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchCart()
      }
    } catch (error) {
    }
  }

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://localhost:5000/api/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setCart([])
      }
    } catch (error) {
    }
  }

  const cartCount = cart?.reduce((total, item) => total + item.quantity, 0) || 0
  const cartTotal = cart?.reduce((total, item) => total + (item.product.price * item.quantity), 0) || 0

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
