import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import NotAuthorized from './NotAuthorized';
import Loader from '../components/Loader';
import ImageZoomModal from '../components/ImageZoomModal';

const ADMIN_STRING = import.meta.env.VITE_ADMIN_STRING;

const AdminAttemptDetail = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState(null);

  const fetchAttempt = async () => {
    try {
      // Need a new endpoint to get attempt by id for admin
      const res = await API.get(`/admin/attempt/${attemptId}`);
      setAttempt(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Code Scapex Test | Attempt Details";
  }, []);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  if (!user || user.role !== ADMIN_STRING) {
    return <NotAuthorized />;
  }

  if (loading) return <Loader message="Loading attempt details..." />;
  if (!attempt) return <div>Attempt not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">{attempt.testId.title} - Attempt by {attempt.userId.name}</h1>
            <button onClick={() => navigate(-1)} className="text-emerald-600 hover:text-emerald-900">Back</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Attempt Details</h2>
              <p className="text-sm text-gray-600">
                Completed on: {new Date(attempt.endTime).toLocaleDateString()} at {new Date(attempt.endTime).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">{attempt.score} points</p>
              <p className="text-sm text-gray-500">
                Time taken: {attempt.totalTime ? `${Math.floor(attempt.totalTime)}:${Math.round((attempt.totalTime % 1) * 60).toString().padStart(2, '0')}` : 'N/A'}
              </p>
            </div>
          </div>

          {attempt.testId.showResults ? (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Results</h3>
              <div className="space-y-4">
                {attempt.answers && attempt.answers.map((answer, index) => {
                  const question = answer.questionId;
                  const pointsColor = answer.marksObtained === question.marks ? 'text-green-600' : answer.marksObtained > 0 ? 'text-yellow-600' : 'text-red-600';
                  
                  return (
                    <div key={answer._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                       {/* Question Header */}
                       <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                         <div className="flex justify-between items-start">
                           <div className="flex-1">
                             <h4 className="text-lg font-semibold text-gray-900">
                               Question {index + 1}: {question.questionText}
                             </h4>
                              {question.imageUrl && (
                                <div
                                  className="mt-2 mb-3 cursor-zoom-in"
                                  onClick={() => setZoomedImage(question.imageUrl)}
                                >
                                  <img
                                    src={question.imageUrl}
                                    alt="Question image"
                                    className="max-w-md max-h-64 object-contain border rounded shadow-sm hover:shadow-md transition-shadow"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                             <p className="text-sm text-gray-500">
                               {question.type.toUpperCase()} • {question.marks} mark{question.marks !== 1 ? 's' : ''}
                             </p>
                           </div>
                           <div className={`text-lg font-bold ${pointsColor} ml-4`}>
                             {answer.marksObtained}/{question.marks}
                           </div>
                         </div>
                       </div>

                      {/* Question Body */}
                      <div className="p-6">
                        {/* MCQ Options Display */}
                        {(question.type === 'mcq' || question.type === 'checkbox') && question.options && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => {
                                const isCorrectOption = question.correctAnswer && question.correctAnswer.includes(option);
                                const isUserAnswer = answer.userAnswer && (Array.isArray(answer.userAnswer) ? answer.userAnswer.includes(option) : answer.userAnswer === option);
                                
                   return (
                     <div
                       key={question._id}
                       className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                     >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start space-x-3">
                                        <span className="text-sm font-medium text-gray-600 w-6">
                                          {String.fromCharCode(65 + optIndex)}.
                                        </span>
                                        <span className="text-gray-800">{option}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {isCorrectOption && (
                                          <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                                        )}
                                        {isUserAnswer && !isCorrectOption && (
                                          <span className="text-red-600 text-sm font-medium">✗ Student's Answer</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Student's Answer */}
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Student's Answer:</p>
                          <div className={`p-3 rounded-md border ${
                            answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}>
                            <p className={`font-medium ${answer.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {Array.isArray(answer.userAnswer)
                                ? answer.userAnswer.join(', ') || 'Not answered'
                                : (answer.userAnswer || 'Not answered')}
                            </p>
                          </div>
                        </div>

                        {/* Correct Answer (if wrong) */}
                        {!answer.isCorrect && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Correct Answer:</p>
                            <div className="p-3 rounded-md border bg-green-50 border-green-200">
                              <p className="font-medium text-green-700">
                                {Array.isArray(question.correctAnswer)
                                  ? question.correctAnswer.join(', ')
                                  : question.correctAnswer}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Explanation */}
                        {question.explanation && (
                          <div className="mt-4 p-4 bg-emerald-50 rounded-md border border-emerald-200">
                            <p className="text-sm font-medium text-emerald-900 mb-1">Explanation:</p>
                            <p className="text-sm text-emerald-800">{question.explanation}</p>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="mt-4 flex justify-between items-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            answer.isCorrect
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-yellow-50 rounded">
              <p className="text-yellow-800">
                Detailed results are not released yet.
              </p>
            </div>
          )}
        </div>
      </main>
      <ImageZoomModal
        imageUrl={zoomedImage}
        isOpen={!!zoomedImage}
        onClose={() => setZoomedImage(null)}
      />
    </div>
  );
};

export default AdminAttemptDetail;