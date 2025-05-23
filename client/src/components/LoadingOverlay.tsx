interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "読み込み中..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl flex items-center space-x-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="text-gray-700 font-medium">{message}</span>
      </div>
    </div>
  );
}
