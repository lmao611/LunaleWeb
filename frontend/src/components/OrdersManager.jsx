import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, PlusCircle, Edit2, X, Calendar, ShoppingBag } from "lucide-react";
import axios from "../lib/axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useUserStore } from "../stores/useUserStore";

const sizes = ["S", "M", "L", "XL"];
const statuses = ["chưa giao", "đang giao", "đã giao", "đã hủy"];
const paymentMethods = ["COD", "Chuyển khoản"];

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State quản lý tab tháng
  const [selectedMonthKey, setSelectedMonthKey] = useState(null); // Format: "MM/YYYY"

  // State Modal & Filter
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  const { checkingAuth } = useUserStore();

  useEffect(() => {
    if (!checkingAuth) {
      fetchAll();
      fetchCustomers();
      fetchProducts();
    }
  }, [checkingAuth]);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await axios.get("/orders");
      const data = Array.isArray(res.data) ? res.data : (res.data.orders || []);
      setOrders(data);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const res = await axios.get("/auth/users");
      const data = Array.isArray(res.data) ? res.data : (res.data.users || []);
      setCustomers(data);
    } catch (err) {
      setCustomers([]);
    }
  }

  async function fetchProducts() {
    try {
      const res = await axios.get("/products");
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (res.data?.products) list = res.data.products;
      setProducts(list);
    } catch (err) {
      setProducts([]);
    }
  }

  // --- LOGIC NHÓM THEO THÁNG ---
  // 1. Lọc theo status trước
  const filteredOrders = orders.filter((o) => (filterStatus ? o.status === filterStatus : true));

  // 2. Nhóm theo tháng
  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const d = new Date(order.createdAt);
    const monthKey = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(order);
    return groups;
  }, {});

  // 3. Sắp xếp tháng giảm dần
  const sortedMonthKeys = Object.keys(groupedOrders).sort((a, b) => {
    const [m1, y1] = a.split("/");
    const [m2, y2] = b.split("/");
    return new Date(`${y2}-${m2}-01`) - new Date(`${y1}-${m1}-01`);
  });

  // 4. Chọn tháng mặc định
  useEffect(() => {
    if (sortedMonthKeys.length > 0 && !selectedMonthKey) {
      setSelectedMonthKey(sortedMonthKeys[0]);
    }
  }, [sortedMonthKeys, selectedMonthKey]);

  // Danh sách đơn hàng hiện tại để hiển thị
  const currentMonthOrders = selectedMonthKey ? groupedOrders[selectedMonthKey] : [];

  // --- CÁC HÀM XỬ LÝ (MODAL, CRUD) ---
  function openCreate() {
    setEditing({
      customerId: "",
      address: "",
      phone: "",
      items: [],
      status: "chưa giao",
      receivedDate: "",
      deliverDate: "",
      paymentMethod: "COD",
    });
    setShowModal(true);
  }

  function openEdit(order) {
    const copy = {
      id: order._id ?? order.id,
      customerId: order.customerId?._id ?? order.customerId,
      address: order.address,
      phone: order.phone,
      items: (order.items || []).map((it) => ({
        productId: it.productId?._id ?? it.productId,
        size: it.size,
        quantity: it.quantity,
        price: it.price,
      })),
      status: order.status,
      receivedDate: order.receivedDate ? order.receivedDate.split("T")[0] : "",
      deliverDate: order.deliverDate ? order.deliverDate.split("T")[0] : "",
      paymentMethod: order.paymentMethod || "COD",
    };
    setEditing(copy);
    setShowModal(true);
  }

  function addItem() {
    setEditing((p) => ({
      ...p,
      items: [...(p.items || []), { productId: "", size: "M", quantity: 1, price: 0 }],
    }));
  }

  function removeItem(idx) {
    setEditing((p) => {
      const items = [...(p.items || [])];
      items.splice(idx, 1);
      return { ...p, items };
    });
  }

  function onItemChange(idx, field, value) {
    setEditing((p) => {
      const items = [...(p.items || [])];
      items[idx] = { ...(items[idx] || {}), [field]: field === "quantity" ? Number(value) : value };
      if (field === "productId") {
        const prod = products.find((x) => String(x._id ?? x.id) === String(value));
        items[idx].price = prod ? prod.price : 0;
      }
      return { ...p, items };
    });
  }

  function onCustomerSelect(id) {
    const c = customers.find((x) => String(x._id ?? x.id) === String(id));
    setEditing((p) => ({
      ...p,
      customerId: id,
      address: c ? (c.direction || c.address) : p.address,
      phone: c ? (c.phoneNumber || c.phone) : p.phone,
    }));
  }

  function calcTotal(items) {
    if (!items || !items.length) return 0;
    return items.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0), 0);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }

  async function handleSave(e) {
    e && e.preventDefault();
    try {
      const payload = {
        customerId: editing.customerId,
        items: (editing.items || []).map((it) => ({
          productId: it.productId,
          size: it.size,
          quantity: it.quantity,
        })),
        status: editing.status,
        receivedDate: editing.receivedDate || null,
        deliverDate: editing.deliverDate || null,
        paymentMethod: editing.paymentMethod,
      };
      if (editing.id) {
        await axios.put(`/orders/${editing.id}`, payload);
      } else {
        await axios.post("/orders", payload);
      }
      fetchAll();
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      alert("Lưu thất bại: " + (err.response?.data?.message || err.message));
    }
  }

  async function handleDelete(id) {
    if (!confirm("Xóa đơn hàng này?")) return;
    try {
      await axios.delete(`/orders/${id}`);
      fetchAll();
    } catch (err) {
      alert("Xóa thất bại");
    }
  }

  async function exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Đơn hàng");
  
    // Header đầy đủ như cũ
    const headers = [
      "STT", "Trạng thái", "Ngày nhận", "Ngày giao", "Khách hàng",
      "Địa chỉ", "SĐT", "Sản phẩm", "Tổng tiền", "Thanh toán",
    ];
    worksheet.addRow(headers);
  
    // Xuất danh sách đang hiển thị (theo tháng)
    currentMonthOrders.forEach((o, idx) => {
      const itemsStr = (o.items || []).map((it) => {
          const prod = products.find((p) => String(p._id) === String(it.productId?._id ?? it.productId));
          return `${prod ? prod.name : "SP xóa"} (size ${it.size}, SL ${it.quantity})`;
        }).join("; ");
  
      worksheet.addRow([
        idx + 1, o.status, formatDate(o.receivedDate), formatDate(o.deliverDate),
        o.customerName ?? o.customerId?.name ?? "-", o.address, o.phone, itemsStr,
        (o.total || 0).toLocaleString() + " ₫", o.paymentMethod,
      ]);
    });
  
    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF666666" } };

    // Auto width
    worksheet.columns.forEach((column) => {
        column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `DonHang_${selectedMonthKey?.replace('/','-')}.xlsx`);
  }

  return (
    <div className="p-4 max-w-[95%] mx-auto min-h-screen flex flex-col">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Calendar className="text-blue-600" /> Quản lý đơn hàng
           </h2>
           <p className="text-gray-500 text-sm mt-1">
             Tháng: <span className="font-bold text-blue-700">{selectedMonthKey || "..."}</span> 
             {" • "} Tổng: {currentMonthOrders.length} đơn
           </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Tất cả trạng thái --</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm">
            📊 Excel
          </button>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm">
            <PlusCircle size={16} /> Thêm đơn
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA (TABLE DẠNG CŨ) --- */}
      <div className="flex-1 bg-white rounded-xl shadow border border-gray-200 relative overflow-hidden flex flex-col">
        {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">Đang tải dữ liệu...</div>
        ) : (
            <div className="flex-1 overflow-x-auto custom-scrollbar">
                 <AnimatePresence mode="wait">
                    {currentMonthOrders.length > 0 ? (
                        <motion.div
                            key={selectedMonthKey}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="min-w-max w-full"
                        >
                            {/* BẢNG DỮ LIỆU CHI TIẾT NHƯ CŨ */}
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap">#</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Ngày nhận</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Ngày giao</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Khách hàng</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Địa chỉ</th>
                                        <th className="px-4 py-3 whitespace-nowrap">SĐT</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Sản phẩm</th>
                                        <th className="px-4 py-3 whitespace-nowrap text-center">SL</th>
                                        <th className="px-4 py-3 whitespace-nowrap text-center">Size</th>
                                        <th className="px-4 py-3 whitespace-nowrap text-right">Tổng tiền</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Thanh toán</th>
                                        <th className="px-4 py-3 whitespace-nowrap text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentMonthOrders.map((o, idx) => {
                                        const statusColor = o.status === "chưa giao" ? "bg-red-100 text-red-700"
                                            : o.status === "đang giao" ? "bg-yellow-100 text-yellow-700"
                                            : o.status === "đã hủy" ? "bg-gray-100 text-gray-500 line-through"
                                            : "bg-green-100 text-green-700";
                                        
                                        return (
                                            <tr key={o._id ?? o.id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 align-top font-medium text-gray-500">{idx + 1}</td>
                                                <td className="px-4 py-3 align-top">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${statusColor}`}>
                                                        {o.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 align-top whitespace-nowrap">{formatDate(o.receivedDate)}</td>
                                                <td className="px-4 py-3 align-top whitespace-nowrap">{formatDate(o.deliverDate)}</td>
                                                <td className="px-4 py-3 align-top font-medium text-gray-900">
                                                    {o.customerName ?? o.customerId?.name ?? "-"}
                                                </td>
                                                <td className="px-4 py-3 align-top max-w-[200px] truncate" title={o.address}>
                                                    {o.address}
                                                </td>
                                                <td className="px-4 py-3 align-top">{o.phone}</td>
                                                
                                                {/* Cột Tên Sản Phẩm */}
                                                <td className="px-4 py-3 align-top">
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {(o.items || []).map((it, i) => {
                                                            const prod = products.find(p => String(p._id) === String(it.productId?._id ?? it.productId));
                                                            return <li key={i} className="truncate max-w-[150px]" title={prod?.name}>{prod ? prod.name : "SP đã xóa"}</li>;
                                                        })}
                                                    </ul>
                                                </td>

                                                {/* Cột Số Lượng */}
                                                <td className="px-4 py-3 align-top text-center">
                                                    <ul className="space-y-1">
                                                        {(o.items || []).map((it, i) => <li key={i}>x{it.quantity}</li>)}
                                                    </ul>
                                                </td>

                                                {/* Cột Size */}
                                                <td className="px-4 py-3 align-top text-center">
                                                    <ul className="space-y-1">
                                                        {(o.items || []).map((it, i) => <li key={i}>{it.size}</li>)}
                                                    </ul>
                                                </td>

                                                <td className="px-4 py-3 align-top text-right font-bold text-blue-600 whitespace-nowrap">
                                                    {(o.total || 0).toLocaleString()} ₫
                                                </td>
                                                <td className="px-4 py-3 align-top">{o.paymentMethod}</td>
                                                
                                                <td className="px-4 py-3 align-top text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openEdit(o)} className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1" title="Sửa">
                                                            <Edit2 size={16} /> <span className="hidden xl:inline text-xs">Sửa</span>
                                                        </button>
                                                        <button onClick={() => handleDelete(o._id ?? o.id)} className="text-red-600 hover:text-red-800 transition flex items-center gap-1" title="Xóa">
                                                            <Trash2 size={16} /> <span className="hidden xl:inline text-xs">Xóa</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                            <ShoppingBag size={48} className="mb-4 text-gray-200" />
                            <p>Tháng {selectedMonthKey} chưa có đơn hàng nào.</p>
                        </div>
                    )}
                 </AnimatePresence>
            </div>
        )}

        {/* --- FOOTER: MONTH SELECTOR BAR (Vẫn giữ lại) --- */}
        <div className="bg-white border-t p-3 overflow-x-auto custom-scrollbar">
             <div className="flex items-center gap-3 min-w-max pb-1">
                <span className="text-xs font-bold text-gray-400 uppercase mr-2 tracking-wide sticky left-0 bg-white pl-1">Chọn tháng:</span>
                {sortedMonthKeys.map(key => (
                    <button
                        key={key}
                        onClick={() => setSelectedMonthKey(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2
                            ${selectedMonthKey === key 
                                ? "bg-blue-600 text-white border-blue-600 shadow-md transform -translate-y-0.5" 
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-blue-300 hover:text-blue-600"
                            }`}
                    >
                        {key}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${selectedMonthKey === key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                            {groupedOrders[key].length}
                        </span>
                    </button>
                ))}
                {sortedMonthKeys.length === 0 && <span className="text-sm italic text-gray-400 px-2">Chưa có dữ liệu đơn hàng</span>}
             </div>
        </div>
      </div>

      {/* --- MODAL EDIT (GIỮ NGUYÊN) --- */}
      {showModal && editing && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-[100] pt-10 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-3xl rounded-xl p-6 shadow-2xl mb-10 border border-gray-100">
            <div className="flex items-center justify-between mb-5 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">{editing.id ? "Cập nhật đơn hàng" : "Tạo đơn hàng mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-gray-800"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Khách hàng</label>
                    <select value={editing.customerId} onChange={(e) => onCustomerSelect(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 focus:bg-white transition">
                        <option value="">-- Khách lẻ / Vãng lai --</option>
                        {customers.map(c => <option key={c._id} value={c._id}>{c.name} - {c.phoneNumber}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Số điện thoại</label>
                    <input value={editing.phone || ""} onChange={(e) => setEditing({...editing, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nhập SĐT..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Địa chỉ giao hàng</label>
                    <input value={editing.address || ""} onChange={(e) => setEditing({...editing, address: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nhập địa chỉ..." />
                  </div>
               </div>

               <div className="border-t pt-5 border-dashed">
                  <div className="flex justify-between items-center mb-3">
                     <label className="text-sm font-bold text-gray-800">Danh sách sản phẩm</label>
                     <button type="button" onClick={addItem} className="text-sm text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded transition flex items-center gap-1"><PlusCircle size={16}/> Thêm dòng</button>
                  </div>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                     {editing.items.map((it, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded shadow-sm border border-gray-200">
                            <select value={it.productId} onChange={(e) => onItemChange(idx, "productId", e.target.value)} className="flex-1 border-0 bg-transparent text-sm font-medium focus:ring-0">
                                <option value="">-- Chọn sản phẩm --</option>
                                {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.price?.toLocaleString()}đ)</option>)}
                            </select>
                            <div className="h-4 w-px bg-gray-300 mx-1"></div>
                            <select value={it.size} onChange={(e) => onItemChange(idx, "size", e.target.value)} className="w-16 border-0 bg-transparent text-sm focus:ring-0">
                                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <div className="h-4 w-px bg-gray-300 mx-1"></div>
                            <input type="number" min="1" value={it.quantity} onChange={(e) => onItemChange(idx, "quantity", e.target.value)} className="w-16 border-0 bg-transparent text-center text-sm font-bold focus:ring-0" placeholder="SL" />
                            <div className="h-4 w-px bg-gray-300 mx-1"></div>
                            <button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 p-1 transition"><Trash2 size={16}/></button>
                        </div>
                     ))}
                     {editing.items.length === 0 && <p className="text-center text-sm text-gray-400 py-2">Chưa có sản phẩm nào. Nhấn "Thêm dòng" để bắt đầu.</p>}
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-5 border-dashed">
                  <div>
                      <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Trạng thái</label>
                      <select value={editing.status} onChange={(e) => setEditing({...editing, status: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-2 text-sm font-medium">
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Thanh toán</label>
                      <select value={editing.paymentMethod} onChange={(e) => setEditing({...editing, paymentMethod: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-2 text-sm">
                          {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                  </div>
                  <div className="md:col-span-2 text-right">
                      <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Tổng tiền đơn hàng</span>
                      <span className="text-3xl font-bold text-blue-700 tracking-tight">{calcTotal(editing.items).toLocaleString()} ₫</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Ngày nhận (Dự kiến)</label>
                    <input type="date" value={editing.receivedDate} onChange={(e) => setEditing({...editing, receivedDate: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-gray-600" />
                  </div>
                   <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Ngày giao (Thực tế)</label>
                    <input type="date" value={editing.deliverDate} onChange={(e) => setEditing({...editing, deliverDate: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-gray-600" />
                  </div>
               </div>

               <div className="flex justify-end gap-3 pt-6 border-t mt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">Hủy bỏ</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 font-medium transition flex items-center gap-2">
                    Lưu đơn hàng
                  </button>
               </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}