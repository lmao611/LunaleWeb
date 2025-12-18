import CustomerOrder from "../models/customerOrder.model.js";
import Order from "../models/orders.model.js"; 
import User from "../models/user.model.js";

// 1. TẠO ĐƠN HÀNG (Có logic gộp đơn nếu còn đơn Pending)
export const createOrder = async (req, res) => {
  try {
    const { products, totalAmount, note } = req.body;
    const user = req.user;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    const existingOrder = await CustomerOrder.findOne({
      user: user._id,
      status: "Pending",
    });

    if (existingOrder) {
      products.forEach((newProduct) => {
        const existingItemIndex = existingOrder.products.findIndex(
          (p) =>
            p.product.toString() === newProduct.product.toString() &&
            p.size === newProduct.size
        );

        if (existingItemIndex > -1) {
          existingOrder.products[existingItemIndex].quantity += newProduct.quantity;
        } else {
          existingOrder.products.push(newProduct);
        }
      });

      existingOrder.totalAmount += totalAmount;
      if (note) existingOrder.note = existingOrder.note ? `${existingOrder.note} | ${note}` : note;
      existingOrder.customerInfo = {
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        address: user.direction,
      };
      existingOrder.createdAt = Date.now(); // Đẩy lên đầu danh sách

      await existingOrder.save();

      if (req.body.isFromCart) {
        user.cartItems = [];
        await user.save();
      }

      return res.status(200).json(existingOrder);
    }

    const newOrder = await CustomerOrder.create({
      user: user._id,
      customerInfo: {
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        address: user.direction,
      },
      products,
      totalAmount,
      note,
    });

    if (req.body.isFromCart) {
        user.cartItems = [];
        await user.save();
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
};

// 2. LẤY ĐƠN CỦA TÔI (Ẩn đơn đã xác nhận để tránh trùng lặp)
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    // A. Lấy đơn khách tự đặt (TRỪ những đơn đã xác nhận - Processed)
    // Vì đơn Processed đã được chuyển sang bảng Order (Admin) rồi
    const myCustomerOrders = await CustomerOrder.find({ 
      user: userId,
      status: { $ne: "Processed" } 
    }).lean();

    // B. Lấy đơn do Admin tạo (bao gồm cả đơn Processed vừa chuyển sang)
    const myAdminOrders = await Order.find({ customerId: userId })
      .populate("items.productId", "name image price") 
      .lean();

    // C. Chuẩn hóa đơn Admin
    const normalizedAdminOrders = myAdminOrders.map(order => ({
      _id: order._id,
      createdAt: order.createdAt,
      status: order.status,
      totalAmount: order.total,
      paymentMethod: order.paymentMethod,
      customerInfo: {
        address: order.address,
        phone: order.phone,
        name: order.customerName
      },
      products: order.items.map(item => ({
        product: item.productId?._id,
        name: item.productId?.name || "Sản phẩm đã xóa",
        image: item.productId?.image || "/placeholder.png",
        price: item.price || 0,
        quantity: item.quantity,
        size: item.size
      })),
      type: 'admin_created'
    }));

    const allOrders = [...myCustomerOrders, ...normalizedAdminOrders].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(allOrders);
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ message: "Lỗi tải lịch sử đơn hàng" });
  }
};

// 3. CẬP NHẬT TRẠNG THÁI & ĐỒNG BỘ ĐƠN ADMIN
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Lấy đơn hàng cũ để so sánh trạng thái
    const oldOrder = await CustomerOrder.findById(id);
    if (!oldOrder) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    // Cập nhật trạng thái mới
    const customerOrder = await CustomerOrder.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    // LOGIC ĐỒNG BỘ:
    
    // TH1: Xác nhận đơn (Pending -> Processed) => TẠO ĐƠN ADMIN
    if (status === "Processed" && oldOrder.status !== "Processed") {
        const orderItems = customerOrder.products.map(p => ({
            productId: p.product,
            size: p.size,
            quantity: p.quantity,
            price: p.price
        }));

        await Order.create({
            customerId: customerOrder.user,
            customerName: customerOrder.customerInfo.name,
            address: customerOrder.customerInfo.address,
            phone: customerOrder.customerInfo.phone,
            items: orderItems,
            total: customerOrder.totalAmount,
            status: "chưa giao",
            receivedDate: null,
            deliverDate: null,
            paymentMethod: "COD",
            // Kiểm tra req.user có tồn tại không trước khi lấy _id
            createdBy: req.user ? req.user._id : null 
        });
    }

    // TH2: Hoàn tác (Processed -> Pending) => XÓA ĐƠN ADMIN TƯƠNG ỨNG
    else if (status === "Pending" && oldOrder.status === "Processed") {
        // Tìm và xóa đơn Admin tương ứng (đơn mới nhất của khách này có trạng thái 'chưa giao')
        await Order.findOneAndDelete(
            {
                customerId: customerOrder.user,
                total: customerOrder.totalAmount,
                status: "chưa giao" 
            }, 
            { sort: { createdAt: -1 } } // Xóa đơn mới nhất khớp điều kiện
        );
    }

    res.json(customerOrder);
  } catch (error) {
    console.error("Lỗi update status:", error);
    res.status(500).json({ message: "Lỗi cập nhật đơn hàng", error: error.message });
  }
};

// 4. HỦY ĐƠN HÀNG (Đã fix lỗi validate)
export const cancelMyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Tìm trong CustomerOrder
    let order = await CustomerOrder.findOne({ _id: id, user: userId });
    
    if (order) {
      if (order.status !== "Pending") {
        return res.status(400).json({ message: "Không thể hủy đơn đã xác nhận" });
      }
      order.status = "Cancelled";
      await order.save();
      return res.json({ message: "Đã hủy đơn hàng", order });
    }

    // Nếu không thấy, tìm trong Order (Admin)
    order = await Order.findOne({ _id: id, customerId: userId });
    
    if (order) {
      if (order.status !== "chưa giao") {
        return res.status(400).json({ message: "Không thể hủy đơn hàng đã giao/đang giao" });
      }
      order.status = "đã hủy";
      await order.save();
      return res.json({ message: "Đã hủy đơn hàng", order });
    }

    return res.status(404).json({ message: "Không tìm thấy đơn hàng để hủy" });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Lỗi server khi hủy đơn", error: error.message });
  }
};

// 5. CẬP NHẬT ĐỊA CHỈ
export const updateOrderAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;
    const userId = req.user._id;

    let order = await CustomerOrder.findOne({ _id: id, user: userId });
    if (order) {
       if (order.status !== "Pending") return res.status(400).json({ message: "Không thể sửa đơn đã xử lý" });
       order.customerInfo.address = address;
       await order.save();
       return res.json({ message: "Cập nhật thành công", order });
    }

    order = await Order.findOne({ _id: id, customerId: userId });
    if (order) {
       if (order.status !== "chưa giao") return res.status(400).json({ message: "Không thể sửa đơn đã giao" });
       order.address = address;
       await order.save();
       return res.json({ message: "Cập nhật thành công", order });
    }
    return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật địa chỉ" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await CustomerOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    await CustomerOrder.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa đơn hàng" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa đơn hàng" });
  }
};