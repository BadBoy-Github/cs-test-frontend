import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const ImageZoomModal = ({ imageUrl, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl"
        onClick={onClose}
      >
        <FaTimes />
      </button>
      <div
        className="max-w-5xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Full screen question"
          className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default ImageZoomModal;
