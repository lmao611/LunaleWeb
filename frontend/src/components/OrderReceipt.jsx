import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Trash2, ImageDown, ChevronDown } from "lucide-react";
import domtoimage from "dom-to-image-more";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";

const OrderReceipt = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    address: "",
    phone: "",
    terms: "",
    deliverDate: "",
    receivedDate: "",
    salePercent: 0,
    shipFee: 25000,
    items: [],
  });

  const { checkingAuth } = useUserStore();
  const receiptRef = useRef(null);
  const printRef = useRef(null);
  
  // ✅ Biến kiểm tra xem đang dùng thiết bị gì để điều chỉnh logo khi in
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!checkingAuth) {
      const fetchData = async () => {
        try {
          const [custRes, prodRes] = await Promise.all([
            axios.get("/auth/users"), 
            axios.get("/products"),
          ]);

          const loadedCustomers = Array.isArray(custRes.data) ? custRes.data : (custRes.data.users || []);
          setCustomers(loadedCustomers);

          const loadedProducts = prodRes.data.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
          setProducts(loadedProducts);

        } catch (err) {
          console.error(err);
        }
      };
      fetchData();
    }
  }, [checkingAuth]);

  const handleCustomerSelect = (id) => {
    if (!id) {
      setForm((f) => ({ ...f, customerId: "", customerName: "", address: "", phone: "" }));
      return;
    }
    const c = customers.find((x) => String(x._id || x.id) === String(id));
    setForm((f) => ({
      ...f,
      customerId: id,
      customerName: c?.name || f.customerName,
      address: c?.direction || c?.address || f.address,
      phone: c?.phoneNumber || c?.phone || f.phone,
    }));
  };

  const addProduct = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: "", quantity: 1, size: "", sale: 0 }],
    }));

  const removeProduct = (index) =>
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));

  const calcSubtotal = (item) => {
    const product = products.find((p) => String(p._id || p.id) === String(item.productId));
    if (!product) return 0;
    const discount = ((product.price * (item.sale || 0)) / 100) * (item.quantity || 1);
    return product.price * (item.quantity || 1) - discount;
  };

  const calcTotal = () => {
    const subtotal = form.items.reduce((acc, it) => acc + calcSubtotal(it), 0);
    const discount = (subtotal * (form.salePercent || 0)) / 100;
    return subtotal - discount;
  };

  const totalWithShip = calcTotal() + (form.shipFee || 0);

  const handleExportImage = async () => {
    if (!printRef.current) return;

    try {
      const el = printRef.current;
      
      // Hiển thị phần in để chụp
      el.style.display = "block";
      el.style.opacity = "1";
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "0";
      el.style.zIndex = "9999"; 
      el.style.backgroundColor = "#ffffff";

      // Chờ render (để đảm bảo layout đã cập nhật trước khi chụp)
      await new Promise((r) => setTimeout(r, 500)); 

      const dataUrl = await domtoimage.toPng(el, {
        quality: 1,
        bgcolor: "#ffffff",
        cacheBust: true,
        width: el.scrollWidth,  // ✅ Tự động lấy chiều rộng thực tế
        height: el.scrollHeight // ✅ Tự động lấy chiều cao thực tế (kéo dài theo sản phẩm)
      });

      // Ẩn lại sau khi chụp
      el.style.display = "none";
      el.style.opacity = "0";
      el.style.zIndex = "-1";

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Don_hang_${form.customerName || "khach"}_${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Không thể xuất ảnh, vui lòng thử lại.");
    }
  };

  const selectClass = "w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 outline-none appearance-none relative z-10";

  // --- COMPONENT NỘI DUNG PHIẾU (Dùng chung cho Preview và In) ---
  const ReceiptContent = () => (
    <div className="w-[1000px] bg-white text-gray-900 font-sans p-10 mx-auto">
        {/* HEADER */}
        {/* ✅ LOGIC LOGO: Nếu là Mobile (isMobile=true) thì Logo nằm bên phải và to hơn */}
        <div className={`flex items-center justify-between mb-8 border-b pb-6 border-gray-200 ${isMobile ? 'flex-row' : 'flex-row'}`}>
            {isMobile ? (
                // Giao diện Mobile: Text Trái - Logo Phải
                <>
                    <div className="text-left flex-1">
                        <h2 className="text-4xl font-bold text-blue-800 uppercase tracking-widest mb-1">
                            PHIẾU ĐẶT HÀNG
                        </h2>
                        <p className="text-gray-500 text-lg italic">Cảm ơn bạn đã lựa chọn Lunale</p>
                    </div>
                    {/* Logo to hơn trên mobile */}
                    <img src="/lunale.png" alt="Logo" className="h-24 object-contain ml-4" />
                </>
            ) : (
                // Giao diện Desktop (Mặc định): Logo Trái - Text Phải
                <>
                    <img src="/lunale.png" alt="Logo" className="h-16 object-contain" />
                    <div className="text-right flex-1">
                        <h2 className="text-3xl font-bold text-blue-700 uppercase tracking-widest mb-1">
                            PHIẾU ĐẶT HÀNG
                        </h2>
                        <p className="text-gray-500 italic">Cảm ơn bạn đã lựa chọn Lunale</p>
                    </div>
                </>
            )}
        </div>

        {/* THÔNG TIN KHÁCH HÀNG */}
        <div className="grid grid-cols-2 gap-8 text-lg mb-8">
          <div className="space-y-2">
            <p><strong className="text-gray-600 inline-block w-24">Khách hàng:</strong> {form.customerName}</p>
            <p><strong className="text-gray-600 inline-block w-24">Địa chỉ:</strong> {form.address}</p>
            <p><strong className="text-gray-600 inline-block w-24">Điện thoại:</strong> {form.phone}</p>
          </div>
          <div className="space-y-2">
            <p><strong className="text-gray-600 inline-block w-24">Ngày giao:</strong> {form.deliverDate}</p>
            <p><strong className="text-gray-600 inline-block w-24">Ngày đến:</strong> {form.receivedDate}</p>
            <p><strong className="text-gray-600 inline-block w-24">Điều khoản:</strong> {form.terms}</p>
          </div>
        </div>

        {/* BẢNG SẢN PHẨM */}
        <table className="w-full border-collapse text-lg mb-8">
          <thead>
            <tr className="bg-blue-50 border-b-2 border-blue-200 text-blue-900">
              <th className="p-3 text-left border-r border-blue-200">Sản phẩm</th>
              <th className="p-3 border-r border-blue-200 text-center w-24">Size</th>
              <th className="p-3 border-r border-blue-200 text-center w-24">SL</th>
              <th className="p-3 border-r border-blue-200 text-center text-red-600 w-28">Sale (%)</th>
              <th className="p-3 border-r border-blue-200 text-right w-40">Đơn giá</th>
              <th className="p-3 text-right w-48">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((item, i) => {
              const p = products.find((x) => String(x._id || x.id) === String(item.productId));
              return (
                <tr key={i} className="border-b border-gray-200 text-gray-800">
                  <td className="p-3 border-r border-gray-200 font-medium">{p?.name || "-"}</td>
                  <td className="p-3 border-r border-gray-200 text-center">{item.size || "-"}</td>
                  <td className="p-3 border-r border-gray-200 text-center">{item.quantity}</td>
                  <td className="p-3 border-r border-gray-200 text-center text-red-600 font-bold">{item.sale || 0}</td>
                  <td className="p-3 border-r border-gray-200 text-right text-gray-600">
                    {p ? p.price.toLocaleString() : "-"}
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900">
                    {calcSubtotal(item).toLocaleString()}
                  </td>
                </tr>
              );
            })}
            {/* Dòng trống để phiếu đẹp hơn nếu ít SP */}
            {form.items.length < 5 && Array.from({length: 5 - form.items.length}).map((_, idx) => (
                <tr key={`empty-${idx}`} className="h-14 border-b border-gray-100">
                    <td className="border-r border-gray-100"></td>
                    <td className="border-r border-gray-100"></td>
                    <td className="border-r border-gray-100"></td>
                    <td className="border-r border-gray-100"></td>
                    <td className="border-r border-gray-100"></td>
                    <td></td>
                </tr>
            ))}
          </tbody>
        </table>

        {/* TỔNG TIỀN */}
        <div className="ml-auto w-[400px] text-lg space-y-3 border-t-2 border-gray-200 pt-4">
          <div className="flex justify-between items-center text-gray-600">
            <span>Thành tiền:</span>
            <span className="font-semibold">{calcTotal().toLocaleString()}₫</span>
          </div>

          <div className="flex justify-between items-center text-gray-600">
            <span>Phí ship:</span>
            <span className="font-semibold">{form.shipFee.toLocaleString()}₫</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-300 mt-2">
            <span className="font-bold text-2xl text-blue-900">TỔNG CỘNG:</span>
            <span className="font-bold text-3xl text-red-600">
              {totalWithShip.toLocaleString()}₫
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 text-center text-gray-400 text-base italic">
            --- Cảm ơn quý khách đã tin tưởng và ủng hộ ---
        </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white border border-gray-200 shadow-md rounded-2xl p-4 sm:p-8 max-w-4xl mx-auto"
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExportImage}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg font-bold"
        >
          <ImageDown className="w-5 h-5" />
          <span>Xuất Ảnh Phiếu</span>
        </button>
      </div>

      {/* --- PHẦN NHẬP LIỆU (Giữ nguyên như file cũ) --- */}
      <div ref={receiptRef}>
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700 uppercase tracking-wide">
          Nhập Thông Tin Đơn Hàng
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <label className="block text-sm mb-1 font-medium text-gray-700">Khách hàng</label>
            <div className="relative">
              <select
                value={form.customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className={selectClass}
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name} {c.phoneNumber ? `(${c.phoneNumber})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <input
              type="text"
              placeholder="Hoặc nhập tên khách hàng"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Điều khoản</label>
            <input type="text" placeholder="Nhập điều khoản..." value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Ngày giao</label>
            <input type="text" placeholder="dd/mm/yyyy" onChange={(e) => setForm((f) => ({ ...f, deliverDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Ngày đến</label>
            <input type="text" placeholder="dd/mm/yyyy" onChange={(e) => setForm((f) => ({ ...f, receivedDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Địa chỉ</label>
            <input type="text" placeholder="Nhập địa chỉ" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Điện thoại</label>
            <input type="text" placeholder="Nhập số điện thoại" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg text-blue-700">Sản phẩm</h3>
            <button onClick={addProduct} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
              <PlusCircle className="w-5 h-5" /> Thêm SP
            </button>
          </div>

          {form.items.length === 0 && <p className="text-gray-500 italic text-center py-4 border border-dashed rounded-lg bg-gray-50">Chưa có sản phẩm nào.</p>}

          <div className="hidden sm:grid sm:grid-cols-7 gap-3 text-sm font-semibold text-gray-600 mb-2 px-1">
            <span>Tên sản phẩm</span> <span>Size</span> <span>SL</span> <span className="text-red-600">Sale (%)</span> <span className="text-right">Giá gốc</span> <span className="text-right">Thành tiền</span> <span className="text-center">Xóa</span>
          </div>

          <div className="space-y-4 sm:space-y-2">
            {form.items.map((item, i) => {
              const product = products.find((p) => String(p._id || p.id) === String(item.productId));
              const basePrice = product ? product.price * (item.quantity || 1) : 0;
              const salePrice = calcSubtotal(item);
              return (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-7 gap-3 border rounded-lg p-3 items-center bg-gray-50 sm:bg-white shadow-sm sm:shadow-none">
                  <div className="relative">
                    <label className="sm:hidden text-xs text-gray-500 mb-1 block">Sản phẩm</label>
                    <select value={item.productId} onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].productId = e.target.value; return { ...f, items: newItems }; })} className={`${selectClass} py-1 text-sm`}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((p) => (<option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>))}
                    </select>
                    <ChevronDown className="absolute right-2 bottom-2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <label className="sm:hidden text-xs text-gray-500 mb-1 block">Size</label>
                    <select value={item.size} onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].size = e.target.value; return { ...f, items: newItems }; })} className={`${selectClass} py-1 text-sm`}>
                      <option value="">Size</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option>
                    </select>
                    <ChevronDown className="absolute right-2 bottom-2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  <div><label className="sm:hidden text-xs text-gray-500 mb-1 block">SL</label><input type="number" min="1" value={item.quantity} onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].quantity = Number(e.target.value); return { ...f, items: newItems }; })} className="w-full border border-gray-300 rounded px-2 py-1 text-center text-base" /></div>
                  <div><label className="sm:hidden text-xs text-gray-500 mb-1 block">Sale (%)</label><input type="number" min="0" max="100" value={item.sale} onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].sale = Number(e.target.value); return { ...f, items: newItems }; })} className="w-full border border-gray-300 rounded px-2 py-1 text-center text-red-600 font-medium text-base" /></div>
                  <div className="flex justify-between sm:block text-right"><span className="sm:hidden text-sm text-gray-500">Giá gốc:</span><span className="text-gray-600">{basePrice.toLocaleString()}₫</span></div>
                  <div className="flex justify-between sm:block text-right"><span className="sm:hidden text-sm text-gray-500">Thành tiền:</span><span className="font-bold text-blue-700">{salePrice.toLocaleString()}₫</span></div>
                  <div className="flex justify-center sm:justify-center mt-2 sm:mt-0"><button onClick={() => removeProduct(i)} className="bg-red-100 hover:bg-red-200 p-2 rounded-full text-red-600 transition"><Trash2 className="w-4 h-4" /></button></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-8 relative mt-6 border-t border-gray-100">
          <div className="w-full sm:w-40 mt-4 sm:mt-0">
            <label className="block text-sm mb-1 font-medium text-gray-700">Phí ship (₫)</label>
            <input type="number" value={form.shipFee} onChange={(e) => setForm((f) => ({ ...f, shipFee: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
      </div>

      {/* --- PHẦN ẨN ĐỂ IN (Dùng chung component ReceiptContent) --- */}
      <div id="print-area" ref={printRef} className="hidden">
        <ReceiptContent />
      </div>

      <h1 className="text-blue-700 text-center pt-7 font-bold pb-4 text-xl">XEM TRƯỚC (PREVIEW)</h1>
      <p className="text-center text-gray-500 text-sm mb-4">(Bố cục dưới đây mô phỏng phiếu khi xuất ra)</p>

      <div className="flex justify-center border-4 border-blue-600 rounded-xl overflow-hidden w-full overflow-x-auto bg-gray-100 p-4">
        {/* Scale nhỏ lại để xem trước, nhưng giữ nguyên cấu trúc */}
        <div className="origin-top scale-50 sm:scale-75 md:scale-90 shadow-2xl">
          <ReceiptContent />
        </div>
      </div>
    </motion.div>
  );
};

export default OrderReceipt;