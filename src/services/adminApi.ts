import { supabase } from '../lib/supabase'

// ==================== Dashboard ====================
export async function getDashboardStats() {
    const { data, error } = await supabase.rpc('get_dashboard_stats')
    if (error) throw error
    return data
}

export async function getOrdersByDate(daysCount: number = 7) {
    const { data, error } = await supabase.rpc('get_orders_by_date', { days_count: daysCount })
    if (error) throw error
    return data
}

// ==================== Orders ====================
export async function listOrders(params: {
    page?: number
    limit?: number
    status?: string
    search?: string
    startDate?: string
    endDate?: string
}) {
    let query = supabase
        .from('orders')
        .select(`
      *,
      order_items(*, products(name, sku)),
      profiles:profiles!orders_user_id_fkey(email, full_name, phone)
    `, { count: 'exact' })
        .order('created_at', { ascending: false })

    // 鐙€鎱嬬閬?
    if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status)
    }

    // 鎼滃皨锛堣▊鍠櫉銆乪mail銆侀浕瑭憋級
    if (params.search) {
        query = query.or(`order_number.ilike.%${params.search}%`)
    }

    // 鏃ユ湡绡勫湇
    if (params.startDate) {
        query = query.gte('created_at', params.startDate)
    }
    if (params.endDate) {
        query = query.lte('created_at', params.endDate)
    }

    // 鍒嗛爜
    const page = params.page || 1
    const limit = params.limit || 20
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return { data, count }
}

export async function getOrder(id: string) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items(*, products(name, sku, images)),
      profiles:profiles!orders_user_id_fkey(email, full_name, phone)
    `)
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

export async function updateOrderStatus(id: string, status: string) {
    const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error

    // Log operation
    logOperation({
        operationType: 'update',
        tableName: 'orders',
        operationDescription: `更新訂單狀態 ID: ${id} 為 ${status}`,
        // Ideally we fetch before values, but for performance we might skip or fetching them before update.
        // For now logging the update action is good.
        afterValues: { status, updated_at: new Date().toISOString() }
    })

    return data
}

export async function deleteOrder(id: string) {
    const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .select()

    if (error) throw error
    if (!data || data.length === 0) {
        throw new Error('刪除失敗：找不到訂單或無權限刪除 (0 rows affected)')
    }

    // Log operation
    logOperation({
        operationType: 'delete',
        tableName: 'orders',
        operationDescription: `刪除訂單 ID: ${id}`,
        beforeValues: data[0], // Assuming data is an array of deleted rows
        afterValues: null
    })

    return data
}

// ==================== Products ====================
export async function listProducts(params: {
    page?: number
    limit?: number
    category?: string
    status?: string
    search?: string
}) {
    let query = supabase
        .from('products')
        .select('*, product_categories(name)', { count: 'exact' })
        .order('created_at', { ascending: false })

    // 鐙€鎱嬬閬?
    if (params.status === 'active') {
        query = query.eq('is_active', true)
    } else if (params.status === 'inactive') {
        query = query.eq('is_active', false)
    }

    // 鍒嗛绡╅伕
    if (params.category && params.category !== 'all') {
        query = query.eq('category_id', params.category)
    }

    // 鎼滃皨
    if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`)
    }

    // 鍒嗛爜
    const page = params.page || 1
    const limit = params.limit || 20
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return { data, count }
}

export async function getProduct(id: number) {
    const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(name)')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

export async function createProduct(product: any) {
    const { data, error } = await supabase
        .from('products')
        .insert({
            ...product,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) throw error

    // Log operation
    logOperation({
        operationType: 'create',
        tableName: 'products',
        operationDescription: `建立新商品: ${product.name}`,
        afterValues: data
    })

    return data
}

export async function updateProduct(id: number, product: any) {
    const { data, error } = await supabase
        .from('products')
        .update({ ...product, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .eq('id', id)
        .select()
        .single()

    if (error) throw error

    // Log operation
    logOperation({
        operationType: 'update',
        tableName: 'products',
        operationDescription: `更新商品 ID: ${id}`,
        // We could fetch beforeValues here if we wanted to be precise
        afterValues: data
    })

    return data
}

// ==================== Users ====================
export async function listUsers(params: {
    page?: number
    limit?: number
    role?: string
    search?: string
}) {
    let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    // 瑙掕壊绡╅伕
    if (params.role && params.role !== 'all') {
        query = query.eq('role', params.role)
    }

    // 鎼滃皨
    if (params.search) {
        query = query.or(`full_name.ilike.%${params.search}%,phone.ilike.%${params.search}%`)
    }

    // 鍒嗛爜
    const page = params.page || 1
    const limit = params.limit || 20
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return { data, count }
}

export async function updateUserProfile(id: string, updates: any) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error

    // Log operation
    logOperation({
        operationType: 'update',
        tableName: 'profiles',
        operationDescription: `更新用戶資料 ID: ${id}`,
        afterValues: data
    })

    return data
}

export async function updateUserPassword(userId: string, newPassword: string) {
    // 獲取當前 session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
        throw new Error('未登入或登入已過期')
    }

    // 呼叫 Edge Function 來重設密碼
    const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId, newPassword },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    })

    if (error) {
        console.error('Error calling reset-user-password function:', error)
        throw new Error(error.message || '密碼重設失敗')
    }

    if (!data?.success) {
        throw new Error(data?.error || '密碼重設失敗')
    }

    return data
}

// ==================== Categories ====================
export async function listCategories() {
    const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name')

    if (error) throw error
    return data
}

// ==================== Image Upload ====================
export async function uploadProductImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `products/${fileName}`

    const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

    return publicUrl
}

export async function deleteProductImage(url: string) {
    // 寰?URL 鎻愬彇妾旀璺緫
    const urlParts = url.split('/product-images/')
    if (urlParts.length < 2) return

    const filePath = urlParts[1]

    const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath])

    if (error) throw error
}

export async function deleteProduct(id: number) {
    const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .select()
        .single()

    if (error) throw error

    // Log operation
    logOperation({
        operationType: 'delete',
        tableName: 'products',
        operationDescription: `刪除商品 ID: ${id}`,
        beforeValues: data,
        afterValues: null
    })

    return data
}

// ==================== Operation Logs ====================
export interface OperationLogParams {
    userId?: string
    userEmail?: string
    operationType: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'other'
    tableName?: string
    operationDescription: string
    beforeValues?: any
    afterValues?: any
    ipAddress?: string
    userAgent?: string
}

export async function logOperation(params: OperationLogParams) {
    try {
        // Try to get session if user info is missing
        if (!params.userId || !params.userEmail) {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                params.userId = params.userId || session.user.id
                params.userEmail = params.userEmail || session.user.email
            }
        }

        const { error } = await supabase
            .from('operation_logs')
            .insert({
                user_id: params.userId,
                user_email: params.userEmail,
                operation_type: params.operationType,
                table_name: params.tableName,
                operation_description: params.operationDescription,
                before_values: params.beforeValues,
                after_values: params.afterValues,
                ip_address: params.ipAddress,
                user_agent: params.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
            })

        if (error) console.error('Error logging operation:', error)
    } catch (err) {
        console.error('Error in logOperation:', err)
    }
}

export async function fetchOperationLogs(params: {
    page?: number
    limit?: number
    search?: string
    type?: string
    operator?: string
    startDate?: string
    endDate?: string
}) {
    let query = supabase.from('operation_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false })

    if (params.search) {
        query = query.or(`operation_description.ilike.%${params.search}%,user_email.ilike.%${params.search}%,table_name.ilike.%${params.search}%`)
    }
    if (params.type && params.type !== 'all') {
        query = query.eq('operation_type', params.type)
    }
    if (params.operator && params.operator !== 'all') {
        query = query.ilike('user_email', `%${params.operator}%`)
    }
    if (params.startDate) {
        query = query.gte('created_at', params.startDate)
    }
    if (params.endDate) {
        // Add 1 day to end date to include the full day if needed, or assume caller handles it.
        // Usually frontend sends YYYY-MM-DD.
        const end = new Date(params.endDate)
        end.setDate(end.getDate() + 1)
        query = query.lt('created_at', end.toISOString())
    }

    const page = params.page || 1
    const limit = params.limit || 20
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count, error } = await query
    if (error) throw error
    return { data, count }
}