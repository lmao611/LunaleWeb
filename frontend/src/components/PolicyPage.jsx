import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PolicyPage = () => {
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
      <h1 className="text-5xl font-bold mb-8 text-left">Chính sách của chúng tôi</h1>

      <section id="exchange" className="mb-10">
        <h2 className="text-3xl font-semibold mb-4 text-left">1. Chính sách đổi hàng</h2>
        <div className="text-2xl text-black whitespace-pre-wrap *:text-left">
          <div className="font-bold text-lg text-black mb-2">ĐIỀU KIỆN ĐỔI HÀNG</div>
          <pre className="whitespace-pre-wrap">
{`• Chỉ hỗ trợ đổi hàng – không hỗ trợ trả hàng hoàn tiền với bất kỳ lý do gì.
• Khách hàng phải cung cấp đầy đủ video/hình ảnh quay chụp khi khui mở kiện hàng, cùng với biên nhận mua hàng.
• Sản phẩm vẫn giữ nguyên trạng thái ban đầu bao gồm cả tem mác thương hiệu và phụ kiện đi kèm nếu có, không bị chỉnh sửa, không bị bẩn hoặc bị tác động bởi hóa chất, không được giặt ủi, không có mùi lạ và không có dấu hiệu đã sử dụng.
• Trong trường hợp đổi, phí vận chuyển ban đầu sẽ không được hoàn lại.
• Với các sản phẩm được đặt hàng trên các sàn thương mại điện tử (Shopee, Lazada, Tiktok) Lunale sẽ tuân thủ chính sách đổi hàng hàng của sàn.`}
          </pre>

          <div className="font-bold text-lg text-black mt-6 mb-2">CÁC TRƯỜNG HỢP ĐỔI HÀNG</div>
          <pre className="whitespace-pre-wrap">
{`Lunale cam kết đổi hàng miễn phí:
• Nếu sản phẩm bị lỗi kỹ thuật từ phía nhà sản xuất.
• Nếu Lunale giao không đúng mẫu mã hoặc không đủ số lượng như trong đơn đặt hàng.`}
          </pre>

          <div className="font-bold text-lg text-black mt-6 mb-2">ĐỔI SIZE</div>
          <pre className="whitespace-pre-wrap">
{`• Sản phẩm cần đổi phải còn đủ số lượng để giao.
• Khách hàng tự thanh toán phí vận chuyển 2 chiều và chi phí phát sinh nếu có.`}
          </pre>

          <div className="font-bold text-lg text-black mt-6 mb-2">ĐỔI SẢN PHẨM KHÁC</div>
          <pre className="whitespace-pre-wrap">
{`• Trong trường hợp sản phẩm đổi có giá trị cao hơn, khách hàng cần bù phần chênh lệch.
• Trong trường hợp sản phẩm đổi có giá trị thấp hơn, Lunale sẽ hoàn trả phần chênh lệch.
• Khách hàng tự thanh toán phí vận chuyển 2 chiều và chi phí phát sinh nếu có.`}
          </pre>

          <div className="font-bold text-lg text-black mt-6 mb-2">KHÔNG ĐỦ ĐIỀU KIỆN ĐỔI</div>
          <pre className="whitespace-pre-wrap">
{`• Trường hợp sản phẩm bị cắt tag hay bị hỏng do sử dụng không đúng cách sẽ không được Lunale chấp nhận đổi hàng.
• Quá 48 giờ kể từ khi khách nhận hàng, nếu LSoul không nhận được phản hồi về tình trạng của sản phẩm, Lunale sẽ coi như sản phẩm đã được chấp nhận.
• Sản phẩm thuộc các chương trình khuyến mãi, giảm giá mà không có lỗi từ nhà sản xuất sẽ không được Lunale chấp nhận đổi hàng.
• Lunale có quyền từ chối mọi yêu cầu đổi hàng nếu khách hàng không tuân thủ theo các quy định về chính sách đổi hàng của Lunale.`}
          </pre>

          <div className="font-bold text-lg text-black mt-6 mb-2">THỜI GIAN ĐỔI HÀNG</div>
          <pre className="whitespace-pre-wrap">
{`• Khách hàng cần gửi sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng. Sau thời hạn này, Lunale có quyền từ chối mọi yêu cầu đổi hàng từ phía khách hàng.
• Khách hàng có thể đến trực tiếp cửa hàng của Lunale để đổi hàng sản phẩm hoặc sử dụng dịch vụ chuyển phát nhanh.`}
          </pre>

          <div className="font-bold text-red-500 mt-6">
            *XIN LƯU Ý: LUNALE CHỈ HỖ TRỢ ĐỔI HÀNG. KHÔNG HỖ TRỢ HOÀN HÀNG VÀ HOÀN TIỀN DƯỚI MỌI HÌNH THỨC.
          </div>
        </div>
      </section>

      {/* Các phần còn lại giữ nguyên như bạn đã viết */}
      <section id="inspection" className="mb-10">
        <h2 className="text-3xl font-semibold mb-2 text-left">2. Chính sách kiểm hàng</h2>
        <pre className="whitespace-pre-wrap text-2xl text-black text-left">
{`Sau khi nhận hàng và thanh toán, Khách hàng vui lòng kiểm hàng bằng cách quay video mở gói hàng, kiểm tra số lượng, mẫu mã theo như đơn đặt hàng đã đặt.
Trong trường hợp có bất cứ sai sót liên quan đến số lượng và mẫu mã không trùng khớp với đơn hàng, vui lòng liên hệ với chúng tôi qua số điện thoại 0932341355.

Lưu ý:
• Trong quá trình kiểm tra đơn hàng, Khách hàng vui lòng không thử và cắt tem mác đính trên sản phẩm.
• Quý Khách tránh dùng vật sắc nhọn để mở gói hàng để tránh gây hư hỏng cho sản phẩm bên trong. Đối với những trường hợp sản phẩm bị hư hỏng do lỗi từ phía Khách hàng, LUNALE Store rất tiếc không thể hỗ trợ Khách hàng đổi/trả sản phẩm.`}
        </pre>
      </section>

      <section id="payment" className="mb-10">
        <h2 className="text-3xl font-semibold mb-2 text-left">3. Chính sách thanh toán</h2>
        <pre className="whitespace-pre-wrap text-2xl text-black text-left">
{`Nhằm mang đến cho Quý khách những trải nghiệm mua sắm trực tuyến tuyệt vời 
nhất, LUNAE Store đưa ra 2 phương thức thanh toán để Quý khách dễ dàng lựa chọn.

1/ Thanh toán trực tuyến
1.1. Khách hàng chuyển khoản vào thông tin số tài khoản:

1.2. Khách quét mã QR đễ thanh toán:
=> Quét mã để thanh toán

Sau khi chuyển khoản thành công, LUNALE Store sẽ liên hệ xác nhận đến Quý khách hàng và tiến hành giao hàng. Trường hợp Khách hàng có thắc mắc, vui lòng liên hệ: 093234135
 
2/ Thanh toán khi nhận hàng
Trường hợp Khách hàng muốn giao hàng và thanh toán tại nhà, nhân viên giao hàng của các đơn vị vận chuyển sẽ trực tiếp thu tiền ngay khi giao sản phẩm.`}
        </pre>
      </section>

      <section id="shipping">
        <h2 className="text-3xl font-semibold mb-2 text-left">4. Chính sách vận chuyển</h2>
        <pre className="text-2xl text-black whitespace-pre-wrap text-left">
{`1. PHƯƠNG THỨC GIAO HÀNG
Chúng tôi sử dụng 02 phương thức giao hàng:
• Mua Online tại các sàn Fanpage / Soppee / Tiktok…
• Giao hàng tận nhà – Thanh toán khi nhận hàng (COD)
2. THỜI GIAN GIAO HÀNG
Thời hạn ước tính cho việc giao hàng: Thông thường sau khi nhận được thông tin đặt hàng chúng tôi sẽ xử lý đơn hàng trong vòng 24h và phản hồi lại thông tin cho khách hàng về việc thanh toán và giao nhận.
• Nội thành: từ 1-2 ngày
• Ngoài thành và các tỉnh khác: 3-5 ngày kể từ ngày chốt đơn hoặc theo thỏa thuận với khách khi đặt hàng
Tuy nhiên, cũng có trường hợp việc giao hàng kéo dài hơn nhưng chỉ xảy ra trong những tình huống bất khả kháng như sau:
• Không thể liên lạc với khách hàng qua điện thoại.
• Địa chỉ giao hàng không chính xác.
• Số lượng đơn hàng tăng đột biến khiến việc xử lý đơn hàng bị chậm.
• Đối tác cung cấp hàng chậm hơn dự kiến khiến việc giao hàng bị chậm lại hoặc đối tác vận chuyển giao hàng bị chậm
Lưu ý: Trường hợp phát sinh chậm trễ trong việc giao hàng chúng tôi sẽ thông tin kịp thời cho khách hàng và khách hàng có thể lựa chọn giữa việc Hủy hoặc tiếp tục chờ hàng.


Lưu ý: Trường hợp phát sinh chậm trễ trong việc giao hàng chúng tôi sẽ thông tin kịp thời cho khách hàng và khách hàng có thể lựa chọn giữa việc Hủy hoặc tiếp tục chờ hàng.

3. PHÍ VẬN CHUYỂN
Về phí vận chuyển, chúng tôi sử dụng dịch vụ vận chuyển ngoài nên cước phí vận chuyển sẽ được tính theo phí của các đơn vị vận chuyển tùy vào vị trí và khối lượng của đơn hàng.

PHÂN ĐỊNH TRÁCH NHIỆM CỦA THƯƠNG NHÂN, TỔ CHỨC CUNG ỨNG DỊCH VỤ LOGISTICS VỀ CUNG CẤP CHỨNG TỪ HÀNG HÓA TRONG QUÁ TRÌNH GIAO NHẬN.

NGHĨA VỤ CỦA BÊN VẬN CHUYỂN
• Bảo đảm vận chuyển hàng hóa đầy đủ, an toàn đến địa điểm đã định, theo đúng thời hạn.
• Giao hàng hóa cho người có quyền nhận.
• Chịu chi phí liên quan đến việc chuyên chở hàng hóa, trừ trường hợp có thỏa thuận khác.
• Bồi thường thiệt hại cho bên thuê vận chuyển trong trường hợp bên vận chuyển để mất, hư hỏng hàng hóa, trừ trường hợp có thỏa thuận khác hoặc pháp luật có quy định khác.

QUYỀN CỦA BÊN VẬN CHUYỂN
• Kiểm tra sự xác thực của hàng hóa, của vận đơn hoặc chứng từ vận chuyển tương đương khác.
• Từ chối vận chuyển hàng hóa không đúng với loại hàng hóa đã thỏa thuận trong hợp đồng.
• Yêu cầu bên thuê vận chuyển thanh toán đủ cước phí vận chuyển đúng thời hạn.
• Từ chối vận chuyển hàng hóa cấm giao dịch, hàng hóa có tính chất nguy hiểm, độc hại, nếu bên vận chuyển không có biện pháp đảm bảo an toàn.

NGHĨA VỤ CỦA BÊN THUÊ VẬN CHUYỂN
• Tất cả các đơn hàng đều được đóng gói sẵn sàng trước khi vận chuyển, được niêm phong bởi LUNALE.
• Cung cấp thông tin cần thiết liên quan đến hàng hóa vận chuyển để bảo đảm an toàn cho hàng hóa vận chuyển.
• Trả đủ tiền cước phí vận chuyển cho bên vận chuyển theo đúng thời hạn, phương thức đã thỏa thuận.
• Trông coi hàng hóa trên đường vận chuyển, nếu có thỏa thuận. Trường hợp bên thuê vận chuyển trông coi hàng hóa mà hàng hóa bị mất, hư hỏng thì không được bồi thường.

QUYỀN CỦA BÊN THUÊ VẬN CHUYỂN
• Yêu cầu bên vận chuyển chuyên chở hàng hóa đến đúng địa điểm, thời điểm đã thỏa thuận.
• Trực tiếp hoặc chỉ định người thứ ba nhận lại hàng hóa đã thuê vận chuyển.

TRÁCH NHIỆM BỒI THƯỜNG THIỆT HẠI

TRÁCH NHIỆM CỦA ĐƠN VỊ VẬN CHUYỂN:
• Đơn vị vận chuyển sẽ chỉ chịu trách nhiệm vận chuyển hàng hóa theo nguyên tắc: Nguyên đai, nguyên kiện giao từ LUNALE tới tay khách hàng.
• Trường hợp bất khả kháng dẫn đến hàng hóa vận chuyển bị mất, hư hỏng hoặc bị hủy hoại trong quá trình vận chuyển thì bên vận chuyển không phải chịu trách nhiệm bồi thường thiệt hại, trừ trường hợp có thỏa thuận khác hoặc pháp luật có quy định khác.
• Khách hàng có quyền từ chối nhận sản phẩm và yêu cầu đổi trả theo quy định “đổi trả hoàn phí”. Mọi vấn đề phát sinh chúng tôi sẽ làm việc lại với đối tác vận chuyển để giải quyết đền bù cho đơn hàng theo thỏa thuận hợp tác giữa công ty với đối tác thứ 3 cung cấp dịch vụ vận chuyển.

TRÁCH NHIỆM CỦA BÊN THUÊ VẬN CHUYỂN:
• LUNALE có gửi cung cấp chứng từ hàng hóa trong kiện hàng cho đơn vị vận chuyển, nhân viên giao hàng sẽ giao đến khách hàng trong quá trình giao nhận hàng hóa. Nếu như không thấy hoặc cần thêm các chứng từ khác vui lòng liên hệ LUNALE để được cung cấp các chứng từ cần thiết.
• Đối với hàng hóa bị hư hỏng do quá trình vận chuyển dù là đơn hàng do chính cửa hàng vận chuyển hay do bên thứ 3 vận chuyển thì chúng tôi sẽ là bên đứng ra chịu trách nhiệm giải quyết vấn đề cho khách hàng.
• Bên thuê vận chuyển phải bồi thường thiệt hại cho bên vận chuyển và người thứ ba về thiệt hại do hàng hóa vận chuyển có tính chất nguy hiểm, độc hại mà không có biện pháp đóng gói, bảo đảm an toàn trong quá trình vận chuyển.`}
        </pre>
      </section>
    </div>
  );
};

export default PolicyPage;
