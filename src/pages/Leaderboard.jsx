import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import Loader from '../components/Loader';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { FaTrophy, FaMedal, FaAward, FaClock } from 'react-icons/fa';

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState('all');
  const [tests, setTests] = useState([]);

  useEffect(() => {
    document.title = "Code Scapex Test | Leaderboard";
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedTest]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, leaderboardRes] = await Promise.all([
        API.get('/tests'),
        selectedTest === 'all' ? API.get('/attempts/leaderboard') : API.get(`/attempts/leaderboard/${selectedTest}`)
      ]);
      setTests(testsRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <FaTrophy className="text-yellow-500" />;
    if (rank === 2) return <FaMedal className="text-gray-400" />;
    if (rank === 3) return <FaAward className="text-orange-600" />;
    return <span className="text-gray-500 font-bold">{rank}</span>;
  };

  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader message="Loading..." /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Leaderboards</h1>
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
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Tests</option>
            {tests.map((test) => (
              <option key={test._id} value={test._id}>
                {test.title}
              </option>
            ))}
          </select>
        </div>
        </div>

        {loading ? (
          <Loader message="Loading leaderboard..." />
        ) : leaderboard.length === 0 ? (
          <EmptyState
            title="No leaderboard data"
            description="Complete tests to appear on the leaderboard."
            icon={FaTrophy}
          />
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Rank
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Student
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Score
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Tests Taken
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Best Time
                   </th>
                 </tr>
               </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                 {leaderboard.map((entry, index) => {
                   const rank = index + 1;
                   const isCurrentUser = entry.userId?._id === user._id;
                   // Format bestTime (seconds) to mm:ss
                   const formatTime = (seconds) => {
                     if (seconds == null || seconds === 0) return '—';
                     const mins = Math.floor(seconds / 60);
                     const secs = Math.floor(seconds % 60);
                     return `${mins}:${secs.toString().padStart(2, '0')}`;
                   };
                   return (
                     <tr
                       key={entry.userId?._id || index}
                       className={`${isCurrentUser ? "bg-indigo-50" : ""} hover:bg-gray-50 transition-colors`}
                     >
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center justify-center w-10 h-10">
                           {getRankIcon(rank)}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center space-x-3">
                           <Avatar
                             name={entry.userId?.name || "Anonymous"}
                             size="sm"
                           />
                           <div>
                             <div
                               className={`font-medium ${isCurrentUser ? "text-indigo-700" : "text-gray-900"}`}
                             >
                               {entry.userId?.name || "Anonymous"}
                             </div>
                             {isCurrentUser && (
                               <span className="text-xs text-indigo-600">
                                 (You)
                               </span>
                             )}
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span
                           className={`font-bold text-lg ${
                             entry.averageScore >= 80
                               ? "text-green-600"
                               : entry.averageScore >= 50
                                 ? "text-yellow-600"
                                 : "text-red-600"
                           }`}
                         >
                           {Math.round(entry.averageScore)}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                         {entry.testsTaken}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                         <span className="flex items-center">
                           <FaClock className="mr-1 text-gray-400" />
                           {formatTime(entry.bestTime)}
                         </span>
                       </td>
                     </tr>
                   );
                 })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;