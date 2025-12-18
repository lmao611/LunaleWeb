import CustomerOrder from "../models/customerOrder.model.js";
import Order from "../models/orders.model.js"; // Model đơn hàng Admin
import User from "../models/user.model.js";

// 1. TẠO ĐƠN HÀNG (Có logic gộp đơn)
export const createOrder = async (req, res) => {
  try {
    const { products, totalAmount, note } = req.body;
    const user = req.user;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // A. Tìm đơn hàng cũ đang trạng thái Pending của user này
    const existingOrder = await CustomerOrder.findOne({
      user: user._id,
      status: "Pending",
    });

    if (existingOrder) {
      // --- LOGIC GỘP ĐƠN ---
      
      // 1. Gộp sản phẩm: Duyệt qua sp mới, nếu trùng thì cộng số lượng, không trùng thì push vào
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

      // 2. Cập nhật tổng tiền
      existingOrder.totalAmount += totalAmount;

      // 3. Cập nhật ghi chú (nếu có ghi chú mới)
      if (note) {
        existingOrder.note = existingOrder.note
          ? `${existingOrder.note} | ${note}`
          : note;
      }

      // 4. Cập nhật thời gian tạo để đơn này nhảy lên đầu (như đơn mới)
      existingOrder.createdAt = Date.now();
      
      // 5. Cập nhật lại thông tin khách hàng (đề phòng khách đổi địa chỉ ở đơn sau)
      existingOrder.customerInfo = {
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        address: user.direction,
      };

      await existingOrder.save();

      // Xóa giỏ hàng nếu cần
      if (req.body.isFromCart) {
        user.cartItems = [];
        await user.save();
      }

      return res.status(200).json(existingOrder);
    } 
    
    // B. Nếu không có đơn Pending -> Tạo mới hoàn toàn
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

// 2. LẤY ĐƠN CỦA TÔI (Giữ nguyên logic gộp đơn Admin + Customer như cũ)
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    // Đơn khách tự đặt
    const myCustomerOrders = await CustomerOrder.find({ user: userId }).lean();

    // Đơn Admin tạo cho khách
    const myAdminOrders = await Order.find({ customerId: userId })
      .populate("items.productId", "name image price") 
      .lean();

    // Chuẩn hóa đơn Admin
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

// 3. CẬP NHẬT TRẠNG THÁI (Có logic tự tạo đơn bên Orders)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const customerOrder = await CustomerOrder.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    if (!customerOrder) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // --- LOGIC TỰ ĐỘNG TẠO ĐƠN BÊN ORDERS (ADMIN) ---
    // Chỉ tạo khi trạng thái chuyển sang 'Processed' (Đã xác nhận/xử lý)
    if (status === "Processed") {
        // Map products từ CustomerOrder sang items của Order
        const orderItems = customerOrder.products.map(p => ({
            productId: p.product, // ID sản phẩm
            size: p.size,
            quantity: p.quantity,
            price: p.price
        }));

        // Tạo đơn mới bên collection 'Order'
        await Order.create({
            customerId: customerOrder.user,
            customerName: customerOrder.customerInfo.name,
            address: customerOrder.customerInfo.address,
            phone: customerOrder.customerInfo.phone,
            items: orderItems,
            total: customerOrder.totalAmount,
            status: "chưa giao", // Trạng thái mặc định bạn yêu cầu
            receivedDate: null,
            deliverDate: null,
            paymentMethod: "COD", // Mặc định hoặc lấy từ customerOrder nếu có field này
            createdBy: req.user._id // Admin xác nhận đơn là người tạo
        });
    }

    res.json(customerOrder);
  } catch (error) {
    console.error("Lỗi update status:", error);
    res.status(500).json({ message: "Lỗi cập nhật đơn hàng" });
  }
};

// ... Các hàm khác giữ nguyên (cancelMyOrder, updateOrderAddress, getAllOrders, deleteOrder)
export const cancelMyOrder = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;
  
      let order = await CustomerOrder.findOne({ _id: id, user: userId });
      if (order) {
        if (order.status !== "Pending") return res.status(400).json({ message: "Không thể hủy đơn đã xử lý" });
        order.status = "Cancelled";
        await order.save();
        return res.json({ message: "Đã hủy đơn hàng", order });
      }
  
      order = await Order.findOne({ _id: id, customerId: userId });
      if (order) {
        if (order.status !== "chưa giao" && order.status !== "Pending") return res.status(400).json({ message: "Không thể hủy đơn hàng này" });
        order.status = "đã hủy";
        await order.save();
        return res.json({ message: "Đã hủy đơn hàng", order });
      }
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi hủy đơn hàng" });
    }
};

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
         if (order.status !== "chưa giao" && order.status !== "Pending") return res.status(400).json({ message: "Không thể sửa đơn đã giao" });
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