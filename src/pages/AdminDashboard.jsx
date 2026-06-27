import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaPoll, FaUsers } from 'react-icons/fa';
import API from '../utils/api';
import { useModal } from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import NotAuthorized from './NotAuthorized';

const ADMIN_STRING = import.meta.env.VITE_ADMIN_STRING;

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { modal, showModal } = useModal();

  useEffect(() => {
    document.title = "Code Scapex Test | Create Test";
  }, []);

  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: 60,
    passingScore: 50,
    negativeMarking: false,
    negativeMarkingValue: 0,
    maxAttempts: 1
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTestData({
      ...testData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    });
  };

  if (!user || user.role !== ADMIN_STRING) {
    return <NotAuthorized />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testData.title.trim()) {
      showModal({
        title: 'Validation Error',
        message: 'Test title is required.',
        type: 'confirm'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await API.post('/tests', testData);
      showModal({
        title: 'Success',
        message: 'Test created successfully!',
        onConfirm: () => navigate('/admin/tests'),
        confirmText: 'Go to Manage Tests',
        type: 'confirm'
      });
    } catch (err) {
      console.error(err);
      showModal({
        title: 'Error',
        message: 'Failed to create test. Please try again.',
        type: 'confirm'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex space-x-4">
              <button onClick={() => navigate('/dashboard')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">Back to Dashboard</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Test</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Test Title</label>
              <input
                type="text"
                name="title"
                value={testData.title}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={testData.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={testData.duration}
                  onChange={handleInputChange}
                  min="1"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Passing Score (%)</label>
                <input
                  type="number"
                  name="passingScore"
                  value={testData.passingScore}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Attempts</label>
                <input
                  type="number"
                  name="maxAttempts"
                  value={testData.maxAttempts}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="negativeMarking"
                checked={testData.negativeMarking}
                onChange={handleInputChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Enable Negative Marking</label>
            </div>

            {testData.negativeMarking && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Negative Marking Value (per wrong answer)</label>
                <input
                  type="number"
                  name="negativeMarkingValue"
                  value={testData.negativeMarkingValue}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isSubmitting ? 'Creating...' : 'Create Test'}</span>
              </button>
            </div>
          </form>
        </div>

        
      </main>
      {modal}
    </div>
  );
};

export default AdminDashboard;