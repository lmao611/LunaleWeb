import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Trash2, ImageDown, ChevronDown } from "lucide-react";
import html2canvas from "html2canvas";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";

const OrderReceipt = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [logoBase64, setLogoBase64] = useState(""); // State lưu ảnh logo base64

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

  // 1. Pre-load Logo sang Base64 để tránh lỗi mất ảnh trên iOS
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch("/lunale.png");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Lỗi load logo:", e);
        setLogoBase64("/lunale.png");
      }
    };
    loadLogo();
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
      setForm((f) => ({
        ...f,
        customerId: "",
        customerName: "",
        address: "",
        phone: "",
      }));
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

  // =========================================================
  // HÀM XUẤT ẢNH (HTML2CANVAS)
  // =========================================================
  const handleExportImage = async () => {
    if (!printRef.current) return;
    
    const el = printRef.current;
    const originalStyle = { ...el.style };

    try {
      // Setup style để chụp ảnh
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "0";
      el.style.zIndex = "99999";
      el.style.opacity = "1";
      el.style.pointerEvents = "none";
      el.style.backgroundColor = "white";

      // Chờ render layout mới
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(el, {
        scale: 4, // Độ phân giải cao gấp 4 lần
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight
      });

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `phieu_dat_hang_${Date.now()}.png`;
      link.click();

    } catch (err) {
      console.error("Lỗi xuất ảnh:", err);
      alert("Có lỗi khi tạo ảnh. Vui lòng thử lại.");
    } finally {
      // Reset style về như cũ
      Object.assign(el.style, originalStyle);
    }
  };

  const selectClass = "w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 outline-none appearance-none relative z-10";

  // Component Bảng (Dùng cho phần in ấn và Preview)
  const ReceiptTablePrint = () => (
    <table className="w-full border-collapse mb-8">
      <thead>
        <tr className="bg-blue-50 border-b-2 border-blue-900">
          <th className="p-3 text-left border border-gray-300 text-blue-900 w-[40%] font-bold">Sản phẩm</th>
          <th className="p-3 border border-gray-300 text-center text-blue-900 w-[8%] font-bold">Size</th>
          <th className="p-3 border border-gray-300 text-center text-blue-900 w-[8%] font-bold">SL</th>
          <th className="p-3 border border-gray-300 text-center text-red-600 w-[8%] font-bold">Sale</th>
          <th className="p-3 border border-gray-300 text-right text-blue-900 w-[18%] font-bold">Đơn giá</th>
          <th className="p-3 border border-gray-300 text-right text-blue-900 w-[18%] font-bold">Thành tiền</th>
        </tr>
      </thead>
      <tbody className="text-xl text-gray-800">
        {form.items.map((item, i) => {
          const p = products.find((x) => String(x._id || x.id) === String(item.productId));
          return (
            <tr key={i} className="border-b border-gray-200">
              <td className="p-3 border border-gray-300 font-medium">{p?.name || "-"}</td>
              <td className="p-3 border border-gray-300 text-center">{item.size || "-"}</td>
              <td className="p-3 border border-gray-300 text-center font-bold">{item.quantity}</td>
              <td className="p-3 border border-gray-300 text-center text-red-600 font-bold">{item.sale || 0}%</td>
              <td className="p-3 border border-gray-300 text-right">
                {p ? p.price.toLocaleString() : "-"}
              </td>
              <td className="p-3 border border-gray-300 text-right font-bold text-blue-900">
                {calcSubtotal(item).toLocaleString()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
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
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <ImageDown className="w-5 h-5" />
          <span className="hidden sm:inline">Xuất ảnh</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* PHẦN 1: FORM NHẬP LIỆU (EDITABLE) */}
      {/* ========================================================= */}
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
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Điều khoản</label>
            <input
              type="text"
              placeholder="Nhập điều khoản..."
              value={form.terms}
              onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Ngày giao</label>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  deliverDate: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Ngày đến</label>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  receivedDate: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Địa chỉ</label>
            <input
              type="text"
              placeholder="Nhập địa chỉ"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Điện thoại</label>
            <input
              type="text"
              placeholder="Nhập số điện thoại"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg text-blue-700">Sản phẩm</h3>
            <button
              onClick={addProduct}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
            >
              <PlusCircle className="w-5 h-5" />
              Thêm SP
            </button>
          </div>

          {form.items.length === 0 && (
            <p className="text-gray-500 italic text-center py-4 border border-dashed rounded-lg bg-gray-50">
              Chưa có sản phẩm nào. Nhấn "Thêm SP" để bắt đầu.
            </p>
          )}

          <div className="hidden sm:grid sm:grid-cols-7 gap-3 text-sm font-semibold text-gray-600 mb-2 px-1">
            <span>Tên sản phẩm</span>
            <span>Size</span>
            <span>SL</span>
            <span className="text-red-600">Sale (%)</span>
            <span className="text-right">Giá gốc</span>
            <span className="text-right">Thành tiền</span>
            <span className="text-center">Xóa</span>
          </div>

          <div className="space-y-4 sm:space-y-2">
            {form.items.map((item, i) => {
              const product = products.find((p) => String(p._id || p.id) === String(item.productId));
              const basePrice = product ? product.price * (item.quantity || 1) : 0;
              const salePrice = calcSubtotal(item);
              return (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-7 gap-3 border rounded-lg p-3 items-center bg-gray-50 sm:bg-white shadow-sm sm:shadow-none"
                >
                  <div className="relative">
                    <label className="sm:hidden text-xs text-gray-500 mb-1 block">Sản phẩm</label>
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        setForm((f) => {
                          const newItems = [...f.items];
                          newItems[i].productId = e.target.value;
                          return { ...f, items: newItems };
                        })
                      }
                      className={`${selectClass} py-1 text-sm`}
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((p) => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 bottom-2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <label className="sm:hidden text-xs text-gray-500 mb-1 block">Size</label>
                    <select
                      value={item.size}
                      onChange={(e) =>
                        setForm((f) => {
                          const newItems = [...f.items];
                          newItems[i].size = e.target.value;
                          return { ...f, items: newItems };
                        })
                      }
                      className={`${selectClass} py-1 text-sm`}
                    >
                      <option value="">Size</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                    </select>
                    <ChevronDown className="absolute right-2 bottom-2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>

                  <div>
                     <label className="sm:hidden text-xs text-gray-500 mb-1 block">SL</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        setForm((f) => {
                          const newItems = [...f.items];
                          newItems[i].quantity = Number(e.target.value);
                          return { ...f, items: newItems };
                        })
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1 text-center text-base"
                    />
                  </div>

                  <div>
                    <label className="sm:hidden text-xs text-gray-500 mb-1 block">Sale (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.sale}
                      onChange={(e) =>
                        setForm((f) => {
                          const newItems = [...f.items];
                          newItems[i].sale = Number(e.target.value);
                          return { ...f, items: newItems };
                        })
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1 text-center text-red-600 font-medium text-base"
                    />
                  </div>

                  <div className="flex justify-between sm:block text-right">
                    <span className="sm:hidden text-sm text-gray-500">Giá gốc:</span>
                    <span className="text-gray-600">{basePrice.toLocaleString()}₫</span>
                  </div>

                  <div className="flex justify-between sm:block text-right">
                    <span className="sm:hidden text-sm text-gray-500">Thành tiền:</span>
                    <span className="font-bold text-blue-700">{salePrice.toLocaleString()}₫</span>
                  </div>

                  <div className="flex justify-center sm:justify-center mt-2 sm:mt-0">
                    <button
                      onClick={() => removeProduct(i)}
                      className="bg-red-100 hover:bg-red-200 p-2 rounded-full text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-8 relative mt-6 border-t border-gray-100">
          <div className="sm:absolute right-0 bottom-0 sm:text-right space-y-2 bg-white sm:p-4 rounded-lg">
            <div className="flex justify-between sm:block">
               <span className="text-sm text-gray-600 sm:mr-2">Thành tiền:</span>
               <span>{calcTotal().toLocaleString()}₫</span>
            </div>
             <div className="flex justify-between sm:block">
               <span className="text-sm text-gray-600 sm:mr-2">Phí ship:</span>
               <span>+{(form.shipFee || 0).toLocaleString()}₫</span>
            </div>
            <div className="flex justify-between sm:block border-t pt-2 mt-2">
               <span className="text-lg font-bold text-blue-700 sm:mr-2">Tổng cộng:</span>
               <span className="text-lg font-bold text-blue-700">{totalWithShip.toLocaleString()}₫</span>
            </div>
          </div>

          <div className="w-full sm:w-40 mt-4 sm:mt-0">
            <label className="block text-sm mb-1 font-medium text-gray-700">Phí ship (₫)</label>
            <input
              type="number"
              value={form.shipFee}
              onChange={(e) =>
                setForm((f) => ({ ...f, shipFee: Number(e.target.value) }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PHẦN 2: KHU VỰC IN ẨN (ĐƯỢC HTML2CANVAS CHỤP) */}
      {/* ========================================================= */}
      <div
        id="print-area"
        ref={printRef}
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
        className="w-[1100px] bg-white text-gray-900 font-sans p-12 leading-relaxed flex flex-col min-h-[1400px]"
      >
        {/* HEADER: TITLE CENTER + TO */}
        <div className="text-center mb-10 border-b-4 border-blue-900 pb-6">
          <h2 className="text-6xl font-black text-blue-900 uppercase tracking-widest mb-4">
            PHIẾU ĐẶT HÀNG
          </h2>
          <p className="text-2xl text-gray-500 font-bold tracking-widest">
            NO: #{Date.now().toString().slice(-6)}
          </p>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-2 gap-16 text-2xl mb-12">
          <div className="space-y-4">
            <p><strong className="text-blue-900 w-36 inline-block">Khách hàng:</strong> {form.customerName}</p>
            <p><strong className="text-blue-900 w-36 inline-block">Địa chỉ:</strong> {form.address}</p>
            <p><strong className="text-blue-900 w-36 inline-block">Điện thoại:</strong> {form.phone}</p>
          </div>
          <div className="space-y-4">
            <p><strong className="text-blue-900 w-36 inline-block">Ngày giao:</strong> {form.deliverDate}</p>
            <p><strong className="text-blue-900 w-36 inline-block">Ngày đến:</strong> {form.receivedDate}</p>
            <p><strong className="text-blue-900 w-36 inline-block">Điều khoản:</strong> {form.terms}</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="flex-1">
            <ReceiptTablePrint />
        </div>

        {/* FOOTER: LOGO TRÁI - TIỀN PHẢI */}
        <div className="flex justify-between items-end pt-8 border-t-2 border-gray-300 mt-4">
            
            {/* LOGO GÓC TRÁI DƯỚI - TO HƠN GẤP 1.5 LẦN (h-40) */}
            <div className="flex flex-col justify-end">
                {logoBase64 ? (
                    <img src={logoBase64} alt="Logo" className="h-40 object-contain mb-2" loading="eager" />
                ) : (
                    <div className="h-40 w-40 bg-gray-100 flex items-center justify-center">No Logo</div>
                )}
                <p className="text-gray-500 italic text-xl ml-2">Cảm ơn quý khách đã ủng hộ!</p>
            </div>

            {/* TỔNG TIỀN BÊN PHẢI */}
            <div className="w-[450px] text-xl space-y-4 bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center text-2xl">
                    <span className="text-gray-600 font-medium">Tạm tính:</span>
                    <span className="font-bold text-gray-800">{calcTotal().toLocaleString()}₫</span>
                </div>
                <div className="flex justify-between items-center text-2xl border-b border-gray-300 pb-4">
                    <span className="text-gray-600 font-medium">Phí ship:</span>
                    <span className="font-bold text-gray-800">{form.shipFee.toLocaleString()}₫</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <span className="text-3xl font-black text-blue-900">TỔNG CỘNG:</span>
                    <span className="text-5xl font-black text-red-600">{totalWithShip.toLocaleString()}₫</span>
                </div>
            </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PHẦN 3: PREVIEW (Đồng bộ với Print Layout) */}
      {/* ========================================================= */}
      <h1 className="text-blue-700 text-center pt-10 font-bold pb-4 text-xl">XEM TRƯỚC (PREVIEW)</h1>
      <div className="flex justify-center border-4 border-blue-600 rounded-xl overflow-hidden w-full overflow-x-auto bg-gray-100 p-4">
        <div className="min-w-[900px] scale-[0.6] sm:scale-100 origin-top-left bg-white text-gray-900 font-sans p-10 shadow-lg flex flex-col min-h-[1200px]">
          
          <div className="text-center mb-10 border-b-4 border-blue-900 pb-6">
            <h2 className="text-6xl font-black text-blue-900 uppercase tracking-widest mb-4">PHIẾU ĐẶT HÀNG</h2>
            <p className="text-2xl text-gray-500 font-bold tracking-widest">NO: #{Date.now().toString().slice(-6)}</p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-xl mb-10">
            <div className="space-y-3">
              <p><strong className="text-blue-900">Khách hàng:</strong> {form.customerName}</p>
              <p><strong className="text-blue-900">Địa chỉ:</strong> {form.address}</p>
              <p><strong className="text-blue-900">Điện thoại:</strong> {form.phone}</p>
            </div>
            <div className="space-y-3">
              <p><strong className="text-blue-900">Ngày giao:</strong> {form.deliverDate}</p>
              <p><strong className="text-blue-900">Ngày đến:</strong> {form.receivedDate}</p>
              <p><strong className="text-blue-900">Điều khoản:</strong> {form.terms}</p>
            </div>
          </div>

          <div className="flex-1">
             <ReceiptTablePrint />
          </div>

          <div className="flex justify-between items-end pt-8 border-t-2 border-gray-300 mt-4">
            <div className="flex flex-col justify-end">
                 <img src="/lunale.png" alt="Logo" className="h-32 object-contain mb-2" />
                 <p className="text-gray-500 italic text-lg ml-2">Cảm ơn quý khách đã ủng hộ!</p>
            </div>
            <div className="w-[400px] text-lg space-y-3 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center text-xl"><span className="text-gray-600 font-medium">Tạm tính:</span><span className="font-bold text-gray-800">{calcTotal().toLocaleString()}₫</span></div>
                <div className="flex justify-between items-center text-xl border-b border-gray-300 pb-3"><span className="text-gray-600 font-medium">Phí ship:</span><span className="font-bold text-gray-800">{form.shipFee.toLocaleString()}₫</span></div>
                <div className="flex justify-between items-center pt-2"><span className="text-2xl font-black text-blue-900">TỔNG:</span><span className="text-4xl font-black text-red-600">{totalWithShip.toLocaleString()}₫</span></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderReceipt;