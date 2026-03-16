import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useI18n } from '../contexts/I18nContext'

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotal, calculatePrice, currency, clearCart } = useCart()
  const { t, language } = useI18n()

  const formatPrice = (price: number) => {
    return currency === 'TWD' ? `NT$ ${price.toLocaleString()}` : `${price.toLocaleString()} VND`
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={80} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">{t('emptyCart')}</h2>
          <Link
            to="/products"
            className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
          >
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('cart')}</h1>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {items.map((item, idx) => (
            <div
              key={`${item.product.id}-${item.selectedSize}`}
              className={`flex items-center gap-4 p-4 ${idx !== items.length - 1 ? 'border-b' : ''}`}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full opacity-80"></div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">
                  {language === 'zh-TW' ? item.product.name : (item.product.name_vi || item.product.name)}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('weight')}: {item.product.weight}g
                  {item.selectedSize && ` | ${t('selectSize')}: ${item.selectedSize}`}
                </p>
                <p className="text-amber-600 font-semibold">{formatPrice(calculatePrice(item.product))}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.product.id)}
                className="text-red-500 hover:text-red-600 p-2"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center text-lg mb-4">
            <span className="text-gray-600">{t('total')}</span>
            <span className="text-2xl font-bold text-amber-600">{formatPrice(getTotal())}</span>
          </div>

          <Link
            to="/checkout"
            className="block w-full bg-amber-600 text-white text-center py-4 rounded-lg font-semibold text-lg hover:bg-amber-700 transition"
          >
            {t('reservePickup')}
          </Link>

          <button
            onClick={clearCart}
            className="block w-full mt-3 text-gray-500 hover:text-gray-700 text-center py-2"
          >
            清空購物車
          </button>
        </div>
      </div>
    </div>
  )
}
