// src/pages/PrivacyPage.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PrivacyPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          const y = element.getBoundingClientRect().top + window.scrollY - 120;
          window.scrollTo({ top: y, behavior: "smooth" });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-30 text-left">
      <h1 className="text-5xl font-bold mb-8 text-left">Chính sách quyền riêng tư</h1>

      <section id="introduction" className="mb-10">
        <h2 className="text-3xl font-semibold mb-4 text-left">1. Giới thiệu</h2>
        <pre className="text-2xl text-black whitespace-pre-wrap text-left">
{`LUNALE cam kết tôn trọng và bảo vệ quyền riêng tư của khách hàng.
Trang này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.`}
        </pre>
      </section>

      <section id="collect" className="mb-10">
        <h2 className="text-3xl font-semibold mb-4 text-left">2. Thông tin chúng tôi thu thập</h2>
        <pre className="text-2xl text-black whitespace-pre-wrap text-left">
{`Chúng tôi có thể thu thập các loại thông tin sau:
• Họ tên, địa chỉ, số điện thoại, email của bạn khi đặt hàng.
• Thông tin thanh toán và giao hàng.
• Dữ liệu hành vi như trang bạn truy cập, thời gian tương tác, thiết bị và trình duyệt.`}
        </pre>
      </section>

      <section id="usage" className="mb-10">
        <h2 className="text-3xl font-semibold mb-4 text-left">3. Cách chúng tôi sử dụng thông tin</h2>
        <pre className="text-2xl text-black whitespace-pre-wrap text-left">
{`Thông tin của bạn được sử dụng cho các mục đích sau:
• Xử lý và giao đơn hàng.
• Gửi thông báo, khuyến mãi hoặc hỗ trợ khách hàng.
• Cải thiện trải nghiệm mua sắm và tối ưu dịch vụ của chúng tôi.`}
        </pre>
      </section>

      <section id="protection" className="mb-10">
        <h2 className="text-3xl font-semibold mb-4 text-left">4. Bảo mật dữ liệu</h2>
        <pre className="text-2xl text-black whitespace-pre-wrap text-left">
{`LUNALE áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để đảm bảo an toàn thông tin cá nhân.
• Dữ liệu được lưu trữ trong môi trường bảo mật.
• Truy cập vào dữ liệu bị giới hạn cho nhân sự có thẩm quyền.`}
        </pre>
      </section>

      <section id="rights">
        <h2 className="text-3xl font-semibold mb-4 text-left">5. Quyền của người dùng</h2>
        <pre className="text-2xl text-black whitespace-pre-wrap text-left">
{`Bạn có quyền:
• Yêu cầu xem, sửa hoặc xóa thông tin cá nhân của mình.
• Rút lại sự đồng ý về việc sử dụng dữ liệu bất cứ lúc nào bằng cách liên hệ với chúng tôi qua email: support@lunale.vn.`}
        </pre>
      </section>
    </div>
  );
};

export default PrivacyPage;
