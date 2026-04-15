import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Trash2, ImageDown, X, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";

const OrderReceipt = ({ inputOrder = null, onClose = null }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [logoBase64, setLogoBase64] = useState("");
  const [logoStatus, setLogoStatus] = useState("Đang tải...");
  
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [focusedProductIndex, setFocusedProductIndex] = useState(null);

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
    customTotalAmount: undefined,
  });

  const { checkingAuth } = useUserStore();
  const receiptRef = useRef(null);
  const printRef = useRef(null);

  useEffect(() => {
    if (inputOrder) {
        const mappedItems = inputOrder.products.map(p => ({
            productId: p.product._id || p.product,
            quantity: p.quantity,
            size: p.size,
            sale: 0,
            tempName: p.name, 
            tempPrice: p.price 
        }));

        const today = new Date();
        const d = String(today.getDate()).padStart(2, "0");
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const y = today.getFullYear();
        const currentDateStr = `${d}/${m}/${y}`;

        const future = new Date(today.setDate(today.getDate() + 3));
        const fd = String(future.getDate()).padStart(2, "0");
        const fm = String(future.getMonth() + 1).padStart(2, "0");
        const fy = future.getFullYear();
        const deliverDateStr = `${fd}/${fm}/${fy}`;
        
        setForm({
            customerId: inputOrder.user || "", 
            customerName: inputOrder.customerInfo?.name || "",
            address: inputOrder.customerInfo?.address || "",
            phone: inputOrder.customerInfo?.phone || "",
            terms: inputOrder.note || "",
            deliverDate: deliverDateStr, 
            receivedDate: currentDateStr, 
            salePercent: 0,
            shipFee: inputOrder.shipFee || 30000, 
            items: mappedItems,
            customTotalAmount: undefined
        });
    }
  }, [inputOrder]);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch(`/lunale.png?v=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoBase64(reader.result);
            setLogoStatus("Sẵn sàng");
        };
        reader.onerror = () => {
            setLogoStatus("Lỗi đọc file");
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        setLogoStatus("Lỗi tải: " + e.message);
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
        } catch (err) {}
      };
      fetchData();
    }
  }, [checkingAuth]);

  const addProduct = () => setForm((f) => ({ ...f, items: [...f.items, { productId: "", quantity: 1, size: "M", sale: 0 }] }));
  const removeProduct = (index) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const getProductInfo = (item) => {
      const productInDb = products.find((p) => String(p._id || p.id) === String(item.productId));
      const name = item.tempName !== undefined ? item.tempName : (productInDb?.name || "");
      const price = item.tempPrice !== undefined ? item.tempPrice : (productInDb?.price || 0);
      return { name, price };
  };

  const calcSubtotal = (item) => {
    const { price } = getProductInfo(item);
    const discount = ((price * (item.sale || 0)) / 100) * (item.quantity || 1);
    return price * (item.quantity || 1) - discount;
  };

  const calcTotal = () => {
    const subtotal = form.items.reduce((acc, it) => acc + calcSubtotal(it), 0);
    const discount = (subtotal * (form.salePercent || 0)) / 100;
    return subtotal - discount;
  };

  const calculatedTotalWithShip = calcTotal() + (form.shipFee || 0);
  const totalWithShip = form.customTotalAmount !== undefined ? form.customTotalAmount : calculatedTotalWithShip;

  const convertToISO = (dateString) => {
    if (!dateString) return null;
    const cleaned = dateString.replace(/[^\d\/\-\.]/g, "");
    const parts = cleaned.split(/[\/\-\.]/); 
    if (parts.length === 3) {
      let [d, m, y] = parts;
      d = d.padStart(2, "0");
      m = m.padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return null;
  };

  const saveOrderToSystem = async () => {
    if (!form.customerId && !form.customerName) {
       toast.error("Vui lòng chọn hoặc nhập tên khách hàng để lưu đơn!");
       return false;
    }

    const isoDeliverDate = convertToISO(form.deliverDate);
    const isoReceivedDate = convertToISO(form.receivedDate);

    if ((form.deliverDate && !isoDeliverDate) || (form.receivedDate && !isoReceivedDate)) {
        toast.error("Ngày tháng không hợp lệ! Vui lòng nhập theo dạng: Ngày/Tháng/Năm (VD: 15/01/2026)");
        return false;
    }

    try {
      const dbItems = form.items.map(item => {
        const { price } = getProductInfo(item);
        const unitPriceAfterSale = price * (1 - (item.sale || 0) / 100);
        
        const mappedItem = {
           name: item.tempName,
           quantity: item.quantity,
           size: item.size,
           price: unitPriceAfterSale 
        };
        if (item.productId) mappedItem.productId = item.productId;
        return mappedItem;
      });

      const payload = {
        customerName: form.customerName,
        address: form.address,
        phone: form.phone,
        items: dbItems,
        status: "chưa giao", 
        paymentMethod: "COD", 
        shipFee: form.shipFee 
      };

      if (form.customerId) payload.customerId = form.customerId;
      if (isoReceivedDate) payload.receivedDate = isoReceivedDate;
      if (isoDeliverDate) payload.deliverDate = isoDeliverDate;

      await axios.post("/orders", payload);
      toast.success("Đã lưu đơn hàng vào hệ thống!");
      return true;
    } catch (error) {
      toast.error("Lỗi khi lưu đơn hàng.");
      return false;
    }
  };

  const waitForImages = async (element) => {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(async (img) => {
       if (!img.complete) {
           await new Promise((resolve) => {
               img.onload = resolve;
               img.onerror = resolve; 
           });
       }
    });
    await Promise.all(promises);
  };

  const handleGenerateImage = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);

    if (!inputOrder) {
        const saved = await saveOrderToSystem();
        await new Promise(r => setTimeout(r, 200));
        if (!saved) {
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
      el.style.zIndex = "-10"; 
      el.style.backgroundColor = "#ffffff";

      await waitForImages(el); 
      await new Promise((r) => setTimeout(r, 800)); 

      const dataUrl = await toPng(el, {
        quality: 1.0,
        pixelRatio: 3, 
        skipAutoScale: true,
        backgroundColor: '#ffffff',
        style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
        }
      });

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      if (isDesktop && !inputOrder) {
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
      toast.error("Lỗi tạo ảnh: " + err.message);
    } finally {
      if (printRef.current) {
        el.style.opacity = "0.01";
        el.style.zIndex = "-50";
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
    } catch (error) {}
  };

  const selectClass = "w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 outline-none appearance-none relative z-10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white ${inputOrder ? '' : 'border border-gray-200 shadow-md rounded-2xl'} p-4 sm:p-6 max-w-4xl mx-auto`}
    >
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm py-2 border-b border-gray-100 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 flex justify-between items-center shadow-sm">
        <div className="flex flex-col">
            {onClose && (
                <button onClick={onClose} className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-medium text-sm">
                    <X size={18} /> Thoát
                </button>
            )}
            <span className={`text-xs px-3 mt-1 font-mono ${logoStatus === "Sẵn sàng" ? "text-green-600" : "text-red-500"}`}>
                Trạng thái Logo: {logoStatus}
            </span>
        </div>

        <button
          onClick={handleGenerateImage}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium disabled:opacity-50 text-sm"
        >
          {isGenerating ? (
            <span className="animate-pulse">Đang xử lý...</span>
          ) : (
            <>
              <ImageDown className="w-4 h-4" />
              <span>{inputOrder ? "Lưu ảnh ngay" : "Lưu & Xuất ảnh"}</span>
            </>
          )}
        </button>
      </div>

      <div ref={receiptRef}>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-blue-700 uppercase tracking-wide">
          {inputOrder ? "Chi Tiết Đơn Hàng" : "Phiếu Đặt Hàng"}
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <label className="block text-sm mb-1 font-medium text-gray-700">Khách hàng <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => {
                setForm((f) => ({ ...f, customerName: e.target.value, customerId: "" }));
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
              placeholder="Nhập tên khách hàng..."
              className={selectClass}
            />
            {showCustomerDropdown && form.customerName && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto mt-1 rounded-lg">
                {customers.filter(c => c.name.toLowerCase().includes(form.customerName.toLowerCase()) || c.phoneNumber?.includes(form.customerName)).map(c => (
                  <div
                    key={c._id || c.id}
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        customerId: c._id || c.id,
                        customerName: c.name,
                        phone: c.phoneNumber || c.phone || f.phone,
                        address: c.direction || c.address || f.address,
                      }));
                      setShowCustomerDropdown(false);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    <div className="font-medium text-gray-800">{c.name}</div>
                    {c.phoneNumber && <div className="text-xs text-gray-500">{c.phoneNumber}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Điều khoản / Ghi chú</label>
            <input type="text" value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Ngày giao</label>
            <input type="text" value={form.deliverDate} onChange={(e) => setForm((f) => ({ ...f, deliverDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Ngày đến</label>
            <input type="text" value={form.receivedDate} onChange={(e) => setForm((f) => ({ ...f, receivedDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
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
          <div className="hidden md:grid md:grid-cols-7 gap-3 text-sm font-semibold text-gray-600 mb-2 px-1">
            <span>Tên sản phẩm</span>
            <span>Size</span>
            <span>SL</span>
            <span className="text-red-600">Sale (%)</span>
            <span className="text-right">Giá gốc</span>
            <span className="text-right">Thành tiền</span>
            <span className="text-center">Xóa</span>
          </div>
          <div className="space-y-4 md:space-y-2">
            {form.items.map((item, i) => {
              const info = getProductInfo(item);
              const salePrice = calcSubtotal(item);

              return (
                <div key={i} className="grid grid-cols-1 md:grid-cols-7 gap-3 border rounded-lg p-3 items-center bg-gray-50 md:bg-white shadow-sm md:shadow-none">
                  <div className="relative">
                    <label className="md:hidden text-xs text-gray-500 mb-1">Sản phẩm</label>
                    {inputOrder && item.tempName && !item.productId ? (
                        <div className="font-medium text-sm text-gray-800 p-2 bg-gray-100 rounded border border-gray-200 truncate" title={item.tempName}>
                            {item.tempName}
                        </div>
                    ) : (
                        <div className="relative">
                            <input 
                                type="text"
                                value={item.tempName !== undefined ? item.tempName : info.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setForm(f => {
                                        const newItems = [...f.items];
                                        newItems[i].productId = "";
                                        newItems[i].tempName = val;
                                        return { ...f, items: newItems };
                                    });
                                    setFocusedProductIndex(i);
                                }}
                                onFocus={() => setFocusedProductIndex(i)}
                                onBlur={() => setTimeout(() => setFocusedProductIndex(null), 200)}
                                className={`${selectClass} py-1 text-sm bg-transparent`}
                                placeholder="Tên sản phẩm..."
                            />
                            {focusedProductIndex === i && (item.tempName !== undefined ? item.tempName : info.name) && (
                                <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto mt-1 rounded-lg">
                                    {products.filter(p => p.name.toLowerCase().includes((item.tempName !== undefined ? item.tempName : info.name).toLowerCase())).map(p => (
                                        <div
                                            key={p._id || p.id}
                                            onClick={() => {
                                                setForm(f => {
                                                    const newItems = [...f.items];
                                                    newItems[i].productId = p._id || p.id;
                                                    newItems[i].tempName = p.name;
                                                    newItems[i].tempPrice = p.price;
                                                    return { ...f, items: newItems };
                                                });
                                                setFocusedProductIndex(null);
                                            }}
                                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm flex flex-col"
                                        >
                                            <span className="font-medium text-gray-800">{p.name}</span>
                                            <span className="text-xs text-blue-600">{p.price?.toLocaleString()}₫</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                  <div>
                    <label className="md:hidden text-xs text-gray-500 mb-1">Size</label>
                    <select 
                        value={item.size} 
                        onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].size = e.target.value; return { ...f, items: newItems }; })} 
                        className={`${selectClass} py-1 text-sm text-center px-1`}
                    >
                        <option value="">Size</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                    </select>
                  </div>
                  <div><label className="md:hidden text-xs text-gray-500 mb-1">SL</label><input type="number" min="1" value={item.quantity} onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].quantity = Number(e.target.value); return { ...f, items: newItems }; })} className="w-full border border-gray-300 rounded px-2 py-1 text-center text-base" /></div>
                  <div><label className="md:hidden text-xs text-gray-500 mb-1">Sale</label><input type="number" min="0" max="100" value={item.sale} onChange={(e) => setForm((f) => { const newItems = [...f.items]; newItems[i].sale = Number(e.target.value); return { ...f, items: newItems }; })} className="w-full border border-gray-300 rounded px-2 py-1 text-center text-red-600 font-medium text-base" /></div>
                  <div className="flex justify-between md:block text-right">
                    <span className="md:hidden text-sm text-gray-500">Giá gốc:</span>
                    <input
                        type="number"
                        value={info.price}
                        onChange={(e) => {
                            setForm((f) => {
                                const newItems = [...f.items];
                                newItems[i].tempPrice = Number(e.target.value);
                                return { ...f, items: newItems };
                            });
                        }}
                        className="w-full md:w-24 border border-gray-300 rounded px-2 py-1 text-right text-gray-600 text-base"
                    />
                  </div>
                  <div className="flex justify-between md:block text-right"><span className="md:hidden text-sm text-gray-500">Thành tiền:</span><span className="font-bold text-blue-700">{salePrice.toLocaleString()}₫</span></div>
                  <div className="flex justify-center md:justify-center mt-2 md:mt-0"><button onClick={() => removeProduct(i)} className="bg-red-100 hover:bg-red-200 p-2 rounded-full text-red-600 transition"><Trash2 className="w-4 h-4" /></button></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="w-full md:w-40 order-2 md:order-1 mt-4 md:mt-0">
            <label className="block text-sm mb-1 font-medium text-gray-700">Phí ship (₫)</label>
            <input type="number" value={form.shipFee} onChange={(e) => setForm((f) => ({ ...f, shipFee: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <div className="w-full md:w-auto order-1 md:order-2 space-y-3 bg-white">
            <div className="flex justify-between md:justify-end items-center"><span className="text-sm text-gray-600 md:mr-4">Thành tiền:</span><span className="font-medium text-right md:w-24">{calcTotal().toLocaleString()}₫</span></div>
            <div className="flex justify-between md:justify-end items-center"><span className="text-sm text-gray-600 md:mr-4">Phí ship:</span><span className="font-medium text-right md:w-24">+{(form.shipFee || 0).toLocaleString()}₫</span></div>
            <div className="flex justify-between md:justify-end items-center border-t pt-3 mt-2">
                <span className="text-lg font-bold text-blue-700 md:mr-3">Tổng cộng:</span>
                <input
                    type="number"
                    value={totalWithShip}
                    onChange={(e) => setForm(f => ({ ...f, customTotalAmount: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="w-32 border border-gray-300 rounded px-2 py-1.5 text-right text-lg font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
          </div>
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
        style={{ position: "absolute", top: 0, left: 0, opacity: 0.01, pointerEvents: "none", zIndex: -50 }}
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
              const info = getProductInfo(item);
              return (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3 border border-gray-200 font-medium">{info.name}</td>
                  <td className="p-3 border border-gray-200 text-center">{item.size || "-"}</td>
                  <td className="p-3 border border-gray-200 text-center">{item.quantity}</td>
                  <td className="p-3 border border-gray-200 text-center text-red-500 font-bold">{item.sale ? `${item.sale}%` : "-"}</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-600">{info.price.toLocaleString()}</td>
                  <td className="p-3 border border-gray-200 text-right font-bold text-blue-800">{calcSubtotal(item).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-between items-end mt-24 pt-10 border-t-2 border-gray-300">
           <div className="pl-4">
              {logoBase64 ? (
                <img src={logoBase64} alt="Logo" className="w-56 block object-contain" />
              ) : (
                <div className="w-56 h-16 border-2 border-dashed border-red-300 flex items-center justify-center text-red-500 font-bold">LỖI LOGO</div>
              )}
              <p className="text-gray-400 text-sm mt-2 italic font-medium">Cảm ơn bạn đã lựa chọn Lunale!</p>
           </div>
           <div className="w-[450px] space-y-3 text-right pr-4">
              <div className="flex justify-between items-center text-xl text-gray-600"><span>Thành tiền:</span><span className="font-semibold">{calcTotal().toLocaleString()}₫</span></div>
              <div className="flex justify-between items-center text-xl text-gray-600"><span>Phí vận chuyển:</span><span className="font-semibold">{form.shipFee.toLocaleString()}₫</span></div>
              <div className="h-[2px] bg-gray-200 my-2"></div>
              <div className="flex justify-between items-center"><span className="text-2xl font-bold text-blue-900">TỔNG CỘNG:</span><span className="text-4xl font-extrabold text-red-600">{totalWithShip.toLocaleString()}₫</span></div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderReceipt;