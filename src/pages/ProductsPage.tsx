import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, ShoppingCart } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useI18n } from '../contexts/I18nContext'
import { supabase, Product } from '../lib/supabase'

const mockProducts: Product[] = [
  { id: 1, sku: 'GN001', name: '經典黃金項鍊', name_vi: 'Day chuyen vang co dien', description: '經典設計，適合日常佩戴', description_vi: null, category_id: 1, weight: 3.75, purity: '999', labor_cost_twd: 800, labor_cost_vnd: 200000, size_options: ['45cm', '50cm', '55cm'], images: [], stock_quantity: 10, is_active: true, has_certificate: false, markup_amount: 0 },
  { id: 2, sku: 'GR001', name: '時尚黃金戒指', name_vi: 'Nhan vang thoi trang', description: '簡約時尚，百搭款式', description_vi: null, category_id: 2, weight: 2.5, purity: '999', labor_cost_twd: 600, labor_cost_vnd: 150000, size_options: ['6號', '7號', '8號', '9號', '10號'], images: [], stock_quantity: 15, is_active: true, has_certificate: true, markup_amount: 200 },
  { id: 3, sku: 'GB001', name: '優雅黃金手鐲', name_vi: 'Vong tay vang thanh lich', description: '優雅大方，適合婚嫁送禮', description_vi: null, category_id: 3, weight: 15.0, purity: '999', labor_cost_twd: 2000, labor_cost_vnd: 500000, size_options: ['16cm', '17cm', '18cm'], images: [], stock_quantity: 8, is_active: true, has_certificate: true, markup_amount: 500 },
  { id: 4, sku: 'GE001', name: '精緻黃金耳環', name_vi: 'Hoa tai vang tinh te', description: '精緻小巧，閃耀動人', description_vi: null, category_id: 4, weight: 1.2, purity: '999', labor_cost_twd: 400, labor_cost_vnd: 100000, size_options: [], images: [], stock_quantity: 20, is_active: true, has_certificate: false, markup_amount: 0 },
  { id: 5, sku: 'GN002', name: '福字黃金吊墜', name_vi: 'Mat day chuyen vang chu Phuc', description: '寓意吉祥，送禮首選', description_vi: null, category_id: 1, weight: 5.0, purity: '999', labor_cost_twd: 1000, labor_cost_vnd: 250000, size_options: [], images: [], stock_quantity: 12, is_active: true, has_certificate: true, markup_amount: 300 },
  { id: 6, sku: 'GR002', name: '龍鳳黃金對戒', name_vi: 'Nhan doi vang long phuong', description: '龍鳳呈祥，婚嫁必備', description_vi: null, category_id: 2, weight: 6.0, purity: '999', labor_cost_twd: 1500, labor_cost_vnd: 375000, size_options: ['6號', '7號', '8號', '9號', '10號'], images: [], stock_quantity: 6, is_active: true, has_certificate: true, markup_amount: 400 },
]

const categories = [
  { id: 0, name: '全部商品', name_vi: 'Tat ca san pham' },
  { id: 1, name: '黃金項鍊', name_vi: 'Day chuyen vang' },
  { id: 2, name: '黃金戒指', name_vi: 'Nhan vang' },
  { id: 3, name: '黃金手鐲', name_vi: 'Vong tay vang' },
  { id: 4, name: '黃金耳環', name_vi: 'Hoa tai vang' },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(0)
  const { addToCart, calculatePrice, currency } = useCart()
  const { t, language } = useI18n()

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').eq('is_active', true)
      if (data && data.length > 0) setProducts(data)
    }
    fetchProducts()
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name_vi && p.name_vi.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 0 || p.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatPrice = (product: Product) => {
    const price = calculatePrice(product)
    return currency === 'TWD' ? `NT$ ${price.toLocaleString()}` : `${price.toLocaleString()} VND`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('products')}</h1>

        {/* 搜尋和篩選 */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter size={20} className="text-gray-500 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-amber-50'
                }`}
              >
                {language === 'zh-TW' ? cat.name : cat.name_vi}
              </button>
            ))}
          </div>
        </div>

        {/* 商品列表 */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">{t('noProducts')}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden group">
                <Link to={`/products/${product.id}`}>
                  <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={`${product.images[0]}?t=${Date.now()}`} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full opacity-80 group-hover:scale-110 transition ${product.images && product.images.length > 0 ? 'hidden' : ''}`}></div>
                    <span className="absolute top-2 right-2 bg-amber-600 text-white text-xs px-2 py-1 rounded">
                      {product.purity}
                    </span>
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-semibold text-gray-800 mb-1 hover:text-amber-600">
                      {language === 'zh-TW' ? product.name : (product.name_vi || product.name)}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mb-2">{t('weight')}: {product.weight}g</p>
                  <div className="flex items-center justify-between">
                    <p className="text-amber-600 font-bold">{formatPrice(product)}</p>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center hover:bg-amber-200 transition"
                    >
                      <ShoppingCart size={18} className="text-amber-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
