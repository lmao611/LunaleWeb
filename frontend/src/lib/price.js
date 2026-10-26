/**
 * Giá bán thực tế của một sản phẩm: áp dụng % khuyến mãi giống
 * ProductPage / AddToCartModal, để giỏ hàng và đơn hàng luôn khớp nhau.
 */
export const getUnitPrice = (item) => {
  const base = Number(item?.price) || 0;
  const percent = item?.isSale
    ? Math.min(Math.max(Number(item?.salePercentage) || 0, 0), 100)
    : 0;
  return Math.round(base * (1 - percent / 100));
};

export const formatVND = (value) =>
  `${Math.round(Number(value) || 0).toLocaleString("vi-VN")} ₫`;
