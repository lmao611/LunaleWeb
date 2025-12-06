import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Trash2, ImageDown, ChevronDown } from "lucide-react";
import domtoimage from "dom-to-image-more";
import axios from "../lib/axios";

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

  const receiptRef = useRef(null);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi API song song
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
        // Hiển thị lỗi ra màn hình để debug trên điện thoại
        // alert("Lỗi tải dữ liệu: " + (err.response?.data?.message || err.message));
      }
    };
    fetchData();
  }, []);

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

  const handleExportImage = async () => {
    if (!printRef.current) return;

    try {
      const el = printRef.current;
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "0";
      el.style.zIndex = "9999"; 

      await new Promise((r) => setTimeout(r, 500)); 

      const dataUrl = await domtoimage.toPng(el, {
        quality: 1,
        bgcolor: "#ffffff",
        cacheBust: true,
        width: el.scrollWidth,
        height: el.scrollHeight,
        style: { transform: "scale(1)", transformOrigin: "top left" },
      });

      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      el.style.position = "absolute";
      el.style.top = "-9999px";
      el.style.left = "-9999px";
      el.style.zIndex = "-1";

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `phieu_dat_hang_${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Không thể xuất ảnh, vui lòng thử lại.");
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
          onClick={handleExportImage}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <ImageDown className="w-5 h-5" />
          <span className="hidden sm:inline">Xuất ảnh</span>
        </button>
      </div>

      <div ref={receiptRef}>
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700 uppercase tracking-wide">
          Phiếu Đặt Hàng
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
        className="w-[1000px] bg-white text-gray-900 font-sans p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <img src="/lunale.png" alt="Logo" className="h-12" />
          <h2 className="text-2xl font-bold text-center text-blue-700 flex-1">
            PHIẾU ĐẶT HÀNG
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p><strong>Khách hàng:</strong> {form.customerName}</p>
            <p><strong>Địa chỉ:</strong> {form.address}</p>
            <p><strong>Điện thoại:</strong> {form.phone}</p>
          </div>
          <div>
            <p><strong>Ngày giao:</strong> {form.deliverDate}</p>
            <p><strong>Ngày đến:</strong> {form.receivedDate}</p>
            <p><strong>Điều khoản:</strong> {form.terms}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-blue-50 border-b">
              <th className="p-2 text-left border">Sản phẩm</th>
              <th className="p-2 border text-center">Size</th>
              <th className="p-2 border text-center">SL</th>
              <th className="p-2 border text-center text-red-600 border-black">Sale (%)</th>
              <th className="p-2 border text-right">Đơn giá</th>
              <th className="p-2 border text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((item, i) => {
              const p = products.find((x) => String(x._id || x.id) === String(item.productId));
              return (
                <tr key={i} className="border-b">
                  <td className="p-2 border">{p?.name || "-"}</td>
                  <td className="p-2 border text-center">{item.size || "-"}</td>
                  <td className="p-2 border text-center">{item.quantity}</td>
                  <td className="p-2 border text-center text-red-600 border-black">{item.sale || 0}</td>
                  <td className="p-2 border text-right">
                    {p ? p.price.toLocaleString() : "-"}
                  </td>
                  <td className="p-2 border text-right">
                    {calcSubtotal(item).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="ml-auto w-64 text-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Thành tiền:</span>
            <span className="font-bold">{calcTotal().toLocaleString()}₫</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Phí ship:</span>
            <span className="font-bold">{form.shipFee.toLocaleString()}₫</span>
          </div>

          <p className="font-bold text-3xl text-red-500 pt-4 text-right">
            {totalWithShip.toLocaleString()}₫
          </p>
        </div>
      </div>
      <h1 className="text-blue-700 text-center pt-7 font-bold pb-4 ">Preview</h1>

      <div className="flex justify-center border-4 border-blue-600 rounded-xl overflow-hidden w-full overflow-x-auto">
        <div className="min-w-[800px] scale-75 sm:scale-100 origin-top-left bg-white text-gray-900 font-sans p-8">
          <div className="flex justify-between items-center mb-6">
            <img src="/lunale.png" alt="Logo" className="h-12" />
            <h2 className="text-2xl font-bold text-center text-blue-700 flex-1">
              PHIẾU ĐẶT HÀNG
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p><strong>Khách hàng:</strong> {form.customerName}</p>
              <p><strong>Địa chỉ:</strong> {form.address}</p>
              <p><strong>Điện thoại:</strong> {form.phone}</p>
            </div>
            <div>
              <p><strong>Ngày giao:</strong> {form.deliverDate}</p>
              <p><strong>Ngày đến:</strong> {form.receivedDate}</p>
              <p><strong>Điều khoản:</strong> {form.terms}</p>
            </div>
          </div>

          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr className="bg-blue-50 border-b">
                <th className="p-2 text-left border">Sản phẩm</th>
                <th className="p-2 border text-center">Size</th>
                <th className="p-2 border text-center">SL</th>
                <th className="p-2 border text-center text-red-600 border-black">Sale (%)</th>
                <th className="p-2 border text-right">Đơn giá</th>
                <th className="p-2 border text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, i) => {
                const p = products.find((x) => String(x._id || x.id) === String(item.productId));
                return (
                  <tr key={i} className="border-b">
                    <td className="p-2 border">{p?.name || "-"}</td>
                    <td className="p-2 border text-center">{item.size || "-"}</td>
                    <td className="p-2 border text-center">{item.quantity}</td>
                    <td className="p-2 border text-center text-red-600 border-black">{item.sale || 0}</td>
                    <td className="p-2 border text-right">
                      {p ? p.price.toLocaleString() : "-"}
                    </td>
                    <td className="p-2 border text-right">
                      {calcSubtotal(item).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="ml-auto w-64 text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Thành tiền:</span>
              <span className="font-bold">{calcTotal().toLocaleString()}₫</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Phí ship:</span>
              <span className="font-bold">{form.shipFee.toLocaleString()}₫</span>
            </div>

            <p className="font-bold text-3xl text-red-500 pt-4 text-right">
              {totalWithShip.toLocaleString()}₫
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderReceipt;