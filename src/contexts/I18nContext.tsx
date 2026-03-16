import React, { createContext, useContext, useState } from 'react'

type Language = 'zh-TW' | 'vi'

const translations = {
  'zh-TW': {
    home: '首頁',
    products: '商品',
    cart: '購物車',
    login: '登入',
    register: '註冊',
    logout: '登出',
    goldPrice: '今日金價',
    perGram: '/克',
    addToCart: '加入購物車',
    checkout: '結帳',
    total: '總計',
    weight: '重量',
    purity: '成色',
    laborCost: '工費',
    selectSize: '選擇尺寸',
    reservePickup: '預約取貨',
    selectStore: '選擇門市',
    selectDate: '選擇日期',
    selectTime: '選擇時段',
    confirm: '確認',
    cancel: '取消',
    myOrders: '我的訂單',
    orderStatus: '訂單狀態',
    pending: '待付款',
    reserved: '已預約',
    completed: '已完成',
    profile: '個人資料',
    referralCode: '推薦碼',
    commission: '佣金',
    stores: '門市據點',
    contact: '聯繫我們',
    currency: '幣別',
    language: '語言',
    search: '搜尋商品',
    noProducts: '沒有商品',
    emptyCart: '購物車是空的',
    continueShopping: '繼續購物',
    freeShipping: '免運費',
    securePayment: '安全付款',
    qualityGuarantee: '品質保證',
    customerService: '客戶服務',
  },
  vi: {
    home: 'Trang chu',
    products: 'San pham',
    cart: 'Gio hang',
    login: 'Dang nhap',
    register: 'Dang ky',
    logout: 'Dang xuat',
    goldPrice: 'Gia vang hom nay',
    perGram: '/gram',
    addToCart: 'Them vao gio',
    checkout: 'Thanh toan',
    total: 'Tong cong',
    weight: 'Trong luong',
    purity: 'Do tinh khiet',
    laborCost: 'Phi gia cong',
    selectSize: 'Chon kich thuoc',
    reservePickup: 'Dat lich nhan hang',
    selectStore: 'Chon cua hang',
    selectDate: 'Chon ngay',
    selectTime: 'Chon gio',
    confirm: 'Xac nhan',
    cancel: 'Huy',
    myOrders: 'Don hang cua toi',
    orderStatus: 'Trang thai don hang',
    pending: 'Cho thanh toan',
    reserved: 'Da dat truoc',
    completed: 'Hoan thanh',
    profile: 'Ho so ca nhan',
    referralCode: 'Ma gioi thieu',
    commission: 'Hoa hong',
    stores: 'Cua hang',
    contact: 'Lien he',
    currency: 'Tien te',
    language: 'Ngon ngu',
    search: 'Tim san pham',
    noProducts: 'Khong co san pham',
    emptyCart: 'Gio hang trong',
    continueShopping: 'Tiep tuc mua sam',
    freeShipping: 'Mien phi van chuyen',
    securePayment: 'Thanh toan an toan',
    qualityGuarantee: 'Dam bao chat luong',
    customerService: 'Dich vu khach hang',
  }
}

type I18nContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations['zh-TW']) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh-TW')

  const t = (key: keyof typeof translations['zh-TW']) => {
    return translations[language][key] || key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}
