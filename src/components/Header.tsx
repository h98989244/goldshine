import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, Globe } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useI18n } from '../contexts/I18nContext'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { items, currency, setCurrency, goldPrice } = useCart()
  const { language, setLanguage, t } = useI18n()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        {/* 頂部金價欄 */}
        <div className="flex justify-between items-center py-2 text-sm border-b border-amber-700/50">
          <div className="flex items-center gap-4">
            <span className="text-amber-200">{t('goldPrice')}: </span>
            <span className="font-bold text-yellow-400">
              {currency === 'TWD' ? `NT$ ${goldPrice?.price_twd}` : `${goldPrice?.price_vnd?.toLocaleString()} VND`}
              {t('perGram')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'TWD' | 'VND')}
              className="bg-amber-800 text-white text-sm rounded px-2 py-1 border border-amber-600"
            >
              <option value="TWD">TWD</option>
              <option value="VND">VND</option>
            </select>
            <button
              onClick={() => setLanguage(language === 'zh-TW' ? 'vi' : 'zh-TW')}
              className="flex items-center gap-1 hover:text-amber-200"
            >
              <Globe size={16} />
              {language === 'zh-TW' ? '繁中' : 'VI'}
            </button>
          </div>
        </div>

        {/* 主導航欄 */}
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/images/logo-wh.png"
              alt="金銀山有限公司"
              className="h-12 w-auto"
              onError={(e) => {
                // 如果圖片載入失敗，使用備用LOGO
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  const fallback = document.createElement('div')
                  fallback.className = 'w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center'
                  fallback.innerHTML = '<span className="text-amber-900 font-bold text-lg">金</span>'
                  parent.insertBefore(fallback, target)
                }
              }}
            />
            <span className="text-2xl font-bold tracking-wide">金銀山有限公司</span>
          </Link>

          {/* 桌面導航 */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={`hover:text-amber-200 transition ${isActive('/') ? 'text-yellow-400' : ''}`}>
              {t('home')}
            </Link>
            <Link to="/products" className={`hover:text-amber-200 transition ${isActive('/products') ? 'text-yellow-400' : ''}`}>
              {t('products')}
            </Link>
            <Link to="/stores" className={`hover:text-amber-200 transition ${isActive('/stores') ? 'text-yellow-400' : ''}`}>
              {t('stores')}
            </Link>
            <div className="relative group">
              <button className="hover:text-amber-200 transition cursor-pointer">
                公司資訊
              </button>
              <div className="absolute left-0 mt-2 w-40 bg-white text-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link to="/privacy-policy" className="block px-4 py-2 hover:bg-amber-50">隱私權政策</Link>
                <Link to="/terms-of-service" className="block px-4 py-2 hover:bg-amber-50">服務條款</Link>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative hover:text-amber-200">
              <ShoppingCart size={24} />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 hover:text-amber-200">
                  <User size={24} />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to="/profile" className="block px-4 py-2 hover:bg-amber-50">{t('profile')}</Link>
                  <Link to="/orders" className="block px-4 py-2 hover:bg-amber-50">{t('myOrders')}</Link>
                  <button onClick={signOut} className="block w-full text-left px-4 py-2 hover:bg-amber-50 text-red-600">
                    {t('logout')}
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="bg-yellow-500 text-amber-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
                {t('login')}
              </Link>
            )}
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* 移動端菜單 */}
        {menuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link to="/" className="block py-2 hover:text-amber-200" onClick={() => setMenuOpen(false)}>{t('home')}</Link>
            <Link to="/products" className="block py-2 hover:text-amber-200" onClick={() => setMenuOpen(false)}>{t('products')}</Link>
            <Link to="/stores" className="block py-2 hover:text-amber-200" onClick={() => setMenuOpen(false)}>{t('stores')}</Link>
            <div className="py-2">
              <span className="text-amber-200 text-sm font-medium block mb-2">公司資訊</span>
              <Link to="/privacy-policy" className="block py-1 pl-4 text-sm hover:text-amber-200" onClick={() => setMenuOpen(false)}>隱私權政策</Link>
              <Link to="/terms-of-service" className="block py-1 pl-4 text-sm hover:text-amber-200" onClick={() => setMenuOpen(false)}>服務條款</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
