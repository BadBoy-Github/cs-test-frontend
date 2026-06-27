import { Link } from 'react-router-dom';

const NotAuthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">403</h1>
        <p className="text-xl text-gray-600 mt-4">Not Authorized</p>
        <p className="text-gray-500 mt-2">You don't have permission to access this page.</p>
        <Link to="/dashboard" className="mt-6 inline-block bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotAuthorized;