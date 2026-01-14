import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Trash2, ImageDown, ChevronDown, X, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";

const OrderReceipt = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [logoBase64, setLogoBase64] = useState("");
  
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch(`/lunale.png?t=${Date.now()}`);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error(e);
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
          setCustomers(Array.isArray(custRes.data) ? custRes.data : (custRes.data.users || []));
          setProducts(prodRes.data.products || (Array.isArray(prodRes.data) ? prodRes.data : []));
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

  const addProduct = () => setForm((f) => ({ ...f, items: [...f.items, { productId: "", quantity: 1, size: "", sale: 0 }] }));
  const removeProduct = (index) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

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

  // --- HÀM LƯU ĐƠN HÀNG VÀO DB ---
  const saveOrderToSystem = async () => {
    if (!form.customerId) {
       toast.error("Vui lòng chọn khách hàng từ danh sách để lưu đơn!");
       return false;
    }

    try {
      const dbItems = form.items.map(item => {
        const product = products.find(p => String(p._id || p.id) === String(item.productId));
        const basePrice = product ? product.price : 0;
        const unitPriceAfterSale = basePrice * (1 - (item.sale || 0) / 100);
        
        return {
           productId: item.productId,
           quantity: item.quantity,
           size: item.size,
           price: unitPriceAfterSale 
        };
      });

      const payload = {
        customerId: form.customerId,
        customerName: form.customerName,
        address: form.address,
        phone: form.phone,
        items: dbItems,
        status: "chưa giao", 
        receivedDate: form.receivedDate || null,
        deliverDate: form.deliverDate || null,
        paymentMethod: "COD", 
        shipFee: form.shipFee 
      };

      await axios.post("/orders", payload);
      toast.success("Đã lưu đơn hàng vào hệ thống!");
      return true;
    } catch (error) {
      console.error("Save error", error);

      // --- PHẦN DEBUG: HIỆN LỖI LÊN IPHONE ---
      let debugMessage = "";
      if (error.response) {
        // Server trả về mã lỗi (4xx, 5xx)
        debugMessage = `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        // Không nhận được phản hồi
        debugMessage = "Không có phản hồi từ Server (Network Error). Kiểm tra lại kết nối hoặc link API.";
      } else {
        // Lỗi setup request
        debugMessage = error.message;
      }
      alert("DEBUG ERROR:\n" + debugMessage); 
      // ----------------------------------------

      toast.error("Lỗi khi lưu đơn hàng: " + (error.response?.data?.message || error.message));
      return false;
    }
  };

  const handleGenerateImage = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);

    if (form.customerId) {
        const saved = await saveOrderToSystem();
        // Thêm một chút delay sau khi lưu để UI kịp phản hồi
        await new Promise(r => setTimeout(r, 200));

        if (!saved) {
            // Sử dụng window.confirm để hỏi ý kiến người dùng nếu lưu lỗi
            const userContinue = window.confirm("Lưu đơn hàng thất bại. Bạn có muốn tiếp tục xuất ảnh KHÔNG lưu đơn?");
            if (!userContinue) {
                setIsGenerating(false);
                return;
            }
        }
    }

    const el = printRef.current;
    
    try {
      el.style.display = "block";
      el.style.opacity = "1";
      el.style.top = "0";
      el.style.left = "0";
      el.style.zIndex = "-10"; 
      el.style.backgroundColor = "#ffffff";

      const logoImg = el.querySelector("#print-logo");
      if (logoImg && logoBase64) {
         if (logoImg.decode) {
             await logoImg.decode().catch(() => {});
         }
      }
      
      await document.fonts.ready;
      // Tăng delay lên 1 chút để Safari ổn định layout sau alert/confirm
      await new Promise((r) => setTimeout(r, 1000)); 

      const dataUrl = await toPng(el, {
        quality: 1.0,
        cacheBust: true,
        pixelRatio: 3, 
        skipAutoScale: true,
        backgroundColor: '#ffffff',
      });

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      if (isDesktop) {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `don_hang_${form.customerName || 'khach'}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setGeneratedImage(dataUrl);
      }

    } catch (err) {
      console.error(err);
      alert("Lỗi tạo ảnh: " + err.message);
    } finally {
      if (printRef.current) {
        el.style.opacity = "0";
        el.style.top = "-9999px";
        el.style.left = "-9999px";
        el.style.zIndex = "-1";
      }
      setIsGenerating(false);
    }
  };

  const handleShareOrSave = async () => {
    if (!generatedImage) return;

    try {
      const blob = await (await fetch(generatedImage)).blob();
      const file = new File([blob], `don_hang.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Đơn hàng Lunale',
          text: 'Phiếu đặt hàng'
        });
      } else {
        const link = document.createElement("a");
        link.href = generatedImage;
        link.download = `don_hang_${Date.now()}.png`;
        link.click();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const selectClass = "w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 outline-none appearance-none relative z-10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white border border-gray-200 shadow-md rounded-2xl p-4 sm:p-8 max-w-4xl mx-auto"
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={handleGenerateImage}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="animate-pulse">Đang xử lý...</span>
          ) : (
            <>
              <ImageDown className="w-5 h-5" />
              <span className="hidden sm:inline">Lưu & Xuất ảnh</span>
            </>
          )}
        </button>
      </div>

      <div ref={receiptRef}>
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700 uppercase tracking-wide">
          Phiếu Đặt Hàng
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <label className="block text-sm mb-1 font-medium text-gray-700">Khách hàng <span className="text-red-500">*</span></label>
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
              placeholder="Hoặc nhập tên khách hàng (Chỉ in, không lưu)"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {/* Các trường input khác giữ nguyên như cũ */}
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Điều khoản</label>
            <input type="text" value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Ngày giao</label>
            <input type="text" onChange={(e) => setForm((f) => ({ ...f, deliverDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Ngày đến</label>
            <input type="text" onChange={(e) => setForm((f) => ({ ...f, receivedDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Địa chỉ</label>
            <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Điện thoại</label>
            <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
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
                <div key={i} className="grid grid-cols-1 sm:grid-cols-7 gap-3 border rounded-lg p-3 items-center bg-gray-50 sm:bg-white shadow-sm sm:shadow-none">
                  <div className="relative">
                    <label className="sm:hidden text-xs text-gray-500 mb-1">Sản phẩm</label>
                    <select value={item.productId} onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].productId = e.target.value; return { ...f, items: newItems }; })} className={`${selectClass} py-1 text-sm`}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 bottom-2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <label className="sm:hidden text-xs text-gray-500 mb-1">Size</label>
                    <select value={item.size} onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].size = e.target.value; return { ...f, items: newItems }; })} className={`${selectClass} py-1 text-sm`}>
                      <option value="">Size</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option>
                    </select>
                    <ChevronDown className="absolute right-2 bottom-2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  <div><label className="sm:hidden text-xs text-gray-500 mb-1">SL</label><input type="number" min="1" value={item.quantity} onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].quantity = Number(e.target.value); return { ...f, items: newItems }; })} className="w-full border border-gray-300 rounded px-2 py-1 text-center text-base" /></div>
                  <div><label className="sm:hidden text-xs text-gray-500 mb-1">Sale</label><input type="number" min="0" max="100" value={item.sale} onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].sale = Number(e.target.value); return { ...f, items: newItems }; })} className="w-full border border-gray-300 rounded px-2 py-1 text-center text-red-600 font-medium text-base" /></div>
                  <div className="flex justify-between sm:block text-right"><span className="sm:hidden text-sm text-gray-500">Giá gốc:</span><span className="text-gray-600">{basePrice.toLocaleString()}₫</span></div>
                  <div className="flex justify-between sm:block text-right"><span className="sm:hidden text-sm text-gray-500">Thành tiền:</span><span className="font-bold text-blue-700">{salePrice.toLocaleString()}₫</span></div>
                  <div className="flex justify-center sm:justify-center mt-2 sm:mt-0"><button onClick={() => removeProduct(i)} className="bg-red-100 hover:bg-red-200 p-2 rounded-full text-red-600 transition"><Trash2 className="w-4 h-4" /></button></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-8 relative mt-6 border-t border-gray-100">
          <div className="sm:absolute right-0 bottom-0 sm:text-right space-y-2 bg-white sm:p-4 rounded-lg">
            <div className="flex justify-between sm:block"><span className="text-sm text-gray-600 sm:mr-2">Thành tiền:</span><span>{calcTotal().toLocaleString()}₫</span></div>
            <div className="flex justify-between sm:block"><span className="text-sm text-gray-600 sm:mr-2">Phí ship:</span><span>+{(form.shipFee || 0).toLocaleString()}₫</span></div>
            <div className="flex justify-between sm:block border-t pt-2 mt-2"><span className="text-lg font-bold text-blue-700 sm:mr-2">Tổng cộng:</span><span className="text-lg font-bold text-blue-700">{totalWithShip.toLocaleString()}₫</span></div>
          </div>
          <div className="w-full sm:w-40 mt-4 sm:mt-0"><label className="block text-sm mb-1 font-medium text-gray-700">Phí ship (₫)</label><input type="number" value={form.shipFee} onChange={(e) => setForm((f) => ({ ...f, shipFee: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </div>

      <AnimatePresence>
        {generatedImage && (
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Ảnh đã tạo thành công</h3>
                <button onClick={() => setGeneratedImage(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 bg-gray-100 flex justify-center">
                <img src={generatedImage} alt="Receipt" className="max-w-full h-auto shadow-lg rounded" />
              </div>

              <div className="p-4 bg-white border-t space-y-3">
                <button 
                  onClick={handleShareOrSave}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 text-lg shadow-lg"
                >
                  <Share2 size={24} /> Chia sẻ / Lưu ảnh
                </button>
                <div className="text-center text-sm text-gray-500">
                  Hoặc <b>nhấn giữ vào ảnh</b> ở trên để chọn "Lưu vào Ảnh"
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        className="w-[1100px] bg-white text-gray-900 font-sans p-10"
      >
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-extrabold text-blue-800 uppercase tracking-widest border-b-4 border-blue-600 inline-block pb-2">
            PHIẾU ĐẶT HÀNG
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-8 text-lg mb-10">
          <div className="space-y-2">
            <p><span className="font-bold text-gray-600 w-32 inline-block">Khách hàng:</span> <span className="font-semibold text-xl">{form.customerName}</span></p>
            <p><span className="font-bold text-gray-600 w-32 inline-block">Điện thoại:</span> {form.phone}</p>
            <p><span className="font-bold text-gray-600 w-32 inline-block">Địa chỉ:</span> {form.address}</p>
          </div>
          <div className="space-y-2">
            <p><span className="font-bold text-gray-600 w-32 inline-block">Ngày giao:</span> {form.deliverDate}</p>
            <p><span className="font-bold text-gray-600 w-32 inline-block">Ngày đến:</span> {form.receivedDate}</p>
            <p><span className="font-bold text-gray-600 w-32 inline-block">Ghi chú:</span> {form.terms}</p>
          </div>
        </div>

        <table className="w-full border-collapse mb-8 table-fixed">
          <thead>
            <tr className="bg-blue-100 border-b-2 border-blue-300 text-blue-900 text-lg">
              <th className="p-3 text-left border border-blue-200 w-[36%]">Sản phẩm</th>
              <th className="p-3 border border-blue-200 text-center w-[8%]">Size</th>
              <th className="p-3 border border-blue-200 text-center w-[8%]">SL</th>
              <th className="p-3 border border-blue-200 text-center text-red-600 w-[10%]">Sale</th>
              <th className="p-3 border border-blue-200 text-right w-[18%]">Đơn giá</th>
              <th className="p-3 border border-blue-200 text-right w-[20%]">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="text-lg">
            {form.items.map((item, i) => {
              const p = products.find((x) => String(x._id || x.id) === String(item.productId));
              return (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3 border border-gray-200 font-medium">{p?.name || "-"}</td>
                  <td className="p-3 border border-gray-200 text-center">{item.size || "-"}</td>
                  <td className="p-3 border border-gray-200 text-center">{item.quantity}</td>
                  <td className="p-3 border border-gray-200 text-center text-red-500 font-bold">{item.sale ? `${item.sale}%` : "-"}</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-600">{p ? p.price.toLocaleString() : "-"}</td>
                  <td className="p-3 border border-gray-200 text-right font-bold text-blue-800">{calcSubtotal(item).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-between items-end mt-10 pt-6 border-t-2 border-gray-300">
           <div className="pl-4">
              <img 
                 id="print-logo"
                 src={logoBase64 || "/lunale.png"} 
                 alt="Logo" 
                 className="w-56 block object-contain"
                 crossOrigin="anonymous"
              />
              <p className="text-gray-400 text-sm mt-2 italic font-medium">Cảm ơn bạn đã lựa chọn Lunale!</p>
           </div>

           <div className="w-[450px] space-y-3 text-right pr-4">
              <div className="flex justify-between items-center text-xl text-gray-600">
                <span>Thành tiền:</span>
                <span className="font-semibold">{calcTotal().toLocaleString()}₫</span>
              </div>
              <div className="flex justify-between items-center text-xl text-gray-600">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold">{form.shipFee.toLocaleString()}₫</span>
              </div>
              <div className="h-[2px] bg-gray-200 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-900">TỔNG CỘNG:</span>
                <span className="text-4xl font-extrabold text-red-600">{totalWithShip.toLocaleString()}₫</span>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderReceipt;