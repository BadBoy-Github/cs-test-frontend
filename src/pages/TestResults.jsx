import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import Loader from '../components/Loader';

const TestResults = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [testSummaries, setTestSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    try {
      const res = await API.get('/attempts/results');

      // Group results by test and create summaries
      const testMap = {};
      res.data.forEach(result => {
        const testId = result.testId._id;
        if (!testMap[testId]) {
          testMap[testId] = {
            testId: testId,
            testName: result.testId.title,
            totalMarks: result.testId.totalMarks,
            createdAt: result.testId.createdAt, // store test creation date for sorting
            attempts: [],
            bestScore: 0,
            latestAttemptDate: null
          };
        }

        testMap[testId].attempts.push(result);
        testMap[testId].bestScore = Math.max(testMap[testId].bestScore, result.score);

        const attemptDate = new Date(result.endTime);
        if (!testMap[testId].latestAttemptDate || attemptDate > testMap[testId].latestAttemptDate) {
          testMap[testId].latestAttemptDate = attemptDate;
        }
      });

      // Convert to array and sort by test creation date DESC (newest first)
      const summaries = Object.values(testMap)
        .map(summary => ({
          ...summary,
          latestAttemptDate: summary.latestAttemptDate.toLocaleDateString(),
          attemptsCount: summary.attempts.length
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTestSummaries(summaries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Code Scapex Test | Results";
  }, []);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  if (authLoading) return <Loader message="Loading results..." />;
  if (!user) return <div>Please login to view results</div>;

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
        {testSummaries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No completed tests yet.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              My Test Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testSummaries.map((summary) => (
                <div
                  key={summary.testId}
                  className="bg-white p-6 rounded-lg shadow card-hover cursor-pointer"
                  onClick={() => navigate(`/results/${summary.testId}`)}
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {summary.testName}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Attempts: {summary.attemptsCount}</p>
                    <p>
                      Best Score:{" "}
                      <span
                        className={`font-medium ${
                          summary.bestScore >= summary.totalMarks * 0.8
                            ? "text-green-600"
                            : summary.bestScore >= summary.totalMarks * 0.6
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {summary.bestScore}/{summary.totalMarks} points
                      </span>
                    </p>
                    <p>Last Attempt: {summary.latestAttemptDate}</p>
                  </div>
                  <div className="mt-4 text-indigo-600 font-medium">
                    View Details →
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TestResults;