const LoadingSpinner = () => {
  return (
    // Giảm z-index xuống 50 để không che mất các công cụ debug (như Eruda) nếu có
    <div className="fixed inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-50 pointer-events-auto">
      <div className="relative flex flex-col items-center">
        {/* Vòng tròn xoay */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
          <div className="w-16 h-16 border-t-4 border-blue-600 animate-spin rounded-full absolute left-0 top-0" />
        </div>
        
        {/* Thêm dòng chữ này */}
        <p className="mt-4 text-gray-500 font-medium text-sm animate-pulse">
          Đang kết nối đến server...
        </p>
      </div>
    </div>
  );
};

export const SmallImageSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
    <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

export default LoadingSpinner;