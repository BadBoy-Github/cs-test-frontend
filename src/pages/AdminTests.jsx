import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotAuthorized from './NotAuthorized';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import API from '../utils/api';
import { useModal } from '../components/Modal';

const ADMIN_STRING = import.meta.env.VITE_ADMIN_STRING;

const SortableQuestion = ({ question, onEdit, onDelete, isDeleting }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 rounded p-3 bg-white"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab text-gray-400 hover:text-gray-600"
            >
              ⋮⋮
            </div>
            <span className="text-sm font-medium text-gray-600">
              {question.type.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500">
              {question.marks} mark{question.marks !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="font-medium">{question.questionText}</p>
          {question.type === 'mcq' || question.type === 'checkbox' ? (
            <div className="mt-2 space-y-1">
              {question.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-sm">{String.fromCharCode(65 + idx)}.</span>
                  <span className="text-sm">{option}</span>
                  {(question.correctAnswer || []).includes(option) && (
                    <span className="text-green-600 text-sm">✓</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => onEdit(question)}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
                  </button>
        </div>
      </div>
    </div>
  );
};

const AdminTests = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { showModal, modal } = useModal();

  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [showTestForm, setShowTestForm] = useState(false);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(null);
  const [isDeletingTest, setIsDeletingTest] = useState(null);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [isSavingTest, setIsSavingTest] = useState(false);
   const [togglingTestStatus, setTogglingTestStatus] = useState(null);
   const [togglingShowResults, setTogglingShowResults] = useState(null);

   const sensors = useSensors(
     useSensor(PointerSensor),
     useSensor(KeyboardSensor, {
       coordinateGetter: sortableKeyboardCoordinates,
     })
   );

  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    type: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: [],
    marks: 1,
    explanation: '',
    imageUrl: ''
  });

  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    duration: 60,
    passingScore: 50,
    negativeMarking: false,
    negativeMarkingValue: 0,
    maxAttempts: 1
  });

  const fetchTests = async () => {
    try {
      const res = await API.get('/admin/tests');
      setTests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    document.title = "Code Scapex Test | Manage Tests";
  }, []);

  useEffect(() => {
    fetchTests();
  }, []);

  if (!user || user.role !== ADMIN_STRING) {
    return <NotAuthorized />;
   }

  const fetchQuestions = async (testId) => {
    try {
      const res = await API.get(`/tests/${testId}/questions`);
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestClick = (test) => {
    setSelectedTest(test);
    fetchQuestions(test._id);
    setShowQuestions(true);
    setEditingQuestion(null);
    setShowQuestionForm(false);
    setEditingTest(null);
    setShowTestForm(false);
    resetQuestionForm();
    resetTestForm();
  };

  const toggleTestStatus = async (testId, currentStatus) => {
    setTogglingTestStatus(testId);
    try {
      await API.patch(`/admin/tests/${testId}`, { isActive: !currentStatus });
      fetchTests();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingTestStatus(null);
    }
  };

  const toggleShowResults = async (testId, currentStatus) => {
    setTogglingShowResults(testId);
    try {
      await API.patch(`/admin/tests/${testId}`, { showResults: !currentStatus });
      fetchTests();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingShowResults(null);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      questionText: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: [],
      marks: 1,
      explanation: '',
      imageUrl: ''
    });
  };

  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('option')) {
      const index = parseInt(name.split('-')[1]);
      const updatedOptions = [...questionForm.options];
      const oldValue = updatedOptions[index];
      updatedOptions[index] = value;
      // Update correctAnswer if the changed option was marked as correct
      const updatedCorrectAnswer = questionForm.correctAnswer.map(ans => ans === oldValue ? value : ans);
      setQuestionForm({ ...questionForm, options: updatedOptions, correctAnswer: updatedCorrectAnswer });
    } else if (name === 'marks') {
      setQuestionForm({ ...questionForm, [name]: parseInt(value) || 1 });
    } else if (name === 'type') {
      // Reset correctAnswer when changing question type
      setQuestionForm({ ...questionForm, [name]: value, correctAnswer: [] });
    } else {
      setQuestionForm({ ...questionForm, [name]: value });
    }
  };

  const addOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, '']
    });
  };

  const removeOption = (index) => {
    if (questionForm.options.length > 1) {
      const optionToRemove = questionForm.options[index];
      const isCorrectOption = questionForm.correctAnswer.includes(optionToRemove);
      
      if (isCorrectOption) {
        const otherOptions = questionForm.options.filter((_, i) => i !== index);
        const hasOtherCorrect = questionForm.correctAnswer.some(ans => otherOptions.includes(ans));
        if (!hasOtherCorrect) {
          showModal({
            title: 'Warning',
            message: 'You are about to delete the only correct answer. Please select another correct option first.',
            type: 'confirm'
          });
          return;
        }
      }
      
      const updatedOptions = questionForm.options.filter((_, i) => i !== index);
      const updatedCorrectAnswer = questionForm.correctAnswer.filter(answer => answer !== optionToRemove);
      setQuestionForm({
        ...questionForm,
        options: updatedOptions,
        correctAnswer: updatedCorrectAnswer
      });
    }
  };

  const handleCorrectAnswerChange = (option, checked) => {
    const currentAnswers = questionForm.correctAnswer || [];
    let newAnswers;
    if (checked) {
      newAnswers = [...currentAnswers, option];
    } else {
      newAnswers = currentAnswers.filter(ans => ans !== option);
    }
    setQuestionForm({ ...questionForm, correctAnswer: newAnswers });
  };

  const startEditingQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      questionText: question.questionText,
      type: question.type,
      options: question.options || ['', '', '', ''],
      correctAnswer: question.correctAnswer || [],
      marks: question.marks,
      explanation: question.explanation || '',
      imageUrl: question.imageUrl || ''
    });
    setShowQuestionForm(true);
  };



  const isQuestionValid = () => {
    if (!questionForm.questionText.trim()) return false;
    if (questionForm.type === 'descriptive' || questionForm.type === 'coding') {
      return questionForm.correctAnswer[0]?.trim();
    }
    return questionForm.correctAnswer.length > 0;
  };

  const saveQuestion = async () => {
    if (!isQuestionValid()) {
      showModal({
        title: 'Validation Error',
        message: 'Please provide a correct answer for this question type.',
        type: 'confirm'
      });
      return;
    }
    setIsSavingQuestion(true);
    try {
      if (editingQuestion) {
        await API.put(`/tests/${selectedTest._id}/update-question/${editingQuestion._id}`, questionForm);
      } else {
        await API.post(`/tests/${selectedTest._id}/questions`, questionForm);
      }
      fetchQuestions(selectedTest._id);
      setShowQuestionForm(false);
      setEditingQuestion(null);
      resetQuestionForm();
      showModal({
        title: 'Success',
        message: editingQuestion ? 'Question updated successfully!' : 'Question added successfully!',
        type: 'confirm'
      });
    } catch (err) {
      console.error(err);
      showModal({
        title: 'Error',
        message: 'Failed to save question. Please try again.',
        type: 'confirm'
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    setIsDeletingQuestion(questionId);
    try {
      await API.delete(`/tests/${selectedTest._id}/questions/${questionId}`);
      fetchQuestions(selectedTest._id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingQuestion(null);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q._id === active.id);
      const newIndex = questions.findIndex((q) => q._id === over.id);

      const reorderedQuestions = arrayMove(questions, oldIndex, newIndex);
      setQuestions(reorderedQuestions);

      // Update order on server
      const questionOrders = reorderedQuestions.map((q, index) => ({
        id: q._id,
        order: index + 1
      }));

      try {
        await API.post(`/tests/${selectedTest._id}/reorder-questions`, { questionOrders });
      } catch (err) {
        console.error('Failed to reorder questions:', err);
        // Revert on error
        fetchQuestions(selectedTest._id);
      }
    }
  };

  const resetTestForm = () => {
    setTestForm({
      title: '',
      description: '',
      duration: 60,
      passingScore: 50,
      negativeMarking: false,
      negativeMarkingValue: 0,
      maxAttempts: 1
    });
  };

  const startEditingTest = (test) => {
    setEditingTest(test);
    setTestForm({
      title: test.title,
      description: test.description || '',
      duration: test.duration,
      passingScore: test.passingScore,
      negativeMarking: test.negativeMarking,
      negativeMarkingValue: test.negativeMarkingValue,
      maxAttempts: test.maxAttempts
    });
    setShowTestForm(true);
  };

  const cancelTestEditing = () => {
    setEditingTest(null);
    setShowTestForm(false);
    resetTestForm();
  };

  const handleTestFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTestForm({
      ...testForm,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    });
  };

  const saveTest = async () => {
    setIsSavingTest(true);
    try {
      await API.put(`/tests/${editingTest._id}`, testForm);
      fetchTests();
      cancelTestEditing();
      showModal({
        title: 'Success',
        message: 'Test updated successfully!',
        type: 'confirm'
      });
    } catch (err) {
      console.error(err);
      showModal({
        title: 'Error',
        message: 'Failed to update test. Please try again.',
        type: 'confirm'
      });
    } finally {
      setIsSavingTest(false);
    }
  };

  const deleteTest = async (testId, testTitle) => {
    showModal({
      title: 'Delete Test',
      message: `Are you sure you want to delete "${testTitle}"? This will permanently delete the test and all associated questions, attempts, and answers. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setIsDeletingTest(testId);
          await API.delete(`/tests/${testId}`);
          fetchTests();
          showModal({
            title: 'Success',
            message: 'Test deleted successfully!',
            type: 'confirm'
          });
        } catch (err) {
          console.error(err);
          showModal({
            title: 'Error',
            message: 'Failed to delete test. Please try again.',
            type: 'confirm'
          });
        } finally {
          setIsDeletingTest(null);
        }
      },
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'cancel'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Test Management
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors "
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tests List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Tests</h2>
            <div className="space-y-4">
              {tests.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-2">No tests found</p>
                  <p className="text-gray-400 text-sm">
                    Nothing to test now. Consider adding a test to get started.
                  </p>
                </div>
              ) : (
                tests.map((test) => (
                  <div
                    key={test._id}
                    className={`border rounded p-4 ${
                      editingTest && editingTest._id === test._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {test.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {test.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          Duration: {test.duration} min
                        </p>
                        <div className="flex space-x-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              test.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {test.isActive ? "Live" : "Dormant"}
                          </span>
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              test.showResults
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {test.showResults
                              ? "Results Shown"
                              : "Results Hidden"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              toggleTestStatus(test._id, test.isActive)
                            }
                            disabled={togglingTestStatus === test._id}
                            className={`px-3 py-1 text-xs rounded flex items-center ${
                              test.isActive
                                ? "bg-red-500 text-white"
                                : "bg-green-500 text-white"
                            } ${togglingTestStatus === test._id ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {togglingTestStatus === test._id ? (
                              <svg
                                className="animate-spin h-3 w-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            ) : null}
                            {togglingTestStatus === test._id
                              ? "..."
                              : test.isActive
                                ? "Make Dormant"
                                : "Make Live"}
                          </button>
                          <button
                            onClick={() =>
                              toggleShowResults(test._id, test.showResults)
                            }
                            disabled={togglingShowResults === test._id}
                            className={`px-3 py-1 text-xs rounded flex items-center ${
                              test.showResults
                                ? "bg-orange-500 text-white"
                                : "bg-purple-500 text-white"
                            } ${togglingShowResults === test._id ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {togglingShowResults === test._id ? (
                              <svg
                                className="animate-spin h-3 w-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            ) : null}
                            {togglingShowResults === test._id
                              ? "..."
                              : test.showResults
                                ? "Hide Results"
                                : "Show Results"}
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditingTest(test)}
                            className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteTest(test._id, test.title)}
                            disabled={isDeletingTest === test._id}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                          >
                            {isDeletingTest === test._id ? (
                              <svg
                                className="animate-spin h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            ) : (
                              "Delete"
                            )}
                          </button>
                          <button
                            onClick={() => handleTestClick(test)}
                            disabled={showTestForm}
                            className={`px-3 py-1 text-xs rounded ${
                              showTestForm
                                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                          >
                            Manage Questions
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Test Edit Form */}
          {showTestForm && editingTest && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-gray-900 mb-4">
                Edit Test Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Test Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={testForm.title}
                    onChange={handleTestFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={testForm.description}
                    onChange={handleTestFormChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={testForm.duration}
                      onChange={handleTestFormChange}
                      min="1"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      name="passingScore"
                      value={testForm.passingScore}
                      onChange={handleTestFormChange}
                      min="0"
                      max="100"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      name="maxAttempts"
                      value={testForm.maxAttempts}
                      onChange={handleTestFormChange}
                      min="1"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="negativeMarking"
                    checked={testForm.negativeMarking}
                    onChange={handleTestFormChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enable Negative Marking
                  </label>
                </div>

                {testForm.negativeMarking && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Negative Marking Value (per wrong answer)
                    </label>
                    <input
                      type="number"
                      name="negativeMarkingValue"
                      value={testForm.negativeMarkingValue}
                      onChange={handleTestFormChange}
                      min="0"
                      step="0.1"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={saveTest}
                    disabled={!testForm.title.trim() || isSavingTest}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:bg-gray-400 flex items-center space-x-2"
                  >
                    {isSavingTest && (
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    <span>{isSavingTest ? "Updating..." : "Update Test"}</span>
                  </button>
                  <button
                    onClick={cancelTestEditing}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Questions Management */}
          {showQuestions && selectedTest && (
            <div className="bg-white p-6 rounded-lg shadow ">
              <div className="items-start mb-4 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Questions for: {selectedTest.title}
                </h2>
                {!showQuestionForm && !showTestForm && (
                  <button
                    onClick={() => {
                      setEditingQuestion(null);
                      resetQuestionForm();
                      setShowQuestionForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add Question
                  </button>
                )}
                {showQuestionForm && editingQuestion && (
                  <button
                    onClick={() => {
                      setShowQuestionForm(false);
                      setEditingQuestion(null);
                      resetQuestionForm();
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel Edit
                  </button>
                )}
                {/* Existing Questions */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Questions ({questions.length})
                    <span className="text-sm text-gray-500 ml-2">
                      Drag to reorder
                    </span>
                  </h3>
                  <div className="max-h-96 overflow-y-auto">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={questions.map((q) => q._id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {questions.map((question) => (
                            <SortableQuestion
                              key={question._id}
                              question={question}
                              onEdit={startEditingQuestion}
                              onDelete={deleteQuestion}
                              isDeleting={isDeletingQuestion}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>

                {/* Question Form */}
                {showQuestionForm && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {editingQuestion ? "Edit Question" : "Add New Question"}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Question Text
                        </label>
                        <textarea
                          name="questionText"
                          value={questionForm.questionText}
                          onChange={handleQuestionFormChange}
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                          placeholder="Enter your question here..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Question Image URL (Optional)
                        </label>
                        <input
                          type="url"
                          name="imageUrl"
                          value={questionForm.imageUrl}
                          onChange={handleQuestionFormChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://example.com/image.jpg"
                        />
                        {questionForm.imageUrl && (
                          <div className="mt-2">
                            <img
                              src={questionForm.imageUrl}
                              alt="Question preview"
                              className="max-w-xs max-h-48 object-contain border rounded"
                              onError={(e) => {
                                e.target.style.display = "none";
                                showModal({
                                  title: "Invalid Image URL",
                                  message:
                                    "Could not load image from the provided URL.",
                                  type: "confirm",
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Question Type
                        </label>
                        <select
                          name="type"
                          value={questionForm.type}
                          onChange={handleQuestionFormChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        >
                          <option value="mcq">
                            Multiple Choice (Single Answer)
                          </option>
                          <option value="checkbox">
                            Multiple Choice (Multiple Answers)
                          </option>
                          <option value="descriptive">Descriptive</option>
                          <option value="coding">Coding</option>
                        </select>
                      </div>

                      {(questionForm.type === "mcq" ||
                        questionForm.type === "checkbox") && (
                        <div>
                          <div className="mb-2">
                            <div className="flex justify-between items-center">
                              <label className="block text-sm font-medium text-gray-700">
                                Options
                                {questionForm.type === "checkbox" && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    Check the correct answers below
                                  </span>
                                )}
                                {questionForm.type === "mcq" && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    Select the correct answer below
                                  </span>
                                )}
                              </label>
                              <button
                                type="button"
                                onClick={addOption}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                + Add Option
                              </button>
                            </div>
                          </div>
                          {questionForm.options.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2 mb-2"
                            >
                              <span className="text-sm font-medium w-6">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              <input
                                type="text"
                                name={`option-${index}`}
                                value={option}
                                onChange={handleQuestionFormChange}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3"
                              />
                              <input
                                type={
                                  questionForm.type === "mcq"
                                    ? "radio"
                                    : "checkbox"
                                }
                                name={
                                  questionForm.type === "mcq"
                                    ? "correctAnswer"
                                    : `correct-${index}`
                                }
                                checked={
                                  questionForm.type === "mcq"
                                    ? questionForm.correctAnswer.includes(
                                        option,
                                      )
                                    : (
                                        questionForm.correctAnswer || []
                                      ).includes(option)
                                }
                                onChange={(e) => {
                                  if (questionForm.type === "mcq") {
                                    setQuestionForm({
                                      ...questionForm,
                                      correctAnswer: [option],
                                    });
                                  } else {
                                    handleCorrectAnswerChange(
                                      option,
                                      e.target.checked,
                                    );
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              {questionForm.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(index)}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {(questionForm.type === "descriptive" ||
                        questionForm.type === "coding") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Correct Answer
                          </label>
                          <textarea
                            name="correctAnswer"
                            value={
                              Array.isArray(questionForm.correctAnswer)
                                ? questionForm.correctAnswer.join("\n")
                                : questionForm.correctAnswer || ""
                            }
                            onChange={(e) =>
                              setQuestionForm({
                                ...questionForm,
                                correctAnswer: [e.target.value],
                              })
                            }
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                            placeholder="Enter the correct answer..."
                          />
                        </div>
                      )}

                      {questionForm.type === "mcq" && (
                        <p className="text-xs text-gray-500 mt-1">
                          Select one correct answer
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Marks
                      </label>
                      <input
                        type="number"
                        name="marks"
                        value={questionForm.marks}
                        onChange={handleQuestionFormChange}
                        min="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Explanation (Optional)
                      </label>
                      <textarea
                        name="explanation"
                        value={questionForm.explanation}
                        onChange={handleQuestionFormChange}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        placeholder="Explanation for the correct answer..."
                      />
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={saveQuestion}
                        disabled={!isQuestionValid() || isSavingQuestion}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2"
                      >
                        {isSavingQuestion && (
                          <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        <span>
                          {isSavingQuestion
                            ? "Saving..."
                            : editingQuestion
                              ? "Update Question"
                              : "Add Question"}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setShowQuestionForm(false);
                          setEditingQuestion(null);
                          resetQuestionForm();
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      {modal}
    </div>
  );
  };

export default AdminTests;