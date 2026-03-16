import { useState, useEffect, useRef } from 'react'
import { MapPin, Phone, Clock, Navigation, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../contexts/I18nContext'
import { useCart } from '../contexts/CartContext'
import { supabase, Store } from '../lib/supabase'
import StoreCardMap from '../components/StoreCardMap'


export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const mapRef = useRef<HTMLDivElement>(null)
  const { t, language } = useI18n()
  const { items } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchStores() {
      const { data } = await supabase
        .from('profiles')
        .select('id, store_name, store_name_vi, store_address, store_address_vi, store_phone, store_business_hours, full_name, phone, latitude, longitude')
        .eq('role', 'agent')
        .eq('is_store_visible', true)
        .order('created_at', { ascending: false })
      if (data && data.length > 0) setStores(data)
    }
    fetchStores()
  }, [])

  // 初始化 Google Maps
  useEffect(() => {
    if (!mapRef.current || !window.google || stores.length === 0) return

    // 計算地圖中心點(所有門市的平均位置)
    const validStores = stores.filter(s => s.latitude && s.longitude)
    if (validStores.length === 0) return

    const avgLat = validStores.reduce((sum, s) => sum + (s.latitude || 0), 0) / validStores.length
    const avgLng = validStores.reduce((sum, s) => sum + (s.longitude || 0), 0) / validStores.length

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: avgLat, lng: avgLng },
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    })

    setMap(newMap)

    // 為每個門市新增標記
    const newMarkers = validStores.map(store => {
      const marker = new window.google.maps.Marker({
        position: { lat: store.latitude!, lng: store.longitude! },
        map: newMap,
        title: language === 'zh-TW' ? store.store_name : (store.store_name_vi || store.store_name),
        animation: window.google.maps.Animation.DROP,
      })

      // 點擊標記顯示資訊視窗
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${language === 'zh-TW' ? store.store_name : (store.store_name_vi || store.store_name)}</h3>
            <p style="font-size: 12px; color: #666;">${language === 'zh-TW' ? store.store_address : (store.store_address_vi || store.store_address)}</p>
            <p style="font-size: 12px; color: #666;">${store.store_phone}</p>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(newMap, marker)
        // 滾動到對應的門市卡片
        const storeCard = document.getElementById(`store-${store.id}`)
        storeCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })

      return marker
    })

    setMarkers(newMarkers)

    return () => {
      newMarkers.forEach(marker => marker.setMap(null))
    }
  }, [stores, language])

  const handleReserve = (store: Store) => {
    if (items.length === 0) {
      alert('請先將商品加入購物車再預約取貨')
      navigate('/products')
      return
    }
    setSelectedStore(store)
    setShowReserveModal(true)
  }

  const confirmReserve = () => {
    setShowReserveModal(false)
    navigate('/checkout')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('stores')}</h1>
        <p className="text-gray-500 mb-8">歡迎蒞臨金銀山有限公司門市，體驗頂級服務</p>

        {/* 地圖區域 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div
            ref={mapRef}
            className="h-96 bg-gray-100"
          >
            {!window.google && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin size={40} className="text-amber-600" />
                  </div>
                  <p className="text-amber-800 font-medium">載入地圖中...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 門市卡片 */}
        <div className="grid md:grid-cols-2 gap-6">
          {stores.map(store => (
            <div key={store.id} id={`store-${store.id}`} className="bg-white rounded-xl shadow-md overflow-hidden">
              <StoreCardMap
                latitude={store.latitude}
                longitude={store.longitude}
                storeName={language === 'zh-TW' ? store.store_name : (store.store_name_vi || store.store_name)}
              />
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {language === 'zh-TW' ? store.store_name : (store.store_name_vi || store.store_name)}
                </h2>
                <div className="space-y-3 text-gray-600 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-amber-600 mt-1 flex-shrink-0" size={18} />
                    <span>{language === 'zh-TW' ? store.store_address : (store.store_address_vi || store.store_address)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-amber-600 flex-shrink-0" size={18} />
                    <span>{store.store_phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="text-amber-600 flex-shrink-0" size={18} />
                    <span>{store.store_business_hours || '10:00 - 21:00 (週一至週日)'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={store.latitude && store.longitude
                      ? `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.store_address || '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Navigation size={18} />
                    導航
                  </a>
                  <button
                    onClick={() => handleReserve(store)}
                    className="flex items-center justify-center gap-2 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition"
                  >
                    <Calendar size={18} />
                    預約取貨
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* O2O 流程說明 */}
        <div className="mt-12 bg-amber-50 rounded-xl p-8">
          <h3 className="text-xl font-bold text-amber-800 mb-6 text-center">O2O 預約取貨流程</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: '線上選購', desc: '瀏覽商品並加入購物車' },
              { step: '2', title: '選擇門市', desc: '選擇方便的取貨門市' },
              { step: '3', title: '預約時間', desc: '選擇取貨日期和時段' },
              { step: '4', title: '門市取貨', desc: '現場驗貨滿意後付款' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  {item.step}
                </div>
                <h4 className="font-semibold text-amber-800 mb-1">{item.title}</h4>
                <p className="text-sm text-amber-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 預約確認彈窗 */}
      {showReserveModal && selectedStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">確認預約門市</h3>
            <div className="bg-amber-50 rounded-lg p-4 mb-6">
              <p className="font-semibold text-gray-800">{selectedStore.store_name}</p>
              <p className="text-sm text-gray-600">{selectedStore.store_address}</p>
            </div>
            <p className="text-gray-600 mb-6">
              您的購物車有 <span className="font-bold text-amber-600">{items.length}</span> 件商品，
              確認要在此門市預約取貨嗎？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReserveModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmReserve}
                className="flex-1 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                確認預約
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
