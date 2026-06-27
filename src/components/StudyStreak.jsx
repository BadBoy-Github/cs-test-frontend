import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { FaFire, FaCalendarDay } from 'react-icons/fa';

const StudyStreak = () => {
  const { user } = useContext(AuthContext);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      if (user) {
        try {
          const res = await API.get('/users/streak');
          setStreak(res.data.streak || 0);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchStreak();
  }, [user]);

  if (loading || !user) return null;

  const getStreakMessage = () => {
    if (streak === 0) return "Start your streak today!";
    if (streak === 1) return "Great start! Keep going!";
    if (streak < 7) return "Building momentum!";
    if (streak < 30) return "On fire! 🔥";
    return "Incredible consistency! 🏆";
  };

  return (
    <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <FaFire className="text-2xl" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{streak} Day Streak</h3>
            <p className="text-sm opacity-90">{getStreakMessage()}</p>
          </div>
        </div>
        <FaCalendarDay className="text-3xl opacity-20" />
      </div>
      <div className="mt-3 flex space-x-1">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded ${
              i < streak % 7 ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default StudyStreak;