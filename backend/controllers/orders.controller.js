import Order from "../models/orders.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

export const createOrder = async (req, res) => {
  try {
    const { 
        customerId, items, status, receivedDate, deliverDate, 
        paymentMethod, shipFee, 
        address, phone, customerName 
    } = req.body;

    if (!customerName) return res.status(400).json({ message: "Vui lòng nhập tên khách hàng" });
    if (!items || !items.length) return res.status(400).json({ message: "Chưa có sản phẩm nào" });

    let total = 0;
    const populatedItems = [];

    // Tính toán giá và hỗ trợ sản phẩm thủ công
    for (const it of items) {
      let price = Number(it.price) || 0;
      let name = it.name || "Sản phẩm tự nhập";

      // Nếu có productId thì cố gắng lấy giá và tên từ DB
      if (it.productId) {
         const prod = await Product.findById(it.productId);
         if (prod) {
            price = it.price !== undefined ? Number(it.price) : (prod.price ?? 0);
            name = prod.name;
         }
      }
      
      const quantity = Number(it.quantity) || 1;
      total += price * quantity;
      
      populatedItems.push({
        productId: it.productId || null,
        name: name,
        size: it.size,
        quantity,
        price 
      });
    }

    if (shipFee) total += Number(shipFee);

    const order = await Order.create({
      customerId: customerId || null,
      customerName: customerName, 
      address: address || "", 
      phone: phone || "",
      items: populatedItems,
      total, 
      shipFee: Number(shipFee) || 0,
      status: status || "chưa giao",
      receivedDate: receivedDate ? new Date(receivedDate) : null,
      deliverDate: deliverDate ? new Date(deliverDate) : null,
      paymentMethod: paymentMethod || "COD",
      createdBy: req.user?._id || null
    });

    const full = await Order.findById(order._id)
      .populate("customerId", "name email phoneNumber direction")
      .populate("items.productId", "name price");

    res.status(201).json(full);
  } catch (error) {
    console.error("createOrder error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "name email phoneNumber direction")
      .populate("items.productId", "name price")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("getAllOrders error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (body.items && Array.isArray(body.items)) {
      let total = 0;
      const populated = [];
      for (const it of body.items) {
        let price = Number(it.price) || 0;
        let name = it.name || "Sản phẩm tự nhập";

        if (it.productId) {
            const prod = await Product.findById(it.productId);
            if (prod) {
                price = it.price !== undefined ? Number(it.price) : (prod.price ?? 0);
                name = prod.name;
            }
        }
        
        const quantity = Number(it.quantity) || 1;
        total += price * quantity;
        populated.push({ productId: it.productId || null, name, size: it.size, quantity, price });
      }
      body.items = populated;
      body.total = total;
      
      if (body.shipFee) body.total += Number(body.shipFee);
    }

    if (body.receivedDate) body.receivedDate = new Date(body.receivedDate);
    if (body.deliverDate) body.deliverDate = new Date(body.deliverDate);

    const order = await Order.findByIdAndUpdate(id, body, { new: true })
      .populate("customerId", "name email phoneNumber direction")
      .populate("items.productId", "name price");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("updateOrder error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndDelete(id);
    res.json({ message: "Đã xóa đơn hàng" });
  } catch (error) {
    console.error("deleteOrder error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};