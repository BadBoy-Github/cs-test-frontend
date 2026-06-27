import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'info',
  isPrompt = false,
  defaultValue = '',
  onInputChange
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  if (!isOpen) return null;

  const getButtonStyles = (buttonType) => {
    switch (buttonType) {
      case 'cancel':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'update':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'confirm':
      case 'save':
      case 'create':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const handleConfirm = () => {
    if (isPrompt && onConfirm) {
      onConfirm(inputValue);
    } else if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-sm font-bold"
          >
            ×
          </button>
        </div>
        <p className="text-gray-700 mb-4">{message}</p>

        {isPrompt && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (onInputChange) onInputChange(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-4"
            placeholder="Enter your response..."
          />
        )}

        <div className="flex justify-end space-x-3">
          {onConfirm && (
            <>
              <button
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  }
                  onClose();
                }}
                className={`px-4 py-2 rounded ${getButtonStyles('cancel')}`}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded ${getButtonStyles(type)}`}
              >
                {confirmText}
              </button>
            </>
          )}
          {!onConfirm && (
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded ${getButtonStyles('confirm')}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for using modal
export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    type: 'info',
    isPrompt: false,
    defaultValue: '',
    onInputChange: null
  });

  const showModal = (config) => {
    setModalState({
      isOpen: true,
      title: config.title || 'Alert',
      message: config.message || '',
      onConfirm: config.onConfirm || null,
      onCancel: config.onCancel || null,
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Cancel',
      type: config.type || 'info',
      isPrompt: config.isPrompt || false,
      defaultValue: config.defaultValue || '',
      onInputChange: config.onInputChange || null
    });
  };

  const alert = (message, title = 'Alert') => {
    return new Promise((resolve) => {
      showModal({
        title,
        message,
        onConfirm: () => resolve(true),
        confirmText: 'OK',
        type: 'confirm'
      });
    });
  };

  const confirm = (message, title = 'Confirm') => {
    return new Promise((resolve) => {
      showModal({
        title,
        message,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        cancelText: 'Cancel',
        confirmText: 'OK',
        type: 'confirm'
      });
    });
  };

  const prompt = (message, defaultValue = '', title = 'Prompt') => {
    return new Promise((resolve) => {
      let inputValue = defaultValue;
      showModal({
        title,
        message,
        isPrompt: true,
        defaultValue,
        onInputChange: (value) => { inputValue = value; },
        onConfirm: () => resolve(inputValue),
        cancelText: 'Cancel',
        confirmText: 'OK',
        type: 'confirm'
      });
    });
  };

  const hideModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    modal: <Modal {...modalState} onClose={hideModal} />,
    showModal,
    hideModal,
    alert,
    confirm,
    prompt
  };
};

export default Modal;