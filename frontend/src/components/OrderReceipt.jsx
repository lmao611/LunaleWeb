import React from "react";

const OrderReceipt = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 p-8 font-sans">
      <div className="max-w-3xl mx-auto border border-gray-300 rounded-xl shadow-sm p-8 relative">
        <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          Đơn Đặt Hàng
        </h2>

        <div className="mb-6">
          <p className="text-lg">
            <strong>Khách Hàng :</strong> Chị Thu
          </p>
          <div className="flex justify-between text-sm mt-2">
            <p>
              <strong>Ngày Nhận Đơn:</strong> 24/06/2025
            </p>
            <p>
              <strong>Ngày giao hàng (dự tính):</strong> 25/06/2025
            </p>
          </div>
          <p className="text-sm mt-1">
            <strong>Điều khoản:</strong> Giao hàng thu COD
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm mb-8">
          <div>
            <p className="font-semibold">Nhà cung cấp</p>
            <p className="text-blue-700 font-medium">Lunale</p>
            <a
              href="https://www.instagram.com/lunale.vn/"
              className="text-blue-500 underline"
            >
              https://www.instagram.com/lunale.vn/
            </a>
            <p>Gò Vấp, Hồ Chí Minh City</p>
          </div>
          <div>
            <p className="font-semibold">Giao hàng đến</p>
            <p>
              <strong>Khách hàng:</strong> Chị Thu
            </p>
            <p>
              <strong>Địa chỉ:</strong> Hẻm C2/12s 15 Bình Hưng, Bình Chánh
            </p>
            <p>
              <strong>Điện thoại:</strong> 0902293039
            </p>
          </div>
        </div>

        <table className="w-full border border-gray-300 text-sm mb-8">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border px-3 py-2 text-left">Tên Sản Phẩm</th>
              <th className="border px-3 py-2">Size</th>
              <th className="border px-3 py-2">Số lượng</th>
              <th className="border px-3 py-2">Đơn giá</th>
              <th className="border px-3 py-2 text-red-600">Sale 8%</th>
              <th className="border px-3 py-2">Tổng giá</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              <td className="border px-3 py-2 text-left">EMMA DRESS</td>
              <td className="border px-3 py-2">L</td>
              <td className="border px-3 py-2">1</td>
              <td className="border px-3 py-2">865.000 đ</td>
              <td className="border px-3 py-2 text-red-600">795.000 đ</td>
              <td className="border px-3 py-2">795.000 đ</td>
            </tr>
          </tbody>
        </table>

        <div className="text-right text-sm space-y-1">
          <p>
            <strong>Thành tiền:</strong> 795.000 đ
          </p>
          <p>
            <strong>Phí ship:</strong> 25.000 đ
          </p>
          <p className="text-lg font-bold text-pink-600">Tổng cộng: 820.000 đ</p>
        </div>

        <img
          src="/lunale.png"
          alt="Lunale logo"
          className="w-32 absolute bottom-4 left-4 opacity-80"
        />
      </div>
    </div>
  );
};

export default OrderReceipt;
