import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ProductVariant {
    id?: number
    product_id: number
    variant_name: string
    sku: string
    price_adjustment: number
    stock_quantity: number
    is_active: boolean
    sort_order: number
}

interface ProductVariantsProps {
    productId: number
    onVariantsChange?: () => void
}

export default function ProductVariants({ productId, onVariantsChange }: ProductVariantsProps) {
    const [variants, setVariants] = useState<ProductVariant[]>([])
    const [loading, setLoading] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
    const [formData, setFormData] = useState({
        variant_name: '',
        sku: '',
        price_adjustment: 0,
        stock_quantity: 0,
        is_active: true,
        sort_order: 0
    })

    useEffect(() => {
        if (productId) {
            loadVariants()
        }
    }, [productId])

    const loadVariants = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', productId)
                .order('sort_order')

            if (error) throw error
            setVariants(data || [])
        } catch (error) {
            console.error('Error loading variants:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = () => {
        setFormData({
            variant_name: '',
            sku: '',
            price_adjustment: 0,
            stock_quantity: 0,
            is_active: true,
            sort_order: variants.length
        })
        setShowAddModal(true)
    }

    const handleEdit = (variant: ProductVariant) => {
        setSelectedVariant(variant)
        setFormData({
            variant_name: variant.variant_name,
            sku: variant.sku,
            price_adjustment: variant.price_adjustment,
            stock_quantity: variant.stock_quantity,
            is_active: variant.is_active,
            sort_order: variant.sort_order
        })
        setShowEditModal(true)
    }

    const submitAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { error } = await supabase
                .from('product_variants')
                .insert({
                    product_id: productId,
                    ...formData
                })

            if (error) throw error

            alert('變體新增成功！')
            setShowAddModal(false)
            loadVariants()
            onVariantsChange?.()
        } catch (error: any) {
            console.error('Error adding variant:', error)
            alert('新增失敗：' + error.message)
        }
    }

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedVariant) return

        try {
            const { error } = await supabase
                .from('product_variants')
                .update(formData)
                .eq('id', selectedVariant.id)

            if (error) throw error

            alert('變體更新成功！')
            setShowEditModal(false)
            loadVariants()
            onVariantsChange?.()
        } catch (error: any) {
            console.error('Error updating variant:', error)
            alert('更新失敗：' + error.message)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除此變體嗎？')) return

        try {
            const { error } = await supabase
                .from('product_variants')
                .delete()
                .eq('id', id)

            if (error) throw error

            alert('變體已刪除')
            loadVariants()
            onVariantsChange?.()
        } catch (error: any) {
            console.error('Error deleting variant:', error)
            alert('刪除失敗：' + error.message)
        }
    }

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">商品變體（尺寸選項）</h3>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm"
                >
                    <Plus size={16} />
                    新增變體
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4 text-gray-500">載入中...</div>
            ) : variants.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">暫無變體，點擊「新增變體」開始設定</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {variants.map(variant => (
                        <div key={variant.id} className="border rounded-lg p-4 flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-medium text-gray-800">{variant.variant_name}</h4>
                                    {!variant.is_active && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">已停用</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">SKU：</span>
                                        <span className="text-gray-800">{variant.sku}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">價格調整：</span>
                                        <span className={variant.price_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {variant.price_adjustment >= 0 ? '+' : ''}{variant.price_adjustment} 元
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">庫存：</span>
                                        <span className="text-gray-800">{variant.stock_quantity}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(variant)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(variant.id!)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 新增變體彈窗 */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <form onSubmit={submitAdd} className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">新增變體</h3>
                                <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <VariantForm formData={formData} setFormData={setFormData} />

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 編輯變體彈窗 */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <form onSubmit={submitEdit} className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">編輯變體</h3>
                                <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <VariantForm formData={formData} setFormData={setFormData} />

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

// 變體表單組件
function VariantForm({ formData, setFormData }: {
    formData: any
    setFormData: (data: any) => void
}) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">變體名稱 *</label>
                <input
                    type="text"
                    required
                    placeholder="例如：小、中、大、XL"
                    value={formData.variant_name}
                    onChange={(e) => setFormData({ ...formData, variant_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input
                    type="text"
                    required
                    placeholder="例如：PROD-001-S"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">價格調整（元）</label>
                <input
                    type="number"
                    step="0.01"
                    value={formData.price_adjustment}
                    onChange={(e) => setFormData({ ...formData, price_adjustment: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">正數為加價，負數為折扣</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">庫存數量</label>
                <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序順序</label>
                <input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">啟用此變體</label>
            </div>
        </div>
    )
}
