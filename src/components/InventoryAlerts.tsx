import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, RefreshCw, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface InventoryAlert {
    id: number
    product_id: number
    agent_id: string | null
    variant_id: number | null
    alert_type: string
    current_stock: number
    min_stock: number
    is_resolved: boolean
    created_at: string
    products: {
        name: string
        sku: string
    }
    profiles: {
        full_name: string
        store_name: string
    } | null
    product_variants: {
        variant_name: string
        sku: string
    } | null
}

export default function InventoryAlerts() {
    const [alerts, setAlerts] = useState<InventoryAlert[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved')
    const [checking, setChecking] = useState(false)

    useEffect(() => {
        loadAlerts()
    }, [filter])

    const loadAlerts = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('inventory_alerts')
                .select(`
          *,
          products (name, sku),
          profiles (full_name, store_name),
          product_variants (variant_name, sku)
        `)
                .order('created_at', { ascending: false })

            if (filter === 'unresolved') {
                query = query.eq('is_resolved', false)
            } else if (filter === 'resolved') {
                query = query.eq('is_resolved', true)
            }

            const { data, error } = await query

            if (error) throw error
            setAlerts(data || [])
        } catch (error) {
            console.error('Error loading alerts:', error)
            alert('載入警報失敗')
        } finally {
            setLoading(false)
        }
    }

    const checkStockLevels = async () => {
        try {
            setChecking(true)
            const { error } = await supabase.rpc('check_low_stock_alerts')

            if (error) throw error

            alert('庫存檢查完成！')
            loadAlerts()
        } catch (error: any) {
            console.error('Error checking stock:', error)
            alert('檢查失敗：' + error.message)
        } finally {
            setChecking(false)
        }
    }

    const resolveAlert = async (alertId: number) => {
        try {
            const { error } = await supabase.rpc('resolve_inventory_alert', { alert_id: alertId })

            if (error) throw error

            alert('警報已標記為已解決')
            loadAlerts()
        } catch (error: any) {
            console.error('Error resolving alert:', error)
            alert('操作失敗：' + error.message)
        }
    }

    const getAlertTypeLabel = (type: string) => {
        return type === 'out_of_stock' ? '缺貨' : '低庫存'
    }

    const getAlertTypeColor = (type: string) => {
        return type === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
    }

    return (
        <div>
            {/* 標題 */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">庫存警報</h1>
                    <p className="text-gray-600 mt-1">監控低庫存和缺貨商品</p>
                </div>
                <button
                    onClick={checkStockLevels}
                    disabled={checking}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                >
                    <RefreshCw size={20} className={checking ? 'animate-spin' : ''} />
                    {checking ? '檢查中...' : '檢查庫存'}
                </button>
            </div>

            {/* 篩選器 */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('unresolved')}
                        className={`px-4 py-2 rounded-lg transition ${filter === 'unresolved'
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        未解決
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg transition ${filter === 'all'
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        全部
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={`px-4 py-2 rounded-lg transition ${filter === 'resolved'
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        已解決
                    </button>
                </div>
            </div>

            {/* 警報列表 */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">載入中...</p>
                </div>
            ) : alerts.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                    <Package size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                        {filter === 'unresolved' ? '沒有未解決的警報' : '暫無警報記錄'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {alerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`bg-white rounded-xl shadow p-6 ${alert.is_resolved ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* 警報類型標籤 */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAlertTypeColor(alert.alert_type)}`}>
                                            {getAlertTypeLabel(alert.alert_type)}
                                        </span>
                                        {alert.is_resolved && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                                                <CheckCircle size={14} />
                                                已解決
                                            </span>
                                        )}
                                    </div>

                                    {/* 商品資訊 */}
                                    <div className="mb-3">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {alert.products.name}
                                            {alert.product_variants && (
                                                <span className="text-sm text-gray-600 ml-2">
                                                    （{alert.product_variants.variant_name}）
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            SKU: {alert.product_variants?.sku || alert.products.sku}
                                        </p>
                                    </div>

                                    {/* 代理商資訊 */}
                                    {alert.profiles && (
                                        <div className="mb-3">
                                            <p className="text-sm text-gray-600">
                                                代理商：{alert.profiles.store_name || alert.profiles.full_name}
                                            </p>
                                        </div>
                                    )}

                                    {/* 庫存資訊 */}
                                    <div className="flex items-center gap-6 text-sm">
                                        <div>
                                            <span className="text-gray-500">當前庫存：</span>
                                            <span className={`font-semibold ml-1 ${alert.current_stock === 0 ? 'text-red-600' : 'text-yellow-600'
                                                }`}>
                                                {alert.current_stock}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">最低庫存：</span>
                                            <span className="font-semibold ml-1 text-gray-800">{alert.min_stock}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">建立時間：</span>
                                            <span className="text-gray-800 ml-1">
                                                {new Date(alert.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 操作按鈕 */}
                                {!alert.is_resolved && (
                                    <button
                                        onClick={() => resolveAlert(alert.id)}
                                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} />
                                        標記為已解決
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
