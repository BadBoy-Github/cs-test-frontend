import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { FaPlus, FaList, FaChartBar, FaUsers, FaPoll, FaTrophy } from 'react-icons/fa';
import Loader from '../components/Loader';
import StudyStreak from '../components/StudyStreak';
import EmptyState from '../components/EmptyState';

const ADMIN_STRING = import.meta.env.VITE_ADMIN_STRING;

const Dashboard = () => {
  const { user, logout, getSessionTimeRemaining, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [userAttempts, setUserAttempts] = useState({});
  const [sessionTime, setSessionTime] = useState(null);

  const fetchTests = async () => {
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        API.get('/tests'),
        API.get('/attempts/results')
      ]);

      setTests(testsRes.data);

      const attemptsMap = {};
      attemptsRes.data.forEach(result => {
        const testId = result.testId._id;
        if (!attemptsMap[testId]) {
          attemptsMap[testId] = 0;
        }
        attemptsMap[testId]++;
      });
      setUserAttempts(attemptsMap);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    document.title = "Code Scapex Test | Dashboard";
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    if (!loading && user) fetchTests();

    const updateSessionTime = () => {
      const remaining = getSessionTimeRemaining();
      setSessionTime(remaining);
    };

    updateSessionTime();
    const interval = setInterval(updateSessionTime, 1000);

    return () => clearInterval(interval);
  }, [user, loading, navigate, getSessionTimeRemaining]);

  if (loading) return <Loader />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Code Scapex Test Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              {sessionTime && (
                <span className="text-sm text-gray-500">
                  Session expires in: {sessionTime.hours}:
                  {sessionTime.minutes.toString().padStart(2, "0")}:
                  {sessionTime.seconds.toString().padStart(2, "0")}
                </span>
              )}
<button
                 onClick={logout}
                 className="text-emerald-600 hover:text-emerald-900"
               >
                 Logout
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user.role === ADMIN_STRING ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow card-hover">
              <FaPlus className="text-3xl text-emerald-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Create Test</h3>
              <p className="text-gray-500">Add new tests and questions</p>
              <button
                onClick={() => navigate("/admin/create-test")}
                className="mt-4 btn-gradient-primary"
              >
                Create
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow card-hover">
              <FaList className="text-3xl text-green-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Manage Tests
              </h3>
              <p className="text-gray-500">Edit and view existing tests</p>
              <button
                onClick={() => navigate("/admin/tests")}
                className="mt-4 btn-gradient-primary"
              >
                Manage
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow card-hover">
              <FaPoll className="text-3xl text-emerald-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Test Results
              </h3>
              <p className="text-gray-500">View test results and statistics</p>
              <button
                onClick={() => navigate("/admin/test-results")}
                className="mt-4 btn-gradient-primary"
              >
                View
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow card-hover">
              <FaUsers className="text-3xl text-purple-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                View Students
              </h3>
              <p className="text-gray-500">Manage student details</p>
              <button
                onClick={() => navigate("/admin/students")}
                className="mt-4 btn-gradient-primary"
              >
                View
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow card-hover">
              <FaChartBar className="text-3xl text-emerald-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
              <p className="text-gray-500">View student and test analytics</p>
              <button
                onClick={() => navigate("/admin/analytics")}
                className="mt-4 btn-gradient-primary"
              >
                View
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow card-hover">
              <FaTrophy className="text-3xl text-yellow-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Leadership</h3>
              <p className="text-gray-500">View leaderboards and rankings</p>
              <button
                onClick={() => navigate("/leaderboard")}
                className="mt-4 btn-gradient-primary"
              >
                View
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <button
                  onClick={() => navigate("/results")}
                  className="btn-gradient-primary mr-4"
                >
                  View My Results
                </button>
                <button
                  onClick={() => navigate("/leaderboard")}
                  className="btn-gradient-primary"
                >
                  <FaTrophy className="inline mr-1" />
                  Leaderboard
                </button>
              </div>
              <StudyStreak />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Available Tests
            </h2>
            {tests.length === 0 ? (
              <EmptyState
                title="No tests available"
                description="Check back later for new tests."
                icon={FaPoll}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => {
                  const userAttemptCount = userAttempts[test._id] || 0;
                  const hasCompleted = userAttemptCount >= test.maxAttempts;

                  return (
                    <div
                      key={test._id}
                      className="bg-white p-6 rounded-lg shadow card-hover"
                    >
                      <h3 className="text-xl font-semibold text-gray-900">
                        {test.title}
                      </h3>
                      <p className="text-gray-600 mt-2">{test.description}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Duration: {test.duration} minutes
                      </p>
                      <p className="text-sm text-gray-500">
                        Attempts: {userAttemptCount}/{test.maxAttempts}
                      </p>
                      {hasCompleted ? (
                        <div className="mt-4 px-4 py-2 bg-green-100 text-green-800 rounded text-center font-medium">
                          Completed
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/test/${test._id}`)}
                          className="mt-4 btn-gradient-primary w-full"
                        >
                          Start Test
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;