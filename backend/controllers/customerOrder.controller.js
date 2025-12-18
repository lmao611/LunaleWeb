import CustomerOrder from "../models/customerOrder.model.js";
import User from "../models/user.model.js";

// Tạo đơn hàng mới
export const createOrder = async (req, res) => {
  try {
    const { products, totalAmount, note } = req.body;
    const user = req.user;

    // Validate
    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // Tạo đơn hàng
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

    // Nếu đặt thành công, có thể xóa giỏ hàng của user (tùy chọn, ở đây mình làm luôn)
    // Nếu mua từ CartPage thì xóa cart, mua lẻ từ ContactModal thì không xóa cart cũ
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

// Lấy tất cả đơn hàng (Cho Admin)
export const getAllOrders = async (req, res) => {
  try {
    // Sắp xếp mới nhất trước
    const orders = await CustomerOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng" });
  }
};

// Cập nhật trạng thái đơn hàng (Đã xử lý)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await CustomerOrder.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật đơn hàng" });
  }
};

// Xóa đơn hàng
export const deleteOrder = async (req, res) => {
  try {
    await CustomerOrder.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa đơn hàng" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa đơn hàng" });
  }
};
export const getMyOrders = async (req, res) => {
  try {
    // Tìm đơn hàng có user trùng với user đang login
    const orders = await CustomerOrder.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ message: "Lỗi tải lịch sử đơn hàng" });
  }
};

// 2. Hủy đơn hàng (Chỉ cho phép khi trạng thái là Pending)
export const cancelMyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await CustomerOrder.findOne({ _id: id, user: req.user._id });

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Không thể hủy đơn hàng đã được xử lý" });
    }

    order.status = "Cancelled";
    await order.save();

    res.json({ message: "Đã hủy đơn hàng thành công", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Lỗi hủy đơn hàng" });
  }
};

// 3. Cập nhật địa chỉ đơn hàng (Chỉ cho phép khi Pending)
export const updateOrderAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;
    
    const order = await CustomerOrder.findOne({ _id: id, user: req.user._id });

    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    if (order.status !== "Pending") return res.status(400).json({ message: "Chỉ có thể sửa địa chỉ khi đơn đang chờ xử lý" });

    // Cập nhật địa chỉ trong customerInfo
    order.customerInfo.address = address;
    await order.save();

    res.json({ message: "Cập nhật địa chỉ thành công", order });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ message: "Lỗi cập nhật địa chỉ" });
  }
}