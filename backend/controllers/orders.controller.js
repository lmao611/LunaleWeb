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

    if (!customerId) return res.status(400).json({ message: "Vui lòng chọn khách hàng" });
    if (!items || !items.length) return res.status(400).json({ message: "Chưa có sản phẩm nào" });

    const customer = await User.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Không tìm thấy khách hàng" });

    let total = 0;
    const populatedItems = [];

    for (const it of items) {
      const prod = await Product.findById(it.productId);
      if (!prod) return res.status(404).json({ message: `Sản phẩm ${it.productId} không tồn tại` });
      
      const price = it.price !== undefined ? Number(it.price) : (prod.price ?? 0);
      const quantity = Number(it.quantity) || 1;
      
      total += price * quantity;
      
      populatedItems.push({
        productId: prod._id,
        size: it.size,
        quantity,
        price 
      });
    }

    if (shipFee) total += Number(shipFee);

    const order = await Order.create({
      customerId: customer._id,
      
      
      customerName: customerName || customer.name, 
      address: address || customer.direction || "", 
      phone: phone || customer.phoneNumber || "",
      
      items: populatedItems,
      total, 
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
        const prod = await Product.findById(it.productId);
        if (!prod) return res.status(404).json({ message: `Product ${it.productId} not found` });
        const price = prod.price ?? 0;
        const quantity = Number(it.quantity) || 1;
        total += price * quantity;
        populated.push({ productId: prod._id, size: it.size, quantity, price });
      }
      body.items = populated;
      body.total = total;
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
