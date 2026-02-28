'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useCart } from '../../contexts/CartContext'

export default function CartPage() {
  const { cart, loading, updateQuantity, removeFromCart } = useCart()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null)

  const total = cart?.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) || 0

  const handleBuyNow = async () => {
    try {
      setPaymentLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:5000/api/cart/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const orderData = await response.json()
        setRazorpayOrder(orderData)
        setShowPaymentModal(true)
      } else {
        alert('Failed to create payment order')
      }
    } catch (error) {
      alert('Error creating payment order')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleRazorpayPayment = () => {
    if (!razorpayOrder) return

    const options = {
      key: razorpayOrder.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'HAL TAYYIB',
      description: 'Purchase of Halal Products',
      order_id: razorpayOrder.orderId,
      handler: async function (response: any) {
        try {
          const token = localStorage.getItem('token')
          const verifyResponse = await fetch('http://localhost:5000/api/cart/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpayOrderId: razorpayOrder.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              cartItems: razorpayOrder.cartItems,
              totalAmount: razorpayOrder.totalAmount
            })
          })

          if (verifyResponse.ok) {
            alert('Payment successful! Order placed.')
            setShowPaymentModal(false)
          } else {
            alert('Payment verification failed')
          }
        } catch (error) {
          alert('Error verifying payment')
        }
      },
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#22c55e'
      }
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  }

  const handleCOD = async () => {
    try {
      const token = localStorage.getItem('token')
      const shippingAddress = {
        street: 'Customer Address',
        city: 'City',
        state: 'State',
        pincode: '123456',
        phone: '9999999999'
      }

      const response = await fetch('http://localhost:5000/api/cart/cod-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shippingAddress })
      })

      if (response.ok) {
        alert('Cash on Delivery order placed successfully!')
        setShowPaymentModal(false)
      } else {
        alert('Failed to place COD order')
      }
    } catch (error) {
      alert('Error placing COD order')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sage-green"></div>
            <p className="mt-2 text-gray-600">Loading cart...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Shopping Cart</h1>
        
        {!cart || cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5H7m0 8l1.6-8m6.4 8l1.6-8" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any products yet</p>
            <Link href="/products" className="bg-sage-green text-white px-6 py-3 rounded-md hover:bg-dark-green">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                {cart.map((item) => (
                  <div key={item._id} className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 py-4 border-b last:border-b-0">
                    {/* Product Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images[0] ? (
                        <img 
                          src={item.product.images[0].url} 
                          alt={item.product.images[0].alt || item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-gray-600">${item.product.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        className="w-8 h-8 sm:w-8 sm:h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        className="w-8 h-8 sm:w-8 sm:h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.product._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold text-gray-900 mb-6">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  <button 
                    onClick={() => handleBuyNow()}
                    disabled={paymentLoading}
                    className="w-full bg-sage-green text-white py-3 rounded-md hover:bg-dark-green disabled:opacity-50"
                  >
                    {paymentLoading ? 'Processing...' : 'Buy Now'}
                  </button>

                  <Link 
                    href="/checkout"
                    className="w-full border border-sage-green text-sage-green py-3 rounded-md hover:bg-sage-green hover:text-white text-center block mt-2"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Payment Method</h2>
              
              <div className="space-y-4">
                {/* Razorpay Payment */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">R</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Razorpay</h3>
                      <p className="text-sm text-gray-600">Pay with UPI, Cards, Wallets</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRazorpayPayment}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                  >
                    Pay with Razorpay
                  </button>
                </div>

                {/* Cash on Delivery */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">₹</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Cash on Delivery</h3>
                      <p className="text-sm text-gray-600">Pay when you receive</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCOD}
                    className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                  >
                    Cash on Delivery
                  </button>
                </div>

                {/* Other Payment Options */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">P</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">PhonePe / GPay</h3>
                      <p className="text-sm text-gray-600">Coming soon</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 rounded-md cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total Amount:</span>
                  <span>₹{razorpayOrder?.totalAmount || total}</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full mt-4 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}
