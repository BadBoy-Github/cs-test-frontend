import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import NotAuthorized from './NotAuthorized';
import Loader from '../components/Loader';

const ADMIN_STRING = import.meta.env.VITE_ADMIN_STRING;

const AdminTestResults = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Code Scapex Test | Test Results";
  }, []);

   useEffect(() => {
     if (user && user.role === ADMIN_STRING) {
       fetchTests();
     } else {
       setLoading(false);
     }
   }, [user]);

  const fetchTests = async () => {
    try {
      const res = await API.get('/admin/tests');
      setTests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForTest = async (testId) => {
    try {
      const res = await API.get(`/admin/test-results/${testId}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || user.role !== ADMIN_STRING) {
    return <NotAuthorized />;
  }

  if (loading) return <Loader message="Loading test results..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
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
        {!selectedTest ? (
          tests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tests created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => (
                <div
                  key={test._id}
                  className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg"
                  onClick={() => {
                    setSelectedTest(test);
                    fetchStudentsForTest(test._id);
                  }}
                >
                  <h3 className="text-xl font-semibold">{test.title}</h3>
                  <p className="text-gray-600">{test.description}</p>
                </div>
              ))}
            </div>
          )
        ) : (
          <div>
            <button
              onClick={() => setSelectedTest(null)}
              className="mb-4 bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to Tests
            </button>
            <h2 className="text-2xl font-bold mb-4">
              {selectedTest.title} - Results
            </h2>
            {students.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No students have attempted this test yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {students
                  .sort((a, b) => b.latestScore - a.latestScore) // Sort by latest score desc
                  .map((student) => (
                    <div
                      key={student._id}
                      className="bg-white p-4 rounded-lg shadow"
                    >
                      <h3 className="text-lg font-semibold">
                        {student.name} ({student.email})
                      </h3>
                      <p>Latest Score: {student.latestScore}</p>
                      <div className="mt-2 space-y-2">
                        {student.attempts.map((attempt) => (
                          <div
                            key={attempt._id}
                            className="bg-gray-100 p-4 rounded cursor-pointer hover:bg-gray-200"
                            onClick={() =>
                              navigate(`/admin/attempt/${attempt._id}`)
                            }
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">
                                  Attempt #{attempt.number}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Completed on:{" "}
                                  {new Date(
                                    attempt.endTime,
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    attempt.endTime,
                                  ).toLocaleTimeString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-indigo-600">
                                  {attempt.score} points
                                </p>
                                <p className="text-sm text-gray-500">
                                  Time taken:{" "}
                                  {attempt.totalTime
                                    ? `${Math.floor(attempt.totalTime)}:${Math.round(
                                        (attempt.totalTime % 1) * 60,
                                      )
                                        .toString()
                                        .padStart(2, "0")}`
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminTestResults;