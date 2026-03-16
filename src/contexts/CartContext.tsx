import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product, CartItem, GoldPrice, supabase } from '../lib/supabase'

type CartContextType = {
  items: CartItem[]
  goldPrice: GoldPrice | null
  currency: 'TWD' | 'VND'
  setCurrency: (c: 'TWD' | 'VND') => void
  addToCart: (product: Product, size?: string) => void
  removeFromCart: (productId: number | string) => void
  updateQuantity: (productId: number | string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  calculatePrice: (product: Product) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('fanjin_cart')
      if (saved) {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (e) {
      console.error('Failed to parse cart from localStorage:', e)
    }
    return []
  })
  
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>({
    id: 1, price_twd: 2150, price_vnd: 1850000, recorded_at: new Date().toISOString()
  })
  
  const [currency, setCurrency] = useState<'TWD' | 'VND'>(() => {
    try {
      const saved = localStorage.getItem('fanjin_currency')
      if (saved === 'TWD' || saved === 'VND') return saved
    } catch (e) {}
    return 'TWD'
  })

  // 持久化購物車
  useEffect(() => {
    try {
      localStorage.setItem('fanjin_cart', JSON.stringify(items))
    } catch (e) {
      console.error('Failed to save cart:', e)
    }
  }, [items])

  // 持久化幣別
  useEffect(() => {
    try {
      localStorage.setItem('fanjin_currency', currency)
    } catch (e) {}
  }, [currency])

  // 獲取金價
  useEffect(() => {
    async function fetchGoldPrice() {
      try {
        const { data } = await supabase
          .from('gold_prices')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(1)
          .single()
        if (data) {
          setGoldPrice(data)
        }
      } catch (e) {
        console.error('Failed to fetch gold price:', e)
      }
    }
    fetchGoldPrice()
  }, [])

  const calculatePrice = (product: Product): number => {
    if (!goldPrice || !product) return 0
    const weight = product.weight || 0
    const laborCost = currency === 'TWD' 
      ? (product.labor_cost_twd || 0) 
      : (product.labor_cost_vnd || 0)
    const goldPricePerGram = currency === 'TWD' 
      ? (goldPrice.price_twd || 2150)
      : (goldPrice.price_vnd || 1850000)
    
    // 計算基本價格（金價 + 工費）
    const basePrice = Math.round(goldPricePerGram * weight + laborCost)
    
    // 添加加價金額（僅在TWD下顯示加價）
    const markupAmount = (product as any).markup_amount || 0
    
    return basePrice + markupAmount
  }

  const addToCart = (product: Product, size?: string) => {
    if (!product || !product.id) return
    
    // 確保商品數據完整
    const safeProduct: Product = {
      ...product,
      weight: product.weight || 0,
      labor_cost_twd: product.labor_cost_twd || 0,
      labor_cost_vnd: product.labor_cost_vnd || 0,
      size_options: Array.isArray(product.size_options) ? product.size_options : [],
      images: Array.isArray(product.images) ? product.images : [],
    }
    
    setItems(prev => {
      const existing = prev.find(i => i.product.id === safeProduct.id && i.selectedSize === size)
      if (existing) {
        return prev.map(i =>
          i.product.id === safeProduct.id && i.selectedSize === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { product: safeProduct, quantity: 1, selectedSize: size }]
    })
  }

  const removeFromCart = (productId: number | string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }

  const updateQuantity = (productId: number | string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }
    setItems(prev => prev.map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    ))
  }

  const clearCart = () => {
    setItems([])
    try {
      localStorage.removeItem('fanjin_cart')
    } catch (e) {}
  }

  const getTotal = () => {
    return items.reduce((sum, item) => {
      if (!item.product) return sum
      return sum + calculatePrice(item.product) * (item.quantity || 1)
    }, 0)
  }

  return (
    <CartContext.Provider value={{
      items, goldPrice, currency, setCurrency,
      addToCart, removeFromCart, updateQuantity, clearCart, getTotal, calculatePrice
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
