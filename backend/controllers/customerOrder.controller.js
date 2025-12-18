import CustomerOrder from "../models/customerOrder.model.js";
import Order from "../models/orders.model.js"; // Import model đơn hàng của Admin
import User from "../models/user.model.js";

// 1. TẠO ĐƠN HÀNG (Có logic gộp đơn)
export const createOrder = async (req, res) => {
  try {
    const { products, totalAmount, note } = req.body;
    const user = req.user;

    // Validate
    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // Kiểm tra xem user này có đơn hàng nào đang CHỜ XỬ LÝ (Pending) không
    const existingOrder = await CustomerOrder.findOne({
      user: user._id,
      status: "Pending", // Chỉ gộp vào đơn chưa xử lý
    });

    if (existingOrder) {
      // --- LOGIC GỘP ĐƠN ---
      
      // Duyệt qua từng sản phẩm mới để gộp vào danh sách cũ
      products.forEach((newProduct) => {
        // Kiểm tra xem sản phẩm này (cùng ID và cùng Size) đã có trong đơn cũ chưa
        const existingItemIndex = existingOrder.products.findIndex(
          (p) =>
            p.product.toString() === newProduct.product.toString() &&
            p.size === newProduct.size
        );

        if (existingItemIndex > -1) {
          // Nếu có rồi -> Cộng dồn số lượng
          existingOrder.products[existingItemIndex].quantity += newProduct.quantity;
        } else {
          // Nếu chưa có -> Thêm mới vào mảng
          existingOrder.products.push(newProduct);
        }
      });

      // Cộng dồn tổng tiền
      existingOrder.totalAmount += totalAmount;

      // Nối thêm ghi chú (nếu có)
      if (note) {
        existingOrder.note = existingOrder.note
          ? `${existingOrder.note} | ${note}`
          : note;
      }

      // Cập nhật lại thông tin khách hàng (trường hợp khách đổi địa chỉ/sđt ở lần đặt sau)
      existingOrder.customerInfo = {
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        address: user.direction,
      };

      // QUAN TRỌNG: Cập nhật thời gian tạo thành hiện tại để đơn hàng nhảy lên đầu danh sách
      existingOrder.createdAt = Date.now();

      await existingOrder.save();

      // Xóa giỏ hàng sau khi gộp xong
      if (req.body.isFromCart) {
        user.cartItems = [];
        await user.save();
      }

      return res.status(200).json(existingOrder);
    }

    // Nếu không có đơn Pending -> Tạo đơn mới hoàn toàn như bình thường
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

    // Xóa giỏ hàng
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

// 2. LẤY ĐƠN CỦA TÔI (Gộp đơn khách tự đặt + Đơn Admin tạo)
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    // A. Lấy đơn khách tự đặt
    const myCustomerOrders = await CustomerOrder.find({ user: userId }).lean();

    // B. Lấy đơn do Admin tạo cho user này (tìm theo customerId)
    const myAdminOrders = await Order.find({ customerId: userId })
      .populate("items.productId", "name image price") 
      .lean();

    // C. Chuẩn hóa đơn Admin cho giống cấu trúc đơn Khách
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

    // D. Gộp 2 danh sách và sắp xếp theo ngày giảm dần
    const allOrders = [...myCustomerOrders, ...normalizedAdminOrders].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(allOrders);
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ message: "Lỗi tải lịch sử đơn hàng" });
  }
};

// 3. CẬP NHẬT TRẠNG THÁI (Có logic tự tạo đơn bên Orders Admin)
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
    // Khi trạng thái chuyển sang 'Processed' (Đã xác nhận), tạo bản sao bên bảng Orders
    if (status === "Processed") {
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
            createdBy: req.user._id
        });
    }

    res.json(customerOrder);
  } catch (error) {
    console.error("Lỗi update status:", error);
    res.status(500).json({ message: "Lỗi cập nhật đơn hàng" });
  }
};

// 4. HỦY ĐƠN HÀNG CỦA TÔI
export const cancelMyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Kiểm tra CustomerOrder
    let order = await CustomerOrder.findOne({ _id: id, user: userId });
    if (order) {
      if (order.status !== "Pending") {
        return res.status(400).json({ message: "Không thể hủy đơn đã xử lý" });
      }
      order.status = "Cancelled";
      await order.save();
      return res.json({ message: "Đã hủy đơn hàng", order });
    }

    // Kiểm tra Order (Admin tạo)
    order = await Order.findOne({ _id: id, customerId: userId });
    if (order) {
      if (order.status !== "chưa giao" && order.status !== "Pending") {
        return res.status(400).json({ message: "Không thể hủy đơn hàng này" });
      }
      order.status = "đã hủy";
      await order.save();
      return res.json({ message: "Đã hủy đơn hàng", order });
    }

    return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Lỗi hủy đơn hàng" });
  }
};

// 5. CẬP NHẬT ĐỊA CHỈ ĐƠN HÀNG
export const updateOrderAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;
    const userId = req.user._id;

    // CustomerOrder
    let order = await CustomerOrder.findOne({ _id: id, user: userId });
    if (order) {
       if (order.status !== "Pending") return res.status(400).json({ message: "Không thể sửa đơn đã xử lý" });
       order.customerInfo.address = address;
       await order.save();
       return res.json({ message: "Cập nhật thành công", order });
    }

    // Admin Order
    order = await Order.findOne({ _id: id, customerId: userId });
    if (order) {
       if (order.status !== "chưa giao" && order.status !== "Pending") return res.status(400).json({ message: "Không thể sửa đơn đã giao" });
       order.address = address;
       await order.save();
       return res.json({ message: "Cập nhật thành công", order });
    }

    return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ message: "Lỗi cập nhật địa chỉ" });
  }
};

// 6. CÁC HÀM ADMIN KHÁC
export const getAllOrders = async (req, res) => {
  try {
    const orders = await CustomerOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng" });
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