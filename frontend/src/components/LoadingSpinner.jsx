const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="relative">
        {/* Vòng nền nhạt */}
        <div className="w-20 h-20 border-2 border-gray-300 rounded-full" />
        {/* Vòng quay chính */}
        <div className="w-20 h-20 border-t-2 border-blue-800 animate-spin rounded-full absolute left-0 top-0" />
        <div className="sr-only">Loading</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
