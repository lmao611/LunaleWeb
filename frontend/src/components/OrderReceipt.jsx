import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { PlusCircle, Trash2 } from "lucide-react";

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

  // ===== Fetch data from DB =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          axios.get("/api/customers"),
          axios.get("/api/products"),
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // ===== Handle select customer =====
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
    const selected = customers.find((c) => c._id === id);
    setForm((f) => ({
      ...f,
      customerId: id,
      customerName: selected?.name || "",
      address: selected?.address || "",
      phone: selected?.phone || "",
    }));
  };

  // ===== Handle product add / remove =====
  const addProduct = () => {
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: "", quantity: 1 }],
    }));
  };

  const removeProduct = (index) => {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  };

  // ===== Calculate totals =====
  const calcSubtotal = (item) => {
    const product = products.find((p) => p._id === item.productId);
    if (!product) return 0;
    return product.price * (item.quantity || 1);
  };

  const calcTotal = () => {
    const subtotal = form.items.reduce(
      (acc, it) => acc + calcSubtotal(it),
      0
    );
    const discount = (subtotal * (form.salePercent || 0)) / 100;
    return subtotal - discount;
  };

  const totalWithShip = calcTotal() + (form.shipFee || 0);

  // ===== UI =====
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white border border-gray-200 shadow-md rounded-2xl p-8 max-w-4xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
        Phiếu Đặt Hàng
      </h2>

      {/* Thông tin khách hàng */}
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
            onChange={(e) =>
              setForm((f) => ({ ...f, terms: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium">Ngày giao</label>
          <input
            type="date"
            value={form.deliverDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, deliverDate: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium">Ngày đến</label>
          <input
            type="date"
            value={form.receivedDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, receivedDate: e.target.value }))
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
            onChange={(e) =>
              setForm((f) => ({ ...f, phone: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Sản phẩm */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg text-blue-700">
            Sản phẩm
          </h3>
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

        <div className="space-y-3">
          {form.items.map((item, i) => {
            const product = products.find((p) => p._id === item.productId);
            return (
              <div
                key={i}
                className="grid sm:grid-cols-4 gap-3 border rounded-lg p-3 relative"
              >
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
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {product ? `${product.price.toLocaleString()}₫` : "-"}
                  </span>
                  <span className="font-semibold">
                    {calcSubtotal(item).toLocaleString()}₫
                  </span>
                </div>
                <button
                  onClick={() => removeProduct(i)}
                  className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 p-1 rounded-full"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sale, ship, tổng */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm mb-1 font-medium">Sale (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.salePercent}
            onChange={(e) =>
              setForm((f) => ({ ...f, salePercent: Number(e.target.value) }))
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
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
        <div className="text-right">
          <div className="text-sm text-gray-600">
            Thành tiền: {calcTotal().toLocaleString()}₫
          </div>
          <div className="text-sm text-gray-600">
            Phí ship: +{(form.shipFee || 0).toLocaleString()}₫
          </div>
          <div className="text-lg font-bold text-blue-700">
            Tổng cộng: {totalWithShip.toLocaleString()}₫
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="absolute bottom-4 left-4 opacity-70">
        <img src="/lunale.png" alt="Lunale Logo" className="h-10" />
      </div>
    </motion.div>
  );
};

export default OrderReceipt;
