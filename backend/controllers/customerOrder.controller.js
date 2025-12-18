import CustomerOrder from "../models/customerOrder.model.js";
import Order from "../models/orders.model.js"; // Import model đơn hàng của Admin
import User from "../models/user.model.js";

// Tạo đơn hàng mới (Có logic gộp đơn)
export const createOrder = async (req, res) => {
  try {
    const { products, totalAmount, note } = req.body;
    const user = req.user;

    // Validate
    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // 1. Kiểm tra xem user này có đơn hàng nào đang CHỜ XỬ LÝ (Pending) không
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

    // 2. Nếu không có đơn Pending -> Tạo đơn mới hoàn toàn như bình thường
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

// Cập nhật trạng thái đơn hàng (Đã xử lý) & Tự động tạo đơn Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Cập nhật trạng thái đơn CustomerOrder
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
        // Chuẩn bị danh sách items theo format của Order Model
        const orderItems = customerOrder.products.map(p => ({
            productId: p.product, // ID sản phẩm
            size: p.size,
            quantity: p.quantity,
            price: p.price
        }));

        // Tạo đơn hàng mới trong collection 'Order'
        await Order.create({
            customerId: customerOrder.user, // Link tới user gốc
            customerName: customerOrder.customerInfo.name,
            address: customerOrder.customerInfo.address,
            phone: customerOrder.customerInfo.phone,
            items: orderItems,
            total: customerOrder.totalAmount,
            status: "chưa giao", // Trạng thái mặc định bạn yêu cầu
            receivedDate: null,
            deliverDate: null,
            paymentMethod: "COD", // Mặc định là COD vì đơn khách đặt thường là COD
            createdBy: req.user._id // Ghi nhận Admin nào đã xác nhận (người đang login)
        });
    }

    res.json(customerOrder);
  } catch (error) {
    console.error("Lỗi update status:", error);
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