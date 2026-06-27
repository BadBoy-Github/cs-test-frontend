import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import NotAuthorized from './NotAuthorized';
import Loader from '../components/Loader';
import { FaClock } from 'react-icons/fa';

const ADMIN_STRING = import.meta.env.VITE_ADMIN_STRING;

const AdminAnalytics = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await API.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Code Scapex Test | Analytics";
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (!user || user.role !== ADMIN_STRING) {
    return <NotAuthorized />;
  }

  if (loading) return <Loader message="Loading analytics..." />;

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors "
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">No analytics data available.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors "
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Overview Cards */}
          <Link
            to="/admin/students"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 block"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Students
            </h3>
            <p className="text-3xl font-bold text-indigo-600">
              {analytics.totalStudents}
            </p>
          </Link>

          <Link
            to="/admin/tests"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 block"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Tests
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {analytics.totalTests}
            </p>
          </Link>
        </div>

         {/* Top Students */}
         <div className="bg-white p-6 rounded-lg shadow mb-6">
           <h3 className="text-xl font-semibold text-gray-900 mb-4">
             Top 3 Students by Average Score
           </h3>
           {analytics.topStudents.length > 0 ? (
             <div className="space-y-4">
               {analytics.topStudents.map((student, index) => {
                 // Format best time
                 const formatTime = (seconds) => {
                   if (seconds == null || seconds === 0) return 'No time data';
                   const mins = Math.floor(seconds / 60);
                   const secs = Math.floor(seconds % 60);
                   return `${mins}:${secs.toString().padStart(2, '0')}`;
                 };
                 return (
                   <div
                     key={student._id}
                     className="flex items-center justify-between p-4 bg-gray-50 rounded"
                   >
                     <div className="flex items-center space-x-4">
                       <div
                         className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                           index === 0
                             ? "bg-yellow-500"
                             : index === 1
                               ? "bg-gray-400"
                               : "bg-orange-500"
                         }`}
                       >
                         {index + 1}
                       </div>
                       <div>
                         <p className="font-semibold text-gray-900">
                           {student.name}
                         </p>
                         <p className="text-sm text-gray-600">{student.email}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-2xl font-bold text-indigo-600">
                         {student.averageScore.toFixed(1)}
                       </p>
                       <p className="text-sm text-gray-500">
                         {student.totalAttempts} attempt{student.totalAttempts !== 1 ? 's' : ''}
                         {student.bestTime != null && (
                           <span className="ml-2 flex items-center justify-end text-gray-400">
                             <FaClock className="inline mr-1" />
                             {formatTime(student.bestTime)}
                           </span>
                         )}
                       </p>
                     </div>
                   </div>
                 );
               })}
             </div>
           ) : (
             <p className="text-gray-500">No student data available.</p>
           )}
         </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;