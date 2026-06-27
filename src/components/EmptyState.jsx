import { FaInbox, FaChartLine, FaUsers, FaClipboard, FaExclamationCircle } from 'react-icons/fa';

const EmptyState = ({ 
  title = 'No data found', 
  description = 'There is no data to display.', 
  icon: Icon = FaInbox,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="text-4xl text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-gradient-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const EmptyStateWithIllustration = ({ illustration, title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-6xl">{illustration || '📊'}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-4 btn-gradient-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;