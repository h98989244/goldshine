import { useState, useEffect } from 'react'
import { Package, AlertCircle, Save, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Agent {
    id: string
    full_name: string
    email: string
    phone: string
}

interface InventoryItem {
    id: number
    product_id: number
    stock_quantity: number
    min_stock: number
    products: {
        id: number
        name: string
        sku: string
        labor_cost_twd: number
    }
}

export default function InventoryAdmin() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadAgents()
    }, [])

    useEffect(() => {
        if (selectedAgent) {
            loadInventory(selectedAgent.id)
        }
    }, [selectedAgent])

    const loadAgents = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone')
                .eq('role', 'agent')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            console.log('Loaded agents:', data)
            setAgents(data || [])
            if (data && data.length > 0) {
                setSelectedAgent(data[0])
            }
        } catch (err: any) {
            console.error('Error loading agents:', err)
            setError(`載入代理商失敗：${err.message || '未知錯誤'}`)
        }
    }

    const loadInventory = async (agentId: string) => {
        try {
            setLoading(true)
            setError(null)

            console.log('Loading inventory for agent:', agentId)

            // 先獲取庫存
            const { data: inventoryData, error: invError } = await supabase
                .from('agent_inventory')
                .select(`
          *,
          products (
            id,
            name,
            sku,
            labor_cost_twd
          )
        `)
                .eq('agent_id', agentId)

            if (invError) {
                console.error('Inventory query error:', invError)
                throw invError
            }

            console.log('Inventory data:', inventoryData)

            // 如果沒有庫存記錄，初始化
            if (!inventoryData || inventoryData.length === 0) {
                console.log('No inventory found, initializing...')
                await initializeInventory(agentId)
                await loadInventory(agentId) // 重新載入
                return
            }

            setInventory(inventoryData)
        } catch (err: any) {
            console.error('Error loading inventory:', err)
            setError(`載入庫存失敗：${err.message || '未知錯誤'}`)
        } finally {
            setLoading(false)
        }
    }

    const initializeInventory = async (agentId: string) => {
        // 獲取所有啟用的商品
        const { data: products } = await supabase
            .from('products')
            .select('id')
            .eq('is_active', true)

        if (!products) return

        // 為每個商品建立庫存記錄
        const inventoryRecords = products.map(p => ({
            agent_id: agentId,
            product_id: p.id,
            stock_quantity: 0,
            min_stock: 0
        }))

        await supabase
            .from('agent_inventory')
            .upsert(inventoryRecords, {
                onConflict: 'agent_id,product_id',
                ignoreDuplicates: true
            })
    }

    const updateInventoryItem = (productId: number, field: 'stock_quantity' | 'min_stock', value: number) => {
        setInventory(prev =>
            prev.map(item =>
                item.product_id === productId
                    ? { ...item, [field]: Math.max(0, value) }
                    : item
            )
        )
    }

    const saveInventory = async () => {
        if (!selectedAgent) return

        try {
            setSaving(true)
            setError(null)

            const updates = inventory.map(item => ({
                agent_id: selectedAgent.id,
                product_id: item.product_id,
                stock_quantity: item.stock_quantity,
                min_stock: item.min_stock,
                updated_at: new Date().toISOString()
            }))

            const { error: updateError } = await supabase
                .from('agent_inventory')
                .upsert(updates, {
                    onConflict: 'agent_id,product_id'
                })

            if (updateError) throw updateError

            alert('庫存保存成功！')
        } catch (err: any) {
            console.error('Error saving inventory:', err)
            setError('保存失敗，請重試')
            alert('保存失敗，請重試')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            {/* 標題 */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">庫存管理</h1>
                <p className="text-gray-600 mt-1">設定各代理商的商品庫存數量</p>
            </div>

            {/* 錯誤提示 */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左側：代理商選擇器 */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">選擇代理商</h2>
                        {agents.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                                <p>暫無代理商</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {agents.map(agent => (
                                    <button
                                        key={agent.id}
                                        onClick={() => setSelectedAgent(agent)}
                                        className={`w-full p-4 rounded-lg border-2 transition text-left ${selectedAgent?.id === agent.id
                                            ? 'border-amber-500 bg-amber-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <p className="font-medium text-gray-800">{agent.full_name || '未命名代理商'}</p>
                                        <p className="text-sm text-gray-600 mt-1">{agent.email}</p>
                                        {agent.phone && (
                                            <p className="text-sm text-gray-500 mt-1">{agent.phone}</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 右側：庫存編輯器 */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">
                                庫存設定 - {selectedAgent?.full_name || '請選擇代理商'}
                            </h2>
                            <button
                                onClick={saveInventory}
                                disabled={!selectedAgent || saving}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={16} />
                                {saving ? '保存中...' : '保存庫存'}
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <RefreshCw size={32} className="mx-auto mb-4 text-amber-600 animate-spin" />
                                <p className="text-gray-500">載入中...</p>
                            </div>
                        ) : !selectedAgent ? (
                            <div className="text-center py-12 text-gray-500">
                                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                                <p>請先選擇代理商</p>
                            </div>
                        ) : inventory.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                                <p>該代理商暫無商品庫存</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                {inventory.map(item => (
                                    <div
                                        key={item.product_id}
                                        className="border rounded-lg p-4 hover:border-amber-300 transition"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-medium text-gray-800">
                                                    {item.products.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">SKU: {item.products.sku}</p>
                                                <p className="text-sm text-gray-500">工費: NT$ {item.products.labor_cost_twd?.toLocaleString() || 0}</p>
                                            </div>
                                            {item.stock_quantity === 0 && (
                                                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full flex items-center gap-1">
                                                    <AlertCircle size={12} />
                                                    缺貨
                                                </span>
                                            )}
                                            {item.stock_quantity > 0 && item.stock_quantity <= item.min_stock && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full flex items-center gap-1">
                                                    <AlertCircle size={12} />
                                                    低庫存
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    庫存數量
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.stock_quantity}
                                                    onChange={(e) => updateInventoryItem(
                                                        item.product_id,
                                                        'stock_quantity',
                                                        parseInt(e.target.value) || 0
                                                    )}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    最低庫存
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.min_stock}
                                                    onChange={(e) => updateInventoryItem(
                                                        item.product_id,
                                                        'min_stock',
                                                        parseInt(e.target.value) || 0
                                                    )}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
