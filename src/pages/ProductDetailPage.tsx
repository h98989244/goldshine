import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Star, Shield, Package } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useI18n } from '../contexts/I18nContext'
import { supabase, Product } from '../lib/supabase'

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [product, setProduct] = useState<Product | null>(null)
    const [selectedSize, setSelectedSize] = useState<string>('')
    const [quantity, setQuantity] = useState(1)
    const [loading, setLoading] = useState(true)
    const { addToCart, calculatePrice, currency, updateQuantity } = useCart()
    const { t, language } = useI18n()

    useEffect(() => {
        async function fetchProduct() {
            if (!id) return

            setLoading(true)
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .eq('is_active', true)
                .single()

            if (error) {
                console.error('Error fetching product:', error)
                setLoading(false)
                return
            }

            setProduct(data)
            // 如果有尺寸選項,預設選擇第一個
            if (data.size_options && data.size_options.length > 0) {
                setSelectedSize(data.size_options[0])
            }
            setLoading(false)
        }

        fetchProduct()
    }, [id])

    const handleAddToCart = () => {
        if (!product) return

        // 如果有尺寸選項但未選擇,提示使用者
        if (product.size_options && product.size_options.length > 0 && !selectedSize) {
            alert('請選擇尺寸')
            return
        }

        // 加入購物車,然後更新數量
        addToCart(product, selectedSize)

        // 如果數量大於 1,更新數量
        if (quantity > 1 && product.id) {
            updateQuantity(product.id, quantity)
        }

        alert('已加入購物車')
    }

    const formatPrice = (product: Product) => {
        const price = calculatePrice(product)
        return currency === 'TWD' ? `NT$ ${price.toLocaleString()}` : `${price.toLocaleString()} VND`
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">找不到商品</h2>
                    <Link to="/products" className="text-amber-600 hover:underline">返回商品列表</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* 返回按鈕 */}
                <button
                    onClick={() => navigate('/products')}
                    className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-6 transition"
                >
                    <ArrowLeft size={20} />
                    <span>返回</span>
                </button>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-8 p-8">
                        {/* 商品圖片 */}
                        <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                                <img
                                    src={`${product.images[0]}?t=${Date.now()}`}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <div className={`w-32 h-32 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full opacity-80 ${product.images && product.images.length > 0 ? 'hidden' : ''}`}></div>
                            <span className="absolute top-4 right-4 bg-amber-600 text-white px-3 py-1 rounded-lg font-semibold">
                                {product.purity}
                            </span>
                        </div>

                        {/* 商品資訊 */}
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                {language === 'zh-TW' ? product.name : (product.name_vi || product.name)}
                            </h1>
                            <p className="text-gray-600 mb-4">
                                {language === 'zh-TW' ? product.description : (product.description_vi || product.description)}
                            </p>

                            {/* 商品規格 */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Package size={18} className="text-amber-600" />
                                    <span className="font-medium">{t('weight')}:</span>
                                    <span>{product.weight}g</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Star size={18} className="text-amber-600" />
                                    <span className="font-medium">{t('purity')}:</span>
                                    <span>{product.purity}</span>
                                </div>
                                {product.has_certificate && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Shield size={18} className="text-amber-600" />
                                        <span>附保證書</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-700">
                                    <span className="font-medium">商品編號:</span>
                                    <span className="text-gray-500">{product.sku}</span>
                                </div>
                            </div>

                            {/* 尺寸選擇 */}
                            {product.size_options && product.size_options.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        選擇尺寸
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {product.size_options.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2 rounded-lg border-2 transition ${selectedSize === size
                                                        ? 'border-amber-600 bg-amber-50 text-amber-600'
                                                        : 'border-gray-200 hover:border-amber-300'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 數量選擇 */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    數量
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                                    >
                                        -
                                    </button>
                                    <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                                        className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                                    >
                                        +
                                    </button>
                                    <span className="text-sm text-gray-500">
                                        庫存: {product.stock_quantity}
                                    </span>
                                </div>
                            </div>

                            {/* 價格和加入購物車 */}
                            <div className="mt-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-600">價格:</span>
                                    <span className="text-3xl font-bold text-amber-600">{formatPrice(product)}</span>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock_quantity === 0}
                                    className="w-full bg-amber-600 text-white py-4 rounded-lg font-semibold hover:bg-amber-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart size={20} />
                                    {product.stock_quantity === 0 ? '已售完' : t('addToCart')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
