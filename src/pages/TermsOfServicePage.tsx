import { Link } from 'react-router-dom'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-amber-900 font-bold text-2xl">金</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">金銀山有限公司</h1>
            <h2 className="text-2xl font-semibold text-gray-700">服務條款</h2>
          </div>

          <div className="prose prose-amber max-w-none">
            <p className="text-gray-600 mb-6">最後更新日期：2026年1月5日</p>

            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1. 協議接受</h3>
                <p className="text-gray-700 leading-relaxed">
                  歡迎使用金銀山有限公司（以下簡稱「金閃閃」、「我們」、「我們的」或「本網站」）。
                  通過訪問和使用我們的網站，您同意受本服務條款的約束。如果您不同意這些條款，
                  請不要使用我們的服務。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2. 服務說明</h3>
                <p className="text-gray-700 leading-relaxed">
                  金閃閃提供線上金飾珠寶購物平台，包括但不限於：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-3">
                  <li>金飾珠寶商品展示和銷售</li>
                  <li>線上訂單處理和付款</li>
                  <li>配送服務</li>
                  <li>客戶服務和售後支援</li>
                  <li>會員制度和積分獎勵</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">3. 帳戶註冊</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  使用我們的服務需要註冊帳戶。您同意：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>提供真實、準確、完整且最新的資訊</li>
                  <li>維護並及時更新您的帳戶資訊</li>
                  <li>對您的帳戶密碼負完全責任</li>
                  <li>通知我們任何未經授權的使用</li>
                  <li>不使用他人的帳戶</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">4. 訂單和付款</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  關於訂單和付款的條款：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>所有訂單均受庫存可用性限制</li>
                  <li>我們保留拒絕或取消任何訂單的權利</li>
                  <li>商品價格和可用性可能變更，恕不另行通知</li>
                  <li>付款處理遵循國際標準安全協議</li>
                  <li>退款和換貨政策詳見購物指南</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">5. 商品資訊</h3>
                <p className="text-gray-700 leading-relaxed">
                  我們努力提供準確的商品資訊，包括價格、描述、圖片等。
                  但我們不能保證所有資訊完全準確、完整或無誤。
                  如果發現錯誤，我們將盡快更正。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">6. 智慧財產權</h3>
                <p className="text-gray-700 leading-relaxed">
                  本網站的所有內容，包括但不限於文字、圖像、商標、標誌、設計、
                  軟體程式碼等，均為金閃閃或其授權方的智慧財產權，受到著作權法、商標法等法律保護。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7. 用戶行為</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  您同意不會：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>使用本網站進行任何非法活動</li>
                  <li>侵犯他人智慧財產權或隱私權</li>
                  <li>傳播病毒、惡意程式碼或破壞性程式碼</li>
                  <li>干擾網站正常運作</li>
                  <li>使用自動化程式獲取資料</li>
                  <li>散播垃圾郵件或不請自來的訊息</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">8. 配送和交貨</h3>
                <p className="text-gray-700 leading-relaxed">
                  我們將盡力在約定的時間內完成配送。配送時間可能因地區、天氣或其他不可抗力因素而延誤。
                  詳細配送資訊請參考配送政策。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">9. 退換貨政策</h3>
                <p className="text-gray-700 leading-relaxed">
                  我們提供7天無條件退換貨服務（從收到商品日期起算）。
                  退換貨商品必須保持原始包裝完整，未使用過的狀態。
                  詳細退換貨流程請參考退換貨政策。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">10. 責任限制</h3>
                <p className="text-gray-700 leading-relaxed">
                  在法律允許的最大範圍內，金閃閃不對因使用本網站而造成的任何直接或間接損失負責，
                  包括但不限於利潤損失、資料丟失或業務中斷。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">11. 隱私權</h3>
                <p className="text-gray-700 leading-relaxed">
                  您的隱私對我們很重要。我們的隱私權政策說明了我們如何收集、使用和保護您的個人資訊。
                  使用我們的服務即表示您同意我們的隱私權政策。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">12. 條款修改</h3>
                <p className="text-gray-700 leading-relaxed">
                  我們保留隨時修改本服務條款的權利。重大變更將通過電子郵件或網站公告通知您。
                  繼續使用服務即表示您接受修改後的條款。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">13. 終止</h3>
                <p className="text-gray-700 leading-relaxed">
                  我們保留因任何原因終止或暫停服務的權利，包括但不限於違反本服務條款。
                  終止後，您將無法訪問您的帳戶。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">14. 適用法律</h3>
                <p className="text-gray-700 leading-relaxed">
                  本服務條款受台灣法律管轄。任何爭議將依台灣法律解決。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">15. 聯絡資訊</h3>
                <p className="text-gray-700 leading-relaxed">
                  如果您對本服務條款有任何問題，請聯絡我們：
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <p><strong>金銀山有限公司</strong></p>
                  <p>電子郵件：legal@fanjin.com.tw</p>
                  <p>電話：+886-2-XXXX-XXXX</p>
                  <p>地址：台灣臺南市安南區海佃路2段108號</p>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                >
                  ← 返回首頁
                </Link>
                <Link 
                  to="/privacy-policy" 
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                >
                  查看隱私權政策
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}