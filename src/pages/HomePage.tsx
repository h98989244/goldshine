import { Link } from 'react-router-dom'
import { Shield, Truck, Award, HeadphonesIcon, ChevronRight, ChevronLeft, Star } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useI18n } from '../contexts/I18nContext'
import { useCart } from '../contexts/CartContext'

// Hero 輪播背景圖片
const heroImages = [
  '/images/gold-necklace-classic.jpg',
  '/images/gold-ring-fashion.jpg',
  '/images/gold-bracelet-elegant.jpg',
  '/images/gold-earrings-delicate.jpg',
  '/images/gold-pendant-fortune.jpg',
  '/images/gold-rings-dragon-phoenix.jpg',
]

const featuredProducts = [
  { id: 1, name: '經典黃金項鍊', weight: 3.75, image: '/images/gold-necklace-classic-small.jpg' },
  { id: 2, name: '時尚黃金戒指', weight: 2.5, image: '/images/gold-ring-fashion-small.jpg' },
  { id: 3, name: '優雅黃金手鐲', weight: 15.0, image: '/images/gold-bracelet-elegant-small.jpg' },
  { id: 4, name: '精緻黃金耳環', weight: 1.2, image: '/images/gold-earrings-delicate.jpg' },
  { id: 5, name: '福字黃金吊墜', weight: 2.8, image: '/images/gold-pendant-fortune.jpg' },
  { id: 6, name: '龍鳳黃金對戒', weight: 4.2, image: '/images/gold-rings-dragon-phoenix.jpg' },
]

export default function HomePage() {
  const { t } = useI18n()
  const { goldPrice, currency } = useCart()
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  const [heroIndex, setHeroIndex] = useState(0)
  const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  // Hero 自動輪播
  useEffect(() => {
    heroTimerRef.current = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImages.length)
    }, 4000)
    return () => {
      if (heroTimerRef.current) clearInterval(heroTimerRef.current)
    }
  }, [])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  const formatPrice = (weight: number) => {
    if (!goldPrice) return '-'
    const price = currency === 'TWD'
      ? goldPrice.price_twd * weight + 500
      : goldPrice.price_vnd * weight + 100000
    return currency === 'TWD' ? `NT$ ${price.toLocaleString()}` : `${price.toLocaleString()} VND`
  }

  const handleImageError = (productId: number) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - 左文右圖輪播 */}
      <section className="relative bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 overflow-hidden py-10 md:py-16">
        {/* 裝飾光暈 */}
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/5 rounded-full blur-2xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-8 md:gap-12 z-10">
          {/* 左側文字 */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
              璀璨金飾<br />
              <span className="text-yellow-400">傳承經典</span>
            </h1>
            <p className="text-base md:text-lg text-gray-200 mb-6 drop-shadow">
              金銀山有限公司嚴選頂級黃金，以精湛工藝打造每一件飾品，讓您的每個重要時刻都閃耀動人。
            </p>
            <div className="flex gap-3 justify-center md:justify-start">
              <Link
                to="/products"
                className="bg-yellow-500 text-amber-900 px-6 py-3 rounded-lg font-bold text-base hover:bg-yellow-400 transition shadow-lg"
              >
                探索商品
              </Link>
              <Link
                to="/stores"
                className="border-2 border-white/80 text-white px-6 py-3 rounded-lg font-bold text-base hover:bg-white/20 transition"
              >
                門市據點
              </Link>
            </div>
          </div>

          {/* 右側商品圖片輪播 */}
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              {heroImages.map((img, i) => (
                <div
                  key={i}
                  className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                  style={{ opacity: heroIndex === i ? 1 : 0 }}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
              ))}
              {/* 圖片底部金色光暈 */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-yellow-500/20 rounded-full blur-xl"></div>
            </div>
            {/* 輪播指示點 */}
            <div className="flex gap-2 mt-6">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setHeroIndex(i)
                    if (heroTimerRef.current) clearInterval(heroTimerRef.current)
                    heroTimerRef.current = setInterval(() => {
                      setHeroIndex(prev => (prev + 1) % heroImages.length)
                    }, 4000)
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${heroIndex === i ? 'bg-yellow-400 w-6' : 'bg-white/50 hover:bg-white/80'}`}
                />
              ))}
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
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">精選商品</h2>
            <Link to="/products" className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium text-sm">
              查看全部 <ChevronRight size={18} />
            </Link>
          </div>
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="flex-[0_0_45%] md:flex-[0_0_23%] min-w-0 bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition"
                  >
                    <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-amber-100 to-amber-200">
                      {imageErrors[product.id] ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full opacity-80"></div>
                        </div>
                      ) : (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="eager"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={() => handleImageError(product.id)}
                        />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 text-sm mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-1">重量: {product.weight}g</p>
                      <p className="text-amber-600 font-bold text-sm">{formatPrice(product.weight)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            {canScrollPrev && (
              <button
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition z-10"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
            )}
            {canScrollNext && (
              <button
                onClick={() => emblaApi?.scrollNext()}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition z-10"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            )}
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
