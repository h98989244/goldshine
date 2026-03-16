import { Link } from 'react-router-dom'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-amber-900 font-bold text-2xl">金</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">金銀山有限公司</h1>
            <h2 className="text-2xl font-semibold text-gray-700">隱私權政策</h2>
          </div>

          <div className="prose prose-amber max-w-none">
            <p className="text-gray-600 mb-6">最後更新日期：2026年1月5日</p>

            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1. 概述</h3>
                <p className="text-gray-700 leading-relaxed">
                  金銀山有限公司（以下簡稱「金閃閃」、「我們」、「我們的」）重視您的隱私權。本隱私權政策說明了我們如何收集、使用、保護和分享您的個人資訊。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2. 我們收集的資訊</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  我們可能收集以下類型的資訊：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>個人識別資訊：</strong>姓名、電子郵件地址、電話號碼、地址</li>
                  <li><strong>帳戶資訊：</strong>用戶名、密碼（加密儲存）</li>
                  <li><strong>交易資訊：</strong>購買歷史、支付資訊、收件人資訊</li>
                  <li><strong>技術資訊：</strong>IP位址、瀏覽器類型、作業系統、裝置資訊</li>
                  <li><strong>使用資訊：</strong>網站使用情況、頁面訪問、點擊行為</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">3. 資訊使用目的</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  我們收集的資訊用於以下目的：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>提供和改善我們的服務</li>
                  <li>處理訂單和付款</li>
                  <li>客戶服務和支援</li>
                  <li>發送重要通知和更新</li>
                  <li>市場行銷和促銷活動（您可隨時選擇退出）</li>
                  <li>防止欺詐和確保網站安全</li>
                  <li>符合法律法規要求</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">4. 資訊分享</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  我們不會出售您的個人資訊。在以下情況下，我們可能分享您的資訊：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>服務提供者：</strong>與可信賴的合作夥伴分享必要資訊以提供服務</li>
                  <li><strong>法律要求：</strong>根據法律要求或法院命令</li>
                  <li><strong>保護權利：</strong>保護金閃閃和用戶的權利和安全</li>
                  <li><strong>業務轉讓：</strong>在合併或收購情況下</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">5. 資訊安全</h3>
                <p className="text-gray-700 leading-relaxed">
                  我們採用適當的技術和管理措施來保護您的個人資訊，包括：
                  SSL加密、資料庫加密、定期安全審計、以及員工隱私培訓。
                  然而，沒有任何網際網路傳輸或電子儲存方法是100%安全的。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">6. 您的權利</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  您擁有以下權利：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>查看我們持有的關於您的資訊</li>
                  <li>要求更正不準確的資訊</li>
                  <li>要求刪除您的個人資訊</li>
                  <li>要求限制資料處理</li>
                  <li>資料可攜權</li>
                  <li>反對處理</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7. Cookie 和追蹤技術</h3>
                <p className="text-gray-700 leading-relaxed">
                  我們使用Cookie和類似技術來改善您的瀏覽體驗。您可以通過瀏覽器設定管理Cookie偏好。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">8. 第三方連結</h3>
                <p className="text-gray-700 leading-relaxed">
                  我們的網站可能包含第三方網站的連結。我們不對這些第三方網站的隱私做法負責，
                  建議您閱讀他們的隱私政策。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">9. 政策更新</h3>
                <p className="text-gray-700 leading-relaxed">
                  我們可能不時更新本隱私權政策。重大變更將通過電子郵件或網站公告通知您。
                  建議您定期查看本政策。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">10. 聯絡資訊</h3>
                <p className="text-gray-700 leading-relaxed">
                  如果您對本隱私權政策有任何問題或意見，請聯絡我們：
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <p><strong>金銀山有限公司</strong></p>
                  <p>電子郵件：privacy@fanjin.com.tw</p>
                  <p>電話：+886-6-XXXX-XXXX</p>
                  <p>地址：台灣臺南市安南區海佃路2段108號</p>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
              >
                ← 返回首頁
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}