import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, PlusCircle, Edit2, X } from "lucide-react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
const sizes = ["S", "M", "L", "XL"];
const statuses = ["chưa giao", "đang giao", "đã giao"];
const paymentMethods = ["COD", "Chuyển khoản"];

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
const [currentYear, setCurrentYear] = useState(new Date().getFullYear());


  useEffect(() => {
    fetchAll();
    fetchCustomers();
    fetchProducts();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await axios.get("/api/orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const res = await axios.get("/api/users");
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchProducts() {
    try {
      const res = await axios.get("/api/products");
      const list = Array.isArray(res.data) ? res.data : res.data.products ?? res.data;
      setProducts(list);
    } catch (err) {
      console.error(err);
    }
  }

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
      address: c ? c.direction : p.address,
      phone: c ? c.phoneNumber : p.phone,
    }));
  }

  function calcTotal(items) {
    if (!items || !items.length) return 0;
    return items.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0), 0);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  async function handleSave(e) {
    e && e.preventDefault && e.preventDefault();
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
        const res = await axios.put(`/api/orders/${editing.id}`, payload);
        setOrders((s) =>
          s.map((o) =>
            String(o._id ?? o.id) === String(res.data._id ?? res.data.id) ? res.data : o
          )
        );
      } else {
        const res = await axios.post("/api/orders", payload);
        setOrders((s) => [res.data, ...s]);
      }
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      console.error(err);
      alert("Lưu thất bại");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Xóa đơn hàng này?")) return;
    try {
      await axios.delete(`/api/orders/${id}`);
      setOrders((s) => s.filter((o) => String(o._id ?? o.id) !== String(id)));
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại");
    }
  }


