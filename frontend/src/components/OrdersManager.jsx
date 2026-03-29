import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, PlusCircle, Edit2, X, Calendar, ShoppingBag } from "lucide-react";
import axios from "../lib/axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useUserStore } from "../stores/useUserStore";

const statuses = ["chưa giao", "đang giao", "đã giao", "đã hủy"];
const paymentMethods = ["COD", "Chuyển khoản", "Tiền mặt"];

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  const [focusedCustomer, setFocusedCustomer] = useState(false);
  const [focusedProductIndex, setFocusedProductIndex] = useState(null);

  const { checkingAuth, user } = useUserStore();
  const isAdmin = user?.role === "admin";

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

  const filteredOrders = orders.filter((o) => {
    if (filterStatus && o.status !== filterStatus) return false;
    
    const oDateStr = o.receivedDate ? o.receivedDate.split("T")[0] : (o.createdAt ? o.createdAt.split("T")[0] : "");
    if (startDate && oDateStr < startDate) return false;
    if (endDate && oDateStr > endDate) return false;

    return true;
  });

  const groupedOrders = {};

  if (filteredOrders.length > 0) {
    let minDate = new Date(filteredOrders[0].receivedDate || filteredOrders[0].createdAt);
    let maxDate = new Date(filteredOrders[0].receivedDate || filteredOrders[0].createdAt);

    filteredOrders.forEach(o => {
      const d = new Date(o.receivedDate || o.createdAt);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });

    let currentY = minDate.getFullYear();
    let currentM = minDate.getMonth();
    const endY = maxDate.getFullYear();
    const endM = maxDate.getMonth();

    while (currentY < endY || (currentY === endY && currentM <= endM)) {
      const mKey = `${String(currentM + 1).padStart(2, '0')}/${currentY}`;
      groupedOrders[mKey] = [];
      currentM++;
      if (currentM > 11) {
        currentM = 0;
        currentY++;
      }
    }
  }

  filteredOrders.forEach(order => {
    const d = order.receivedDate ? new Date(order.receivedDate) : new Date(order.createdAt);
    const monthKey = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    if (!groupedOrders[monthKey]) {
      groupedOrders[monthKey] = [];
    }
    groupedOrders[monthKey].push(order);
  });

  const sortedMonthKeys = ["Tất cả", ...Object.keys(groupedOrders).sort((a, b) => {
    const [m1, y1] = a.split("/");
    const [m2, y2] = b.split("/");
    return new Date(`${y2}-${m2}-01`) - new Date(`${y1}-${m1}-01`);
  })];

  useEffect(() => {
    if (sortedMonthKeys.length > 0 && !selectedMonthKey) {
      const today = new Date();
      const currentM = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      if (sortedMonthKeys.includes(currentM)) {
        setSelectedMonthKey(currentM);
      } else {
        setSelectedMonthKey("Tất cả");
      }
    }
  }, [sortedMonthKeys, selectedMonthKey]);

  let currentMonthOrders = [];
  if (selectedMonthKey === "Tất cả") {
    currentMonthOrders = [...filteredOrders];
  } else if (selectedMonthKey) {
    currentMonthOrders = groupedOrders[selectedMonthKey] || [];
  }
  
  currentMonthOrders.sort((a, b) => {
    const dA = a.receivedDate ? new Date(a.receivedDate) : new Date(a.createdAt);
    const dB = b.receivedDate ? new Date(b.receivedDate) : new Date(b.createdAt);
    return dB - dA;
  });

  const availableYears = [...new Set(orders.map(o => {
    const d = o.receivedDate ? new Date(o.receivedDate) : new Date(o.createdAt);
    return d.getFullYear().toString();
  }))].sort((a, b) => b - a);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const isDateFiltered = startDate !== "" || endDate !== "";

  const displayTotal = filteredOrders.reduce((sum, o) => {
    const d = o.receivedDate ? new Date(o.receivedDate) : new Date(o.createdAt);
    if (isDateFiltered || d.getFullYear().toString() === selectedYear) {
        const itemsTotal = (o.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
        const orderTotal = o.total || o.totalAmount || (itemsTotal + Number(o.shipFee || 0));
        return sum + orderTotal;
    }
    return sum;
  }, 0);

  function openCreate() {
    const today = new Date();
    let defaultDate = today.toISOString().substring(0, 10); 
    const currentMonthKey = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    if (selectedMonthKey && selectedMonthKey !== "Tất cả" && selectedMonthKey !== currentMonthKey) {
        const [m, y] = selectedMonthKey.split('/');
        defaultDate = `${y}-${m}-01`;
    }

    setEditing({
      customerId: "",
      customerName: "",
      address: "",
      phone: "",
      items: [],
      status: "chưa giao",
      receivedDate: defaultDate, 
      deliverDate: "",
      paymentMethod: "COD",
      shipFee: 25000,
    });
    setShowModal(true);
  }

  function openEdit(order) {
    const itemsTotal = (order.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
    const savedTotal = order.total || order.totalAmount || itemsTotal;
    let currentShipFee = order.shipFee !== undefined ? order.shipFee : (savedTotal - itemsTotal);
    if (currentShipFee < 0) currentShipFee = 0;

    const copy = {
      id: order._id ?? order.id,
      customerId: order.customerId?._id ?? order.customerId,
      customerName: order.customerName ?? order.customerId?.name ?? "",
      address: order.address,
      phone: order.phone,
      items: (order.items || []).map((it) => ({
        productId: it.productId?._id ?? it.productId,
        tempName: it.name ?? it.tempName ?? it.productId?.name ?? "",
        size: it.size,
        quantity: it.quantity,
        price: it.price,
      })),
      status: order.status,
      receivedDate: order.receivedDate ? order.receivedDate.split("T")[0] : (order.createdAt ? order.createdAt.split("T")[0] : ""),
      deliverDate: order.deliverDate ? order.deliverDate.split("T")[0] : "",
      paymentMethod: order.paymentMethod || "COD",
      shipFee: currentShipFee,
    };
    setEditing(copy);
    setShowModal(true);
  }

  function addItem() {
    setEditing((p) => ({
      ...p,
      items: [...(p.items || []), { productId: "", tempName: "", size: "M", quantity: 1, price: 0 }],
    }));
  }

  function removeItem(idx) {
    setEditing((p) => {
      const items = [...(p.items || [])];
      items.splice(idx, 1);
      return { ...p, items };
    });
  }

  function calcTotal(items, shipFee) {
    const itemsTotal = items && items.length 
        ? items.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0), 0)
        : 0;
    return itemsTotal + Number(shipFee || 0);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }

  async function handleSave(e) {
    e && e.preventDefault();
    try {
      const payloadItems = (editing.items || []).map((it) => {
        const mappedItem = {
          name: it.tempName,
          size: it.size,
          quantity: it.quantity,
          price: it.price,
        };
        if (it.productId) mappedItem.productId = it.productId;
        return mappedItem;
      });

      const payload = {
        customerName: editing.customerName,
        address: editing.address,
        phone: editing.phone,
        items: payloadItems,
        status: editing.status,
        paymentMethod: editing.paymentMethod,
        shipFee: Number(editing.shipFee || 0),
      };

      if (editing.customerId) payload.customerId = editing.customerId;
      if (editing.receivedDate) payload.receivedDate = editing.receivedDate;
      if (editing.deliverDate) payload.deliverDate = editing.deliverDate;

      if (editing.id) {
        await axios.put(`/orders/${editing.id}`, payload);
      } else {
        await axios.post("/orders", payload);
      }

      const d = editing.receivedDate ? new Date(editing.receivedDate) : new Date();
      const newMonthKey = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      setSelectedMonthKey(newMonthKey);

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
  
    const headers = [
      "STT", "Trạng thái", "Ngày nhận", "Ngày giao", "Khách hàng",
      "Địa chỉ", "SĐT", "Sản phẩm", "Phí ship", "Tổng tiền", "Thanh toán",
    ];
    worksheet.addRow(headers);
  
    currentMonthOrders.forEach((o, idx) => {
      const itemsTotal = (o.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
      const savedTotal = o.total || o.totalAmount || itemsTotal;
      let displayShipFee = o.shipFee !== undefined ? o.shipFee : (savedTotal - itemsTotal);
      if (displayShipFee < 0) displayShipFee = 0;

      const itemsStr = (o.items || [])
        .map((it) => {
          const prod = products.find(
            (p) => String(p._id) === String(it.productId?._id ?? it.productId)
          );
          return `${prod ? prod.name : it.name ?? it.tempName ?? "SP tự nhập"} (size ${it.size}, SL ${it.quantity})`;
        })
        .join("; ");
  
      worksheet.addRow([
        idx + 1,
        o.status,
        formatDate(o.receivedDate || o.createdAt),
        formatDate(o.deliverDate),
        o.customerName ?? o.customerId?.name ?? "-",
        o.address,
        o.phone,
        itemsStr,
        displayShipFee.toLocaleString() + " ₫",
        savedTotal.toLocaleString() + " ₫",
        o.paymentMethod,
      ]);
    });
  
    worksheet.columns.forEach((column) => {
      column.width = 25;
    });
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF666666" } };
  
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = selectedMonthKey === "Tất cả" ? "DonHang_TatCa.xlsx" : `DonHang_${selectedMonthKey?.replace('/','-')}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
  }

  return (
    <div className="p-4 max-w-[98%] mx-auto min-h-screen flex flex-col">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
               <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                 <Calendar className="text-blue-600" /> Quản lý đơn hàng
               </h2>
               <p className="text-gray-500 text-sm mt-1">
                 {selectedMonthKey === "Tất cả" ? "Tất cả đơn hàng" : `Tháng: ${selectedMonthKey}`}
                 {" • "} Tổng: {currentMonthOrders.length} đơn
               </p>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
               <span className="text-sm font-medium text-gray-500">Từ:</span>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border-none outline-none text-gray-800 bg-transparent cursor-pointer" />
               <span className="text-sm font-medium text-gray-500">Đến:</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border-none outline-none text-gray-800 bg-transparent cursor-pointer" />
            </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
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
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
                                    <tr>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">#</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Trạng thái</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Ngày nhận</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Ngày giao</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Khách hàng</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Địa chỉ</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">SĐT</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Sản phẩm</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Số lượng</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Size</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Phí ship</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Tổng</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Thanh toán</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentMonthOrders.map((o, idx) => {
                                        const statusColor = o.status === "chưa giao" ? "bg-red-100 text-red-700"
                                            : o.status === "đang giao" ? "bg-yellow-100 text-yellow-700"
                                            : o.status === "đã hủy" ? "bg-gray-100 text-gray-500 line-through"
                                            : "bg-green-100 text-green-700";

                                        const itemsTotal = (o.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
                                        const savedTotal = o.total || o.totalAmount || itemsTotal;
                                        let displayShipFee = o.shipFee !== undefined ? o.shipFee : (savedTotal - itemsTotal);
                                        if (displayShipFee < 0) displayShipFee = 0;
                                        
                                        return (
                                            <tr key={o._id ?? o.id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition">
                                                <td className="px-4 py-2 align-top font-medium">{idx + 1}</td>
                                                <td className={`px-4 py-2 align-top font-semibold ${statusColor} whitespace-nowrap`}>
                                                    {o.status}
                                                </td>
                                                <td className="px-4 py-2 align-top whitespace-nowrap">{formatDate(o.receivedDate || o.createdAt)}</td>
                                                <td className="px-4 py-2 align-top whitespace-nowrap">{formatDate(o.deliverDate)}</td>
                                                <td className="px-4 py-2 align-top font-medium">
                                                    {o.customerName ?? o.customerId?.name ?? "-"}
                                                </td>
                                                <td className="px-4 py-2 align-top max-w-[200px] truncate" title={o.address}>
                                                    {o.address}
                                                </td>
                                                <td className="px-4 py-2 align-top whitespace-nowrap">{o.phone}</td>

                                                <td className="px-4 py-2 align-top">
                                                    <ul className="list-disc ml-4">
                                                        {(o.items || []).map((it, i) => {
                                                            const prod = products.find(p => String(p._id) === String(it.productId?._id ?? it.productId));
                                                            return <li key={i} className="truncate max-w-[150px]" title={prod?.name || it.name}>{prod ? prod.name : (it.name || "SP tự nhập")}</li>;
                                                        })}
                                                    </ul>
                                                </td>

                                                <td className="px-4 py-2 align-top">
                                                    <ul>{(o.items || []).map((it, i) => <li key={i}>x{it.quantity}</li>)}</ul>
                                                </td>

                                                <td className="px-4 py-2 align-top">
                                                    <ul>{(o.items || []).map((it, i) => <li key={i}>{it.size}</li>)}</ul>
                                                </td>

                                                <td className="px-4 py-2 align-top text-gray-600 whitespace-nowrap">
                                                    {displayShipFee.toLocaleString()} ₫
                                                </td>

                                                <td className="px-4 py-2 align-top font-semibold text-gray-900 whitespace-nowrap">
                                                    {savedTotal.toLocaleString()} ₫
                                                </td>
                                                <td className="px-4 py-2 align-top whitespace-nowrap">{o.paymentMethod}</td>

                                                <td className="px-4 py-2 align-top whitespace-nowrap">
                                                    <div className="flex gap-3">
                                                        <button onClick={() => openEdit(o)} className="text-blue-600 hover:underline flex items-center gap-1">
                                                            <Edit2 className="w-4 h-4" /> Sửa
                                                        </button>
                                                        {!isAdmin && (
                                                            <button onClick={() => handleDelete(o._id ?? o.id)} className="text-red-600 hover:underline flex items-center gap-1">
                                                                <Trash2 className="w-4 h-4" /> Xóa
                                                            </button>
                                                        )}
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
                            <p>Không có đơn hàng nào.</p>
                        </div>
                    )}
                 </AnimatePresence>
            </div>
        )}

        <div className="bg-white border-t p-3 flex flex-col lg:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-3 min-w-max pb-1 overflow-x-auto custom-scrollbar w-full lg:w-auto flex-1">
                <span className="text-xs font-bold text-gray-400 uppercase mr-2 tracking-wide sticky left-0 bg-white pl-1 z-10">Chọn tháng:</span>
                {sortedMonthKeys.map(key => {
                    const ordersForTab = key === "Tất cả" ? filteredOrders : (groupedOrders[key] || []);
                    const monthTotal = ordersForTab.reduce((sum, o) => {
                        const itemsTotal = (o.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
                        return sum + (o.total || o.totalAmount || (itemsTotal + Number(o.shipFee || 0)));
                    }, 0);
                    
                    return (
                        <div key={key} className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => setSelectedMonthKey(key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2
                                    ${selectedMonthKey === key 
                                        ? "bg-blue-600 text-white border-blue-600 shadow-md transform -translate-y-0.5" 
                                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-blue-300 hover:text-blue-600"
                                    }`}
                            >
                                {key}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${selectedMonthKey === key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                                    {ordersForTab.length}
                               </span>
                            </button>
                            <span className="bg-yellow-200 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                {monthTotal.toLocaleString()} ₫
                            </span>
                        </div>
                    );
                })}
             </div>

             <div className="flex items-center gap-3 bg-yellow-50 px-5 py-2.5 rounded-xl border border-yellow-200 flex-shrink-0 w-full lg:w-auto justify-center">
                <span className="text-sm font-bold text-gray-700 uppercase">
                    {isDateFiltered ? "Tổng theo lọc:" : "Tổng doanh thu:"}
                </span>
                {!isDateFiltered && (
                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-white border border-yellow-300 rounded-md text-sm px-2 py-1 font-bold outline-none text-blue-700 shadow-sm cursor-pointer">
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                )}
                <span className="text-xl font-black text-red-600">{displayTotal.toLocaleString()} ₫</span>
             </div>
        </div>
      </div>

      {showModal && editing && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-[100] pt-10 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-3xl rounded-xl p-6 shadow-2xl mb-10 border border-gray-100">
            <div className="flex items-center justify-between mb-5 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">{editing.id ? "Cập nhật đơn hàng" : "Tạo đơn hàng mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-gray-800"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative">
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Khách hàng</label>
                    <input 
                        type="text"
                        value={editing.customerName || ""}
                        onChange={(e) => {
                            setEditing({...editing, customerName: e.target.value, customerId: ""});
                            setFocusedCustomer(true);
                        }}
                        onFocus={() => setFocusedCustomer(true)}
                        onBlur={() => setTimeout(() => setFocusedCustomer(false), 200)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 focus:bg-white transition"
                        placeholder="Nhập tên khách hàng..."
                    />
                    {focusedCustomer && editing.customerName && (
                        <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto mt-1 rounded-lg">
                            {customers.filter(c => c.name.toLowerCase().includes((editing.customerName || "").toLowerCase()) || c.phoneNumber?.includes(editing.customerName)).map(c => (
                                <div
                                    key={c._id || c.id}
                                    onClick={() => {
                                        setEditing({
                                            ...editing,
                                            customerId: c._id || c.id,
                                            customerName: c.name,
                                            phone: c.phoneNumber || c.phone || editing.phone,
                                            address: c.direction || c.address || editing.address
                                        });
                                        setFocusedCustomer(false);
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
                  <div className="space-y-3 bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
                     {editing.items.map((it, idx) => (
                        <div key={idx} className="flex flex-col gap-2 bg-white p-3 rounded shadow-sm border border-gray-200">
                            <div className="relative w-full">
                                <input 
                                    type="text"
                                    value={it.tempName || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setEditing(p => {
                                            const items = [...p.items];
                                            items[idx] = { ...items[idx], tempName: val, productId: "" };
                                            return { ...p, items };
                                        });
                                    }}
                                    onFocus={() => setFocusedProductIndex(idx)}
                                    onBlur={() => setTimeout(() => setFocusedProductIndex(null), 200)}
                                    className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none font-medium rounded focus:bg-white focus:border-blue-300 transition"
                                    placeholder="Nhập tên SP..."
                                />
                                {focusedProductIndex === idx && it.tempName && (
                                    <div className="absolute z-50 w-full min-w-[200px] bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto mt-1 rounded-lg">
                                        {products.filter(p => p.name.toLowerCase().includes((it.tempName || "").toLowerCase())).map(p => (
                                            <div
                                                key={p._id || p.id}
                                                onClick={() => {
                                                    setEditing(prev => {
                                                        const items = [...prev.items];
                                                        items[idx] = { ...items[idx], productId: p._id || p.id, tempName: p.name, price: p.price };
                                                        return { ...prev, items };
                                                    });
                                                    setFocusedProductIndex(null);
                                                }}
                                                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                            >
                                                <div className="font-medium text-gray-800">{p.name}</div>
                                                <div className="text-xs text-blue-600">{p.price?.toLocaleString()}₫</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 w-full">
                                <div className="flex items-center flex-1 border border-gray-200 rounded bg-gray-50 overflow-hidden divide-x divide-gray-200">
                                    <div className="flex items-center px-2 py-1.5 flex-shrink-0">
                                        <span className="text-xs text-gray-500 mr-1.5">Size</span>
                                        <select 
                                            value={it.size || "M"} 
                                            onChange={(e) => setEditing((p) => { const items = [...p.items]; items[idx].size = e.target.value; return { ...p, items }; })} 
                                            className="bg-transparent text-sm focus:ring-0 outline-none font-medium text-gray-700"
                                        >
                                            <option value="S">S</option>
                                            <option value="M">M</option>
                                            <option value="L">L</option>
                                            <option value="XL">XL</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center px-2 py-1.5 flex-shrink-0">
                                        <span className="text-xs text-gray-500 mr-1.5">SL</span>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={it.quantity} 
                                            onChange={(e) => setEditing((p) => { const items = [...p.items]; items[idx].quantity = Number(e.target.value); return { ...p, items }; })} 
                                            className="w-12 border-0 bg-transparent text-center text-sm font-bold focus:ring-0 text-gray-800 p-0" 
                                        />
                                    </div>
                                    <div className="flex items-center px-2 py-1.5 flex-1">
                                        <span className="text-xs text-gray-500 mr-1.5">Giá</span>
                                        <input 
                                            type="number" 
                                            value={it.price} 
                                            onChange={(e) => setEditing((p) => { const items = [...p.items]; items[idx].price = Number(e.target.value); return { ...p, items }; })} 
                                            className="w-full border-0 bg-transparent text-right text-sm font-semibold text-blue-600 focus:ring-0 p-0" 
                                            placeholder="Giá" 
                                        />
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 border border-gray-200 rounded transition bg-gray-50 flex-shrink-0">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                     ))}
                     {editing.items.length === 0 && <p className="text-center text-sm text-gray-400 py-2">Chưa có sản phẩm nào. Nhấn "Thêm dòng" để bắt đầu.</p>}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 border-t pt-5 border-dashed">
                  <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-4">
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
                  </div>

                  <div className="col-span-2 md:col-span-1 space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Tạm tính SP:</span>
                          <span className="font-semibold text-gray-800">
                              {(editing.items && editing.items.length ? editing.items.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0), 0) : 0).toLocaleString()} ₫
                          </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <label className="text-gray-600 font-medium whitespace-nowrap mr-2">Phí ship:</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  value={editing.shipFee} 
                                  onChange={(e) => setEditing({...editing, shipFee: e.target.value})} 
                                  className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                              />
                          </div>
                      </div>
                      <div className="flex justify-between items-end border-t border-dashed pt-2 mt-1">
                          <span className="block text-xs text-gray-500 uppercase font-bold mb-0.5">Tổng thanh toán</span>
                          <span className="text-2xl font-extrabold text-blue-700 tracking-tight leading-none">
                              {calcTotal(editing.items, editing.shipFee).toLocaleString()} ₫
                          </span>
                      </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-blue-600 font-bold uppercase mb-1 block">Ngày nhận đơn</label>
                    <input type="date" value={editing.receivedDate} onChange={(e) => setEditing({...editing, receivedDate: e.target.value})} className="w-full border border-blue-300 bg-blue-50 rounded px-2 py-2 text-sm text-blue-800 font-medium" />
                  </div>
                   <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Ngày giao (Dự kiến/Thực tế)</label>
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