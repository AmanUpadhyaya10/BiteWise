interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-[#22C55E] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-[#22C55E]/30 hover:bg-[#1ea34d] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
