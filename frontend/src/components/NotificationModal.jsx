import { useEffect } from 'react';

const NotificationModal = ({ isOpen, onClose, type = 'success', title, message, duration = 3000 }) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      icon: '✓',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50'
    },
    error: {
      icon: '✗',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-50'
    },
    info: {
      icon: 'ℹ',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50'
    },
    warning: {
      icon: '⚠',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-50'
    }
  };

  const styles = typeStyles[type] || typeStyles.success;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className={`${styles.bgColor} border-2 ${styles.borderColor} rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all animate-slideDown`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${styles.iconBg}`}>
            <span className={`text-xl font-bold ${styles.iconColor}`}>{styles.icon}</span>
          </div>
          <div className="ml-4 flex-1">
            {title && (
              <h3 className={`text-lg font-semibold ${styles.iconColor} mb-1`}>{title}</h3>
            )}
            <p className="text-sm text-gray-700">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

