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
    terms: "Giao hàng thu cod",
    deliverDate: "",
    receivedDate: "",
    salePercent: 0,
    shipFee: 25000,
    items: [],
  });

  const receiptRef = useRef(null);

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

  const calcSubtotal = (item) => {
    const product = products.find((p) => p._id === item.productId);
    if (!product) return 0;
    const base = product.price * (item.quantity || 1);
    const discount = (base * (form.salePercent || 0)) / 100;
    return base - discount;
  };

  const calcTotal = () => {
    const subtotal = form.items.reduce((acc, it) => acc + calcSubtotal(it), 0);
    return subtotal;
  };

  const totalWithShip = calcTotal() + (form.shipFee || 0);

  const formatDate = (input) => {
    if (!input) return "";
    const parts = input.split(/[/-]/);
    if (parts.length !== 3) return input;
    const [day, month, year] =
      Number(parts[0]) > 12 ? parts : [parts[1], parts[0], parts[2]];
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  };

  const handleExportImage = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await domtoimage.toPng(receiptRef.current, {
        quality: 1,
        bgcolor: "#ffffff",
        cacheBust: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `phieu_dat_hang_${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("❌ Export error:", err);
      alert("Không thể xuất ảnh, vui lòng thử lại.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white border border-gray-200 shadow-md rounded-2xl p-8 max-w-5xl mx-auto"
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExportImage}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <ImageDown className="w-5 h-5" />
          Xuất thành ảnh
        </button>
      </div>

      <div ref={receiptRef} className="p-6 bg-white text-gray-800">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-lg">
              <b>Khách Hàng :</b> {form.customerName || "Chưa chọn"}
            </p>
            <h1 className="text-3xl font-extrabold text-blue-700">
              Đơn Đặt Hàng
            </h1>
          </div>
          <img src="/lunale.png" alt="Lunale" className="h-10 object-contain" />
        </div>

        {/* THÔNG TIN NGÀY & ĐIỀU KHOẢN */}
        <div className="flex justify-between text-sm border-b border-gray-300 pb-2 mb-3">
          <div>
            <p className="font-semibold">Ngày Nhận Đơn</p>
            <p>{form.receivedDate || "..."}</p>
          </div>
          <div>
            <p className="font-semibold">Ngày giao hàng</p>
            <p>{form.deliverDate || "..."}</p>
          </div>
          <div>
            <p className="font-semibold">Điều khoản</p>
            <p>{form.terms || "..."}</p>
          </div>
        </div>

        {/* ĐỊA CHỈ */}
        <div className="grid grid-cols-2 gap-6 text-sm mb-4">
          <div>
            <p className="font-semibold text-blue-700">Nhà Cung Cấp</p>
            <p>Lunale</p>
            <a
              href="https://www.instagram.com/lunale.vn/"
              target="_blank"
              className="text-blue-500 underline"
            >
              https://www.instagram.com/lunale.vn/
            </a>
            <p>Gò Vấp, Hồ Chí Minh City</p>
          </div>
          <div>
            <p className="font-semibold text-blue-700">Giao Hàng Đến</p>
            <p>
              <b>Khách Hàng:</b> {form.customerName || "Chưa chọn"}
            </p>
            <p>
              <b>Địa Chỉ:</b> {form.address || "Chưa có"}
            </p>
            <p>
              <b>Điện Thoại:</b> {form.phone || "Chưa có"}
            </p>
          </div>
        </div>

        {/* BẢNG SẢN PHẨM */}
        <table className="w-full text-sm border-t border-gray-300">
          <thead>
            <tr className="text-left text-blue-700 border-b border-gray-300">
              <th className="py-2 px-2">Tên Sản Phẩm</th>
              <th className="py-2 px-2">Size</th>
              <th className="py-2 px-2">Số lượng</th>
              <th className="py-2 px-2">Đơn Giá</th>
              <th className="py-2 px-2 text-red-600">Sale {form.salePercent}%</th>
              <th className="py-2 px-2 text-right">Tổng giá</th>
            </tr>
          </thead>
          <tbody>
            {form.items.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-3 text-center text-gray-500">
                  Chưa có sản phẩm nào
                </td>
              </tr>
            ) : (
              form.items.map((item, i) => {
                const product = products.find((p) => p._id === item.productId);
                const name = product?.name || "Chưa chọn";
                const price = product?.price || 0;
                const total = calcSubtotal(item);
                return (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-2 px-2 font-medium">{name}</td>
                    <td className="py-2 px-2">-</td>
                    <td className="py-2 px-2">{item.quantity}</td>
                    <td className="py-2 px-2">{price.toLocaleString()} ₫</td>
                    <td className="py-2 px-2 text-red-600">
                      {(price * (1 - form.salePercent / 100)).toLocaleString()} ₫
                    </td>
                    <td className="py-2 px-2 text-right font-semibold">
                      {total.toLocaleString()} ₫
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* TỔNG KẾT */}
        <div className="text-right text-sm mt-3">
          <p>Thành Tiền: {calcTotal().toLocaleString()} ₫</p>
          <p>Phí Ship: +{(form.shipFee || 0).toLocaleString()} ₫</p>
          <p className="text-xl font-bold text-pink-600">
            Tổng Cộng: {totalWithShip.toLocaleString()} ₫
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderReceipt;
