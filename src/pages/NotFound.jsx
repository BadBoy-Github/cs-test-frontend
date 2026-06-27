import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const NotFound = () => {
  useEffect(() => {
    document.title = "Code Scapex Test | Page Not Found";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
        <p className="text-gray-500 mt-2">The page you are looking for doesn't exist.</p>
        <Link to="/dashboard" className="mt-6 inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;