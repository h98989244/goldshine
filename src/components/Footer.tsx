import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import { useI18n } from '../contexts/I18nContext'

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/images/logo.png" 
                alt="金銀山有限公司" 
                className="h-10 w-auto"
                onError={(e) => {
                  // 如果圖片載入失敗，使用備用LOGO
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    const fallback = document.createElement('div')
                    fallback.className = 'w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center'
                    fallback.innerHTML = '<span className="text-amber-900 font-bold text-lg">金</span>'
                    parent.insertBefore(fallback, target)
                  }
                }}
              />
              <span className="text-xl font-bold text-white">金銀山有限公司</span>
            </div>
            <p className="text-sm">傳承經典，璀璨人生。專營高品質黃金飾品，提供最優質的服務體驗。</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">快速連結</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-amber-400">{t('products')}</Link></li>
              <li><Link to="/stores" className="hover:text-amber-400">{t('stores')}</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-amber-400">隱私權政策</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-amber-400">服務條款</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">客戶服務</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="hover:text-amber-400">常見問題</Link></li>
              <li><Link to="/returns" className="hover:text-amber-400">退換貨政策</Link></li>
              <li><Link to="/warranty" className="hover:text-amber-400">保固服務</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('contact')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-amber-400" />
                <span>06-1234-5678</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-amber-400" />
                <span>service@fanjin.com.tw</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-amber-400 mt-1" />
                <span>臺南市安南區海佃路2段108號</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2026 金銀山有限公司 Fanjin Trading Co., Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
