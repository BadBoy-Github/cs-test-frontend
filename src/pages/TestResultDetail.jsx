import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import Loader from '../components/Loader';
import Confetti from '../components/Confetti';
import ImageZoomModal from '../components/ImageZoomModal';

const TestResultDetail = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

   const fetchResults = async () => {
     try {
       const res = await API.get('/attempts/results');

       // Filter results for this specific test and sort by date
       const testResults = res.data
         .filter(result => result.testId._id === testId)
         .sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
       setResults(testResults);

        // Check for first-attempt pass (show confetti)
        if (testResults.length > 0) {
          const firstAttempt = testResults[0];
          const passingScorePercentage = testResults[0].testId.passingScore || 50;
          const passingScore = (testResults[0].testId.totalMarks * passingScorePercentage) / 100;
          if (firstAttempt.score >= passingScore && firstAttempt.isFirstAttempt) {
            setShowConfetti(true);
          }
        }
     } catch (err) {
       console.error(err);
     } finally {
       setLoading(false);
     }
   };

  useEffect(() => {
    document.title = "Code Scapex Test | Test Results";
  }, []);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user, testId]);

  if (authLoading || loading) return <Loader message="Loading detailed results..." />;
  if (!user) return <div>Please login to view results</div>;

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
              <a href="/results" className="text-emerald-600 hover:text-emerald-900">Back to Results</a>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">No results found for this test.</p>
          </div>
        </main>
      </div>
    );
  }

  const testTitle = results[0].testId.title;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {testTitle} - Results
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
        <div className="space-y-6">
          {results.map((result) => (
            <div key={result._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Attempt #{results.indexOf(result) + 1}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Completed on:{" "}
                    {new Date(result.endTime).toLocaleDateString()} at{" "}
                    {new Date(result.endTime).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-2xl font-bold ${
                      result.score >= result.testId.totalMarks * 0.8
                        ? "text-green-600"
                        : result.score >= result.testId.totalMarks * 0.6
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {result.score}/{result.testId.totalMarks} points
                  </p>
                  <p className="text-sm text-gray-500">
                    Time taken:{" "}
                    {result.totalTime
                      ? `${Math.floor(result.totalTime)}:${Math.round(
                          (result.totalTime % 1) * 60,
                        )
                          .toString()
                          .padStart(2, "0")}`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {result.testId.showResults ? (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Detailed Results
                  </h3>
                  <div className="space-y-4">
                    {result.answers.map((answer, index) => {
                      const question = answer.questionId;
                      const pointsColor =
                        answer.marksObtained === question.marks
                          ? "text-green-600"
                          : answer.marksObtained > 0
                            ? "text-yellow-600"
                            : "text-red-600";

                      return (
                        <div
                          key={question._id}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                        >
                          {/* Question Header */}
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 break-words whitespace-normal">
                                  Question {index + 1}: {question.questionText}
                                </h4>
                                {question.imageUrl && (
                                  <div
                                    className="mt-2 mb-3 cursor-zoom-in"
                                    onClick={() =>
                                      setZoomedImage(question.imageUrl)
                                    }
                                  >
                                    <img
                                      src={question.imageUrl}
                                      alt="Question image"
                                      className="max-w-md max-h-64 object-contain border rounded shadow-sm hover:shadow-md transition-shadow"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  </div>
                                )}
                                <p className="text-sm text-gray-500">
                                  {question.type.toUpperCase()} •{" "}
                                  {question.marks} mark
                                  {question.marks !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div
                                className={`text-lg font-bold ${pointsColor} ml-4`}
                              >
                                {answer.marksObtained}/{question.marks}
                              </div>
                            </div>
                          </div>

                          {/* Question Body */}
                          <div className="p-6">
                            {/* MCQ Options Display */}
                            {(question.type === "mcq" ||
                              question.type === "checkbox") &&
                              question.options && (
                                <div className="mb-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    Options:
                                  </p>
                                  <div className="space-y-2">
                                    {question.options.map(
                                      (option, optIndex) => {
                                        const isCorrectOption =
                                          question.correctAnswer &&
                                          question.correctAnswer.includes(
                                            option,
                                          );
                                        const isUserAnswer =
                                          answer.userAnswer &&
                                          (Array.isArray(answer.userAnswer)
                                            ? answer.userAnswer.includes(option)
                                            : answer.userAnswer === option);

                                        return (
                                          <div
                                            key={optIndex}
                                            className={`p-3 rounded-md border ${
                                              isCorrectOption
                                                ? "bg-green-50 border-green-200"
                                                : isUserAnswer &&
                                                    !isCorrectOption
                                                  ? "bg-red-50 border-red-200"
                                                  : "bg-gray-50 border-gray-200"
                                            }`}
                                          >
                                            <div className="flex items-start gap-3">
                                              <span className="text-sm font-medium text-gray-600 w-6 flex-shrink-0">
                                                {String.fromCharCode(
                                                  65 + optIndex,
                                                )}
                                                .
                                              </span>
                                              <span className="text-gray-800 break-words whitespace-normal flex-1 min-w-0">
                                                {option}
                                              </span>
                                              <div className="flex items-center space-x-2 flex-shrink-0">
                                                {isCorrectOption && (
                                                  <span className="text-green-600 text-sm font-medium">
                                                    ✓ Correct
                                                  </span>
                                                )}
                                                {isUserAnswer &&
                                                  !isCorrectOption && (
                                                    <span className="text-red-600 text-sm font-medium">
                                                      ✗ Your Answer
                                                    </span>
                                                  )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Student's Answer */}
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Your Answer:
                              </p>
                              <div
                                className={`p-3 rounded-md border ${
                                  answer.isCorrect
                                    ? "bg-green-50 border-green-200"
                                    : "bg-red-50 border-red-200"
                                }`}
                              >
                                <p
                                  className={`font-medium ${answer.isCorrect ? "text-green-700" : "text-red-700"}`}
                                >
                                  {Array.isArray(answer.userAnswer)
                                    ? answer.userAnswer.join(", ") ||
                                      "Not answered"
                                    : answer.userAnswer || "Not answered"}
                                </p>
                              </div>
                            </div>

                            {/* Correct Answer (if wrong) */}
                            {!answer.isCorrect && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Correct Answer:
                                </p>
                                <div className="p-3 rounded-md border bg-green-50 border-green-200">
                                  <p className="font-medium text-green-700">
                                    {Array.isArray(question.correctAnswer)
                                      ? question.correctAnswer.join(", ")
                                      : question.correctAnswer}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Explanation */}
                            {question.explanation && (
                              <div className="mt-4 p-4 bg-emerald-50 rounded-md border border-emerald-200">
                                <p className="text-sm font-medium text-emerald-900 mb-1">
                                  Explanation:
                                </p>
                                <p className="text-sm text-emerald-800">
                                  {question.explanation}
                                </p>
                              </div>
                            )}

                            {/* Status Badge */}
                            <div className="mt-4 flex justify-between items-center">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  answer.isCorrect
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {answer.isCorrect ? "✓ Correct" : "✗ Incorrect"}
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
                    Detailed results and correct answers will be available once
                    the admin releases them.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <Confetti trigger={showConfetti} duration={3000} />
      <ImageZoomModal
        imageUrl={zoomedImage}
        isOpen={!!zoomedImage}
        onClose={() => setZoomedImage(null)}
      />
    </div>
  );
};

export default TestResultDetail;