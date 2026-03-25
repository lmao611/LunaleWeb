import Order from "../models/orders.model.js";
import Product from "../models/product.model.js";

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

    for (const it of items) {
      let price = Number(it.price);
      if (isNaN(price)) price = 0;
      
      let name = it.name || "Sản phẩm tự nhập";

      // Nếu có productId hợp lệ, lấy thông tin từ DB để đối chiếu
      if (it.productId && it.productId.trim() !== "") {
         const prod = await Product.findById(it.productId);
         if (prod) {
            price = it.price !== undefined ? Number(it.price) : (Number(prod.price) || 0);
            name = prod.name;
         }
      }
      
      const quantity = Number(it.quantity) || 1;
      total += price * quantity;
      
      const itemData = {
        name: name,
        size: it.size || "",
        quantity,
        price 
      };
      
      // Tuyệt đối KHÔNG gán productId nếu nó rỗng, để tránh lỗi CastError
      if (it.productId && it.productId.trim() !== "") {
          itemData.productId = it.productId;
      }
      populatedItems.push(itemData);
    }

    const finalShipFee = Number(shipFee) || 0;
    total += finalShipFee;

    const orderData = {
      customerName: customerName, 
      address: address || "", 
      phone: phone || "",
      items: populatedItems,
      total: total, 
      shipFee: finalShipFee,
      status: status || "chưa giao",
      paymentMethod: paymentMethod || "COD"
    };

    // Tuyệt đối KHÔNG gán customerId nếu rỗng
    if (customerId && customerId.trim() !== "") {
        orderData.customerId = customerId;
    }
    
    if (receivedDate) orderData.receivedDate = new Date(receivedDate);
    if (deliverDate) orderData.deliverDate = new Date(deliverDate);
    if (req.user && req.user._id) orderData.createdBy = req.user._id;

    const order = await Order.create(orderData);

    const full = await Order.findById(order._id)
      .populate("customerId", "name email phoneNumber direction")
      .populate("items.productId", "name price");

    res.status(201).json(full);
  } catch (error) {
    console.error("createOrder error:", error);
    // Thay đổi quan trọng: Trả về 400 kèm message để Frontend hiện rõ nguyên nhân
    res.status(400).json({ message: `Chi tiết lỗi Server: ${error.message}` });
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
    res.status(400).json({ message: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };

    if (body.items && Array.isArray(body.items)) {
      let total = 0;
      const populated = [];
      for (const it of body.items) {
        let price = Number(it.price);
        if (isNaN(price)) price = 0;
        let name = it.name || "Sản phẩm tự nhập";

        if (it.productId && it.productId.trim() !== "") {
            const prod = await Product.findById(it.productId);
            if (prod) {
                price = it.price !== undefined ? Number(it.price) : (Number(prod.price) || 0);
                name = prod.name;
            }
        }
        
        const quantity = Number(it.quantity) || 1;
        total += price * quantity;
        
        const itemToSave = { name, size: it.size || "", quantity, price };
        if (it.productId && it.productId.trim() !== "") {
            itemToSave.productId = it.productId;
        }
        populated.push(itemToSave);
      }
      body.items = populated;
      body.total = total;
      
      if (body.shipFee) body.total += Number(body.shipFee);
    }

    if (body.receivedDate) body.receivedDate = new Date(body.receivedDate);
    if (body.deliverDate) body.deliverDate = new Date(body.deliverDate);

    // Xóa triệt để customerId khỏi payload nếu nó là chuỗi rỗng
    if (body.customerId === "" || body.customerId === null) {
        delete body.customerId; 
        body.$unset = { customerId: 1 };
    }

    const order = await Order.findByIdAndUpdate(id, body, { new: true })
      .populate("customerId", "name email phoneNumber direction")
      .populate("items.productId", "name price");

    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    res.json(order);
  } catch (error) {
    console.error("updateOrder error:", error);
    res.status(400).json({ message: `Chi tiết lỗi Server: ${error.message}` });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa đơn hàng" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};