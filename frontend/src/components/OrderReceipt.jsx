import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { PlusCircle, Trash2, ImageDown } from "lucide-react";
import domtoimage from "dom-to-image-more";

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

  // ===== Fetch data =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          axios.get("/api/users"),
          axios.get("/api/products"),
        ]);
        setCustomers(
          Array.isArray(custRes.data)
            ? custRes.data
            : custRes.data.customers || []
        );
        setProducts(
          Array.isArray(prodRes.data)
            ? prodRes.data
            : prodRes.data.products || []
        );
      } catch (err) {
        console.error(err);
        setCustomers([]);
        setProducts([]);
      }
    };
    fetchData();
  }, []);

  // ===== Select customer =====
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
    const c = customers.find((x) => String(x._id ?? x.id) === String(id));
    setForm((f) => ({
      ...f,
      customerId: id,
      customerName: c?.name || f.customerName,
      address: c?.direction || f.address,
      phone: c?.phoneNumber || f.phone,
    }));
  };

  // ===== Add/remove products =====
  const addProduct = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: "", quantity: 1, size: "", sale:0 }],
    }));

  const removeProduct = (index) =>
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));

  // ===== Calculations =====
  const calcSubtotal = (item) => {
    const product = products.find((p) => p._id === item.productId);
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

  // ===== Format date =====
  const formatDate = (input) => {
    if (!input) return "";
    const parts = input.split(/[/-]/);
    if (parts.length !== 3) return input;
    const [day, month, year] =
      Number(parts[0]) > 12 ? parts : [parts[1], parts[0], parts[2]];
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  };

  // ===== Export image =====
  const handleExportImage = async () => {
    if (!printRef.current) return;

    try {
      const el = printRef.current;
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
      el.style.position = "relative";
      el.style.top = "0";
      el.style.left = "0";

      await new Promise((r) => setTimeout(r, 300));

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

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `phieu_dat_hang_${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("❌ Export error:", err);
      alert("Không thể xuất ảnh, vui lòng thử lại.");
    }
  };

  // ===== UI =====
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white border border-gray-200 shadow-md rounded-2xl p-8 max-w-4xl mx-auto"
    >
      {/* Export button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExportImage}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <ImageDown className="w-5 h-5" />
          Xuất thành ảnh
        </button>
      </div>

      {/* ===== FORM VIEW ===== */}
      <div ref={receiptRef}>
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          Phiếu Đặt Hàng
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-1 font-medium">Khách hàng</label>
            <select
              value={form.customerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Chọn khách hàng --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Hoặc nhập tên khách hàng"
              value={form.customerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
              className="w-full border rounded px-3 py-2 mt-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium">Điều khoản</label>
            <input
              type="text"
              placeholder="Nhập điều khoản..."
              value={form.terms}
              onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium">Ngày giao</label>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={form.deliverDate}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  deliverDate: formatDate(e.target.value),
                }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium">Ngày đến</label>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={form.receivedDate}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  receivedDate: formatDate(e.target.value),
                }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium">Địa chỉ</label>
            <input
              type="text"
              placeholder="Nhập địa chỉ"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium">Điện thoại</label>
            <input
              type="text"
              placeholder="Nhập số điện thoại"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Products */}
        <div className="mb-6">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-semibold text-lg text-blue-700">Sản phẩm</h3>
    <button
      onClick={addProduct}
      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
    >
      <PlusCircle className="w-5 h-5" />
      Thêm sản phẩm
    </button>
  </div>

  {form.items.length === 0 && (
    <p className="text-gray-500 italic">Chưa có sản phẩm nào.</p>
  )}

  {/* ==== HEADER ==== */}
  <div className="grid sm:grid-cols-7 gap-3 text-sm font-semibold text-gray-600 mb-1">
    <span>Tên sản phẩm</span>
    <span>Size</span>
    <span>Số lượng</span>
    <span>Sale (%)</span>
    <span>Giá gốc</span>
    <span>Giá sau sale</span>
    <span>Xóa</span>
  </div>

  <div className="space-y-3">
    {form.items.map((item, i) => {
      const product = products.find((p) => p._id === item.productId);
      const basePrice = product ? product.price * (item.quantity || 1) : 0;
      const salePrice = calcSubtotal(item);
      return (
        <div
          key={i}
          className="grid sm:grid-cols-7 gap-3 border rounded-lg p-3 items-center"
        >
          {/* Product */}
          <div>
            <select
              value={item.productId}
              onChange={(e) =>
                setForm((f) => {
                  const newItems = [...f.items];
                  newItems[i].productId = e.target.value;
                  return { ...f, items: newItems };
                })
              }
              className="w-full border rounded px-2 py-1"
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div>
            <select
              value={item.size}
              onChange={(e) =>
                setForm((f) => {
                  const newItems = [...f.items];
                  newItems[i].size = e.target.value;
                  return { ...f, items: newItems };
                })
              }
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Size</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
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
              className="w-full border rounded px-2 py-1 text-center"
            />
          </div>

          {/* Sale (%) */}
          <div>
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
              className="w-full border rounded px-2 py-1 text-center"
            />
          </div>

          {/* Giá gốc */}
          <div className="text-right text-gray-600">
            {basePrice.toLocaleString()}₫
          </div>

          {/* Giá sau sale */}
          <div className="text-right font-semibold text-blue-700">
            {salePrice.toLocaleString()}₫
          </div>

          {/* Remove */}
          <div className="flex justify-center">
            <button
              onClick={() => removeProduct(i)}
              className="bg-red-100 hover:bg-red-200 p-1 rounded-full"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      );
    })}
  </div>
</div>

{/* ==== TOTALS (bottom right) ==== */}
<div className="relative mt-6">
  <div className="absolute right-0 bottom-0 text-right space-y-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <p className="text-sm text-gray-600">
      Thành tiền: {calcTotal().toLocaleString()}₫
    </p>
    <p className="text-sm text-gray-600">
      Phí ship: +{(form.shipFee || 0).toLocaleString()}₫
    </p>
    <p className="text-lg font-bold text-blue-700 border-t pt-2">
      Tổng cộng: {totalWithShip.toLocaleString()}₫
    </p>
  </div>

  <div className="w-40">
    <label className="block text-sm mb-1 font-medium">Phí ship (₫)</label>
    <input
      type="number"
      value={form.shipFee}
      onChange={(e) =>
        setForm((f) => ({ ...f, shipFee: Number(e.target.value) }))
      }
      className="w-full border rounded px-3 py-2"
    />
  </div>
</div>

        <div className="absolute bottom-4 left-4 opacity-70">
          <img src="/lunale.png" alt="Lunale Logo" className="h-10" />
        </div>
      </div>

      {/* ===== HIDDEN PRINT VIEW ===== */}
      <div
  id="print-area"
  ref={printRef}
  style={{
    position: "absolute",
    top: "-9999px",
    left: "-9999px",
    opacity: 0,
    pointerEvents: "none",
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
              <th className="p-2 border text-center">Sale (%)</th>
              <th className="p-2 border text-right">Đơn giá</th>
              <th className="p-2 border text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((item, i) => {
              const p = products.find((x) => x._id === item.productId);
              return (
                <tr key={i} className="border-b">
  <td className="p-2 border">{p?.name || "-"}</td>
  <td className="p-2 border text-center">{item.size || "-"}</td>
  <td className="p-2 border text-center">{item.quantity}</td>
  <td className="p-2 border text-center">{item.sale || 0}</td>
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

        <div className="text-right text-sm space-y-1">
          <p>Phí ship: {form.shipFee.toLocaleString()}₫</p>
          <p className="font-bold text-lg">
            Tổng cộng: {totalWithShip.toLocaleString()}₫
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderReceipt;