// 🧾 Hàm xuất Excel có logo thật
async function exportToExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Đơn hàng");

  // 🪶 Header
  const headers = [
    "STT",
    "Trạng thái",
    "Ngày nhận",
    "Ngày giao",
    "Khách hàng",
    "Địa chỉ",
    "SĐT",
    "Sản phẩm",
    "Tổng tiền",
    "Thanh toán",
  ];
  worksheet.addRow(headers);

  // 🧱 Thêm dữ liệu
  orders.forEach((o, idx) => {
    const itemsStr = (o.items || [])
      .map((it) => {
        const prod = products.find(
          (p) => String(p._id) === String(it.productId?._id ?? it.productId)
        );
        return `${prod ? prod.name : it.productId?.name ?? it.productId} (size ${it.size}, SL ${it.quantity})`;
      })
      .join("; ");

    worksheet.addRow([
      idx + 1,
      o.status,
      formatDate(o.receivedDate),
      formatDate(o.deliverDate),
      o.customerName ?? o.customerId?.name ?? "-",
      o.address,
      o.phone,
      itemsStr,
      (o.total || 0).toLocaleString() + " ₫",
      o.paymentMethod,
    ]);
  });

  // 🧮 Auto width cho cột
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value ? cell.value.toString().length : 0;
      if (len > maxLength) maxLength = len;
    });
    column.width = Math.min(maxLength + 4, 50);
  });

  // 🎨 Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF666666" },
  };

  // 🖼️ Thêm logo (lấy từ public/lunale.png)
  const response = await fetch("/lunale.png");
  const imgBuffer = await response.arrayBuffer();
  const logoId = workbook.addImage({
    buffer: imgBuffer,
    extension: "png",
  });

  const lastRow = worksheet.lastRow.number + 2;
  const lastCol = worksheet.columns.length;
  worksheet.addImage(logoId, {
    tl: { col: lastCol - 2, row: lastRow },
    ext: { width: 180, height: 80 },
  });

  // 📦 Xuất file Excel
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `DonHang_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

  // 🔍 Lọc đơn hàng theo tháng và năm
const filteredByMonth = orders.filter((o) => {
  if (!o.receivedDate) return false;

  let d;
  if (o.receivedDate.includes("/")) {
    // Dạng dd/mm/yyyy
    const [day, month, year] = o.receivedDate.split("/").map(Number);
    d = new Date(year, month - 1, day);
  } else {
    // Dạng yyyy-mm-dd hoặc ISO
    d = new Date(o.receivedDate);
  }

  if (isNaN(d)) return false; // bỏ qua ngày lỗi

  return (
    d.getMonth() + 1 === currentMonth &&
    d.getFullYear() === currentYear &&
    (filterStatus ? o.status === filterStatus : true)
  );
});


  const filtered = orders.filter((o) => (filterStatus ? o.status === filterStatus : true));

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Quản lý đơn hàng</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">Tất cả</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
  onClick={exportToExcel}
  className="bg-green-600 text-white px-3 py-1 rounded inline-flex items-center gap-2"
>
  📊 Xuất Excel
</button>

          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-3 py-1 rounded inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Thêm đơn
          </button>
        </div>
      </div>
      {loading ? (
        <div>Đang tải...</div>
      ) : (

<div className="w-screen relative left-1/2 right-1/2 -translate-x-1/2 px-8">
  <div className="overflow-x-auto bg-white rounded shadow w-full">
    <table className="w-full min-w-max table-auto text-sm border-collapse">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="px-4 py-2 text-left">#</th>
          <th className="px-4 py-2 text-left">Trạng thái</th>
          <th className="px-4 py-2 text-left">Ngày nhận</th>
          <th className="px-4 py-2 text-left">Ngày giao</th>
          <th className="px-4 py-2 text-left">Khách hàng</th>
          <th className="px-4 py-2 text-left">Địa chỉ</th>
          <th className="px-4 py-2 text-left">SĐT</th>
          <th className="px-4 py-2 text-left">Sản phẩm</th>
          <th className="px-4 py-2 text-left">Số lượng</th>
          <th className="px-4 py-2 text-left">Size</th>
          <th className="px-4 py-2 text-left">Tổng</th>
          <th className="px-4 py-2 text-left">Thanh toán</th>
          <th className="px-4 py-2 text-left">Hành động</th>
        </tr>
      </thead>
      <tbody>
        {filteredByMonth.map((o, idx) => {
          const statusColor =
            o.status === "chưa giao"
              ? "bg-red-100 text-red-700"
              : o.status === "đang giao"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700";

          return (
            <tr
              key={o._id ?? o.id}
              className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition"
            >
              <td className="px-4 py-2 align-top font-medium">{idx + 1}</td>

              <td className={`px-4 py-2 align-top font-semibold ${statusColor}`}>
                {o.status}
              </td>

              <td className="px-4 py-2 align-top">{formatDate(o.receivedDate)}</td>
              <td className="px-4 py-2 align-top">{formatDate(o.deliverDate)}</td>
              <td className="px-4 py-2 align-top">
                {o.customerName ?? o.customerId?.name ?? "-"}
              </td>
              <td className="px-4 py-2 align-top">{o.address}</td>
              <td className="px-4 py-2 align-top">{o.phone}</td>

              {/* sản phẩm */}
              <td className="px-4 py-2 align-top">
                <ul className="list-disc ml-4">
                  {(o.items || []).map((it, i) => {
                    const prod = products.find(
                      (p) =>
                        String(p._id) ===
                        String(it.productId?._id ?? it.productId)
                    );
                    return (
                      <li key={i}>{prod ? prod.name : "Sản phẩm đã xóa"}</li>
                    );
                  })}
                </ul>
              </td>

              {/* số lượng */}
              <td className="px-4 py-2 align-top">
                <ul>
                  {(o.items || []).map((it, i) => (
                    <li key={i}>x{it.quantity}</li>
                  ))}
                </ul>
              </td>

              {/* size */}
              <td className="px-4 py-2 align-top">
                <ul>
                  {(o.items || []).map((it, i) => (
                    <li key={i}>{it.size}</li>
                  ))}
                </ul>
              </td>

              <td className="px-4 py-2 align-top font-semibold text-gray-900">
                {(o.total || 0).toLocaleString()} ₫
              </td>
              <td className="px-4 py-2 align-top">{o.paymentMethod}</td>

              <td className="px-4 py-2 align-top">
                <div className="flex gap-3">
                  <button
                    onClick={() => openEdit(o)}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(o._id ?? o.id)}
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
        {filteredByMonth.length === 0 && (
          <tr>
            <td colSpan={13} className="px-3 py-6 text-center text-gray-500">
              Không có đơn hàng
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
  <div className="flex justify-center items-center gap-2 mt-6">
  <button
    onClick={() => {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear((y) => y - 1);
      } else setCurrentMonth((m) => m - 1);
    }}
    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
  >
    ◀ Trước
  </button>
  <div className="font-semibold text-lg">
    {currentMonth}/{currentYear}
  </div>
  <button
    onClick={() => {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear((y) => y + 1);
      } else setCurrentMonth((m) => m + 1);
    }}
    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
  >
    Sau ▶
  </button>
</div>
</div>

      )}
      {showModal && editing && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 pt-30">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-3xl rounded p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                {editing.id ? "Sửa đơn hàng" : "Thêm đơn hàng"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditing(null);
                }}
                className="p-1 rounded bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm">Khách hàng</label>
                  <select
                    value={editing.customerId}
                    onChange={(e) => onCustomerSelect(e.target.value)}
                    className="w-full border px-2 py-1 rounded"
                  >
                    <option value="">Chọn khách</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} — {c.phoneNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Địa chỉ</label>
                  <input
                    value={editing.address || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, address: e.target.value }))}
                    className="w-full border px-2 py-1 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">SĐT</label>
                  <input
                    value={editing.phone || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full border px-2 py-1 rounded"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm">Trạng thái</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))}
                    className="w-full border px-2 py-1 rounded"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Ngày nhận</label>
                  <input
                    type="text"
                    value={editing.receivedDate || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, receivedDate: e.target.value }))}
                    placeholder="ngày/tháng/năm"
                    className="w-full border px-2 py-1 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">Ngày giao</label>
                  <input
                    type="text"
                    value={editing.deliverDate || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, deliverDate: e.target.value }))}
                    placeholder="ngày/tháng/năm"
                    className="w-full border px-2 py-1 rounded"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Sản phẩm</h4>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 text-blue-600"
                  >
                    <PlusCircle className="w-4 h-4" /> Thêm sản phẩm
                  </button>
                </div>
                <div className="space-y-2">
                  {(editing.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center border rounded p-2"
                    >
                      <div className="sm:col-span-2">
                        <select
                          value={it.productId}
                          onChange={(e) => onItemChange(idx, "productId", e.target.value)}
                          className="w-full border px-2 py-1 rounded"
                        >
                          <option value="">Chọn sản phẩm</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} — {p.price.toLocaleString()} ₫
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={it.size}
                          onChange={(e) => onItemChange(idx, "size", e.target.value)}
                          className="w-full border px-2 py-1 rounded"
                        >
                          {sizes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => onItemChange(idx, "quantity", e.target.value)}
                          className="w-full border px-2 py-1 rounded"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={(it.price || 0).toLocaleString() + " ₫"}
                          readOnly
                          className="w-full border px-2 py-1 rounded bg-gray-50"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {((it.price || 0) * (it.quantity || 0)).toLocaleString()} ₫
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-sm">Thanh toán</label>
                  <select
                    value={editing.paymentMethod}
                    onChange={(e) => setEditing((p) => ({ ...p, paymentMethod: e.target.value }))}
                    className="w-full border px-2 py-1 rounded"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm text-gray-600">Tổng</div>
                  <div className="text-lg font-semibold">
                    {calcTotal(editing.items).toLocaleString()} ₫
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditing(null);
                    }}
                    className="px-3 py-1 bg-gray-200 rounded"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
                    Lưu
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
