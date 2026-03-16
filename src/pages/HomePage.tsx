import { Link } from 'react-router-dom'
import { Shield, Truck, Award, HeadphonesIcon, ChevronRight, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useI18n } from '../contexts/I18nContext'
import { useCart } from '../contexts/CartContext'

const featuredProducts = [
  { id: 1, name: '經典黃金項鍊', weight: 3.75, image: '/images/gold-necklace-classic.jpg', fallback: '/images/gold-necklace-classic-small.jpg' },
  { id: 2, name: '時尚黃金戒指', weight: 2.5, image: '/images/gold-ring-fashion.jpg', fallback: '/images/gold-ring-fashion-small.jpg' },
  { id: 3, name: '優雅黃金手鐲', weight: 15.0, image: '/images/gold-bracelet-elegant.jpg', fallback: '/images/gold-bracelet-elegant-small.jpg' },
  { id: 4, name: '精緻黃金耳環', weight: 1.2, image: '/images/gold-earrings-delicate.jpg' },
  { id: 5, name: '福字黃金吊墜', weight: 2.8, image: '/images/gold-pendant-fortune.jpg' },
  { id: 6, name: '龍鳳黃金對戒', weight: 4.2, image: '/images/gold-rings-dragon-phoenix.jpg' },
]

export default function HomePage() {
  const { t } = useI18n()
  const { goldPrice, currency } = useCart()
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<number, boolean>>({})

  const formatPrice = (weight: number) => {
    if (!goldPrice) return '-'
    const price = currency === 'TWD'
      ? goldPrice.price_twd * weight + 500
      : goldPrice.price_vnd * weight + 100000
    return currency === 'TWD' ? `NT$ ${price.toLocaleString()}` : `${price.toLocaleString()} VND`
  }

  const handleImageLoad = (productId: number) => {
    setImageLoadingStates(prev => ({ ...prev, [productId]: true }))
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, product: any) => {
    const img = e.target as HTMLImageElement
    if (product.fallback && img.src !== product.fallback) {
      img.src = product.fallback
    } else {
      // 如果所有圖片都載入失敗，顯示備用圖標
      const parent = img.parentElement
      if (parent) {
        parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center"><div class="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full opacity-80 group-hover:scale-110 transition"></div></div>'
      }
    }
  }

  // Debug: Check LIFF Profile
  useEffect(() => {
    const checkLiff = async () => {
      try {
        if (window.liff) {
          const liffId = import.meta.env.VITE_LIFF_ID
          if (liffId && !(window.liff as any).id) {
            await window.liff.init({ liffId })
          }
          if (window.liff.isLoggedIn()) {
            const profile = await window.liff.getProfile()
            console.log('LIFF Profile:', profile)
          } else {
            console.log('LIFF Status: Not Logged In')
          }
        }
      } catch (e) {
        console.error('LIFF Debug Error:', e)
      }
    }
    checkLiff()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[360px] md:h-[420px] bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-amber-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="max-w-xl">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              璀璨金飾<br />
              <span className="text-yellow-400">傳承經典</span>
            </h1>
            <p className="text-base md:text-lg text-amber-100 mb-6">
              金銀山有限公司嚴選頂級黃金，以精湛工藝打造每一件飾品，讓您的每個重要時刻都閃耀動人。
            </p>
            <div className="flex gap-3">
              <Link
                to="/products"
                className="bg-yellow-500 text-amber-900 px-6 py-3 rounded-lg font-bold text-base hover:bg-yellow-400 transition shadow-lg"
              >
                探索商品
              </Link>
              <Link
                to="/stores"
                className="border-2 border-yellow-500 text-yellow-500 px-6 py-3 rounded-lg font-bold text-base hover:bg-yellow-500 hover:text-amber-900 transition"
              >
                門市據點
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 金價顯示 */}
      <section className="bg-gradient-to-r from-yellow-500 to-amber-500 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-amber-900">
            <div className="text-center">
              <span className="text-sm font-medium">今日國際金價 (TWD)</span>
              <p className="text-3xl font-bold">NT$ {goldPrice?.price_twd}/克</p>
            </div>
            <div className="w-px h-12 bg-amber-700/30 hidden md:block"></div>
            <div className="text-center">
              <span className="text-sm font-medium">今日國際金價 (VND)</span>
              <p className="text-3xl font-bold">{goldPrice?.price_vnd?.toLocaleString()} VND/克</p>
            </div>
          </div>
        </div>
      </section>

      {/* 服務特色 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: t('securePayment'), desc: '多元支付方式' },
              { icon: Truck, title: t('freeShipping'), desc: '滿額免運' },
              { icon: Award, title: t('qualityGuarantee'), desc: '100%純金保證' },
              { icon: HeadphonesIcon, title: t('customerService'), desc: '專業諮詢服務' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 精選商品 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800">精選商品</h2>
            <Link to="/products" className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium">
              查看全部 <ChevronRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition"
              >
                <div className="aspect-square overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${imageLoadingStates[product.id] ? 'opacity-100' : 'opacity-0'
                      }`}
                    onLoad={() => handleImageLoad(product.id)}
                    onError={(e) => handleImageError(e, product)}
                  />
                  {!imageLoadingStates[product.id] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full opacity-80"></div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">重量: {product.weight}g</p>
                  <p className="text-amber-600 font-bold">{formatPrice(product.weight)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* O2O 流程說明 */}
      <section className="py-16 bg-amber-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">線上預約，線下取貨</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '線上瀏覽選購', desc: '瀏覽商品，加入購物車，選擇心儀的金飾' },
              { step: '02', title: '預約門市取貨', desc: '選擇方便的門市與時段，預約取貨時間' },
              { step: '03', title: '門市驗貨付款', desc: '親臨門市驗貨，滿意後現場付款取貨' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl font-bold text-yellow-500/30 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-yellow-400 mb-2">{item.title}</h3>
                <p className="text-amber-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 顧客評價 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">顧客好評</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: '王小姐', text: '品質很好，服務態度也非常親切，會再來購買！', rating: 5 },
              { name: 'Nguyen', text: 'Chat luong vang rat tot, gia ca hop ly. Rat hai long!', rating: 5 },
              { name: '李先生', text: '送禮自用兩相宜，價格透明公道，推薦！', rating: 5 },
            ].map((review, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{review.text}"</p>
                <p className="font-semibold text-gray-800">- {review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
