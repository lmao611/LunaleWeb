const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-[9999] pointer-events-auto">
      <div className="relative">
        <div className="w-20 h-20 border-2 border-gray-300 rounded-full" />
        <div className="w-20 h-20 border-t-2 border-blue-800 animate-spin rounded-full absolute left-0 top-0" />
        <div className="sr-only">Loading</div>
      </div>
    </div>
  );
};

export const SmallImageSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
    <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

export default LoadingSpinner;
