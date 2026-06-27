import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useModal } from '../components/Modal';
import Loader from '../components/Loader';
import Confetti from '../components/Confetti';
import ImageZoomModal from '../components/ImageZoomModal';
import logger from '../utils/logger';
import { FaCheck, FaTimes, FaVideo, FaMicrophone } from 'react-icons/fa';

const TEST_STORAGE_KEY_PREFIX = 'testHive_test_';
const TEST_STORAGE_EXPIRY = 60 * 60 * 1000; // 1 hour in ms

const getStorageKey = (testId, attemptId) => `${TEST_STORAGE_KEY_PREFIX}${testId}_${attemptId}`;

const getStoredState = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setStoredState = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      expiry: Date.now() + TEST_STORAGE_EXPIRY
    }));
  } catch (e) {
    console.warn('Failed to save test state to localStorage:', e);
  }
};

const clearStoredState = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Failed to clear test state from localStorage:', e);
  }
};

const PermissionModal = ({ cameraGranted, micGranted, onRequestPermissions, onContinue }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Give the following permissions:</h3>
      </div>
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3">
          <FaVideo className="text-gray-600" />
          <span className="text-gray-700">1. Video Permission</span>
          {cameraGranted ? (
            <FaCheck className="text-green-500 ml-auto" />
          ) : (
            <FaTimes className="text-red-500 ml-auto" />
          )}
        </div>
        <div className="flex items-center space-x-3">
          <FaMicrophone className="text-gray-600" />
          <span className="text-gray-700">2. Audio Permission</span>
          {micGranted ? (
            <FaCheck className="text-green-500 ml-auto" />
          ) : (
            <FaTimes className="text-red-500 ml-auto" />
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onRequestPermissions}
          className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Grant Permissions
        </button>
        <button
          onClick={onContinue}
          disabled={!(cameraGranted && micGranted)}
          className={`px-4 py-2 rounded ${
            cameraGranted && micGranted
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Test
        </button>
      </div>
    </div>
  </div>
);

const ViolationModal = ({ violationType, timeRemaining, onAction, onRequestPermissions, cameraGranted, micGranted }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {violationType === 'fullscreen' ? 'Please be in Full Screen' : 'Please ensure all permissions are granted'}
      </h3>
      
      {violationType === 'permissions' && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-3">
            <FaVideo className="text-gray-600" />
            <span className="text-gray-700">Video Permission</span>
            {cameraGranted ? (
              <FaCheck className="text-green-500 ml-auto" />
            ) : (
              <FaTimes className="text-red-500 ml-auto" />
            )}
          </div>
          <div className="flex items-center space-x-3">
            <FaMicrophone className="text-gray-600" />
            <span className="text-gray-700">Audio Permission</span>
            {micGranted ? (
              <FaCheck className="text-green-500 ml-auto" />
            ) : (
              <FaTimes className="text-red-500 ml-auto" />
            )}
          </div>
        </div>
      )}
      
      <p className="text-gray-600 mb-6">
        Auto-submitting test in {timeRemaining} seconds...
      </p>
      
      <div className="flex justify-end">
        <button
          onClick={onAction}
          className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {violationType === 'fullscreen' ? 'Enable Full Screen' : 'Grant Permissions'}
        </button>
      </div>
    </div>
  </div>
);

const TestTaking = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { modal, showModal, confirm } = useModal();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [submittedQuestions, setSubmittedQuestions] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [zoomedImage, setZoomedImage] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isFullscreenExited, setIsFullscreenExited] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(true);
  const [permissionRevoked, setPermissionRevoked] = useState(false);
  const [violationTimeLeft, setViolationTimeLeft] = useState(10);
  const [violationModalType, setViolationModalType] = useState(null);
  const questionStartTimeRef = useRef(null);
  const submitTestRef = useRef(null);
  const showModalRef = useRef(showModal);
  const storageKeyRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const violationTimeoutRef = useRef(null);
  const violationIntervalRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const permissionCheckIntervalRef = useRef(null);
  const autoSubmitRef = useRef(null);
  const attemptIdRef = useRef(attemptId);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const checkMediaPermissions = async () => {
    try {
      if (!navigator.permissions || !navigator.permissions.query) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .catch(() => null);
        const cameraOk = !!stream?.getVideoTracks().length;
        const micOk = !!stream?.getAudioTracks().length;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setCameraGranted(cameraOk);
        setMicGranted(micOk);
        return cameraOk && micOk;
      }
      
      const permissions = await Promise.all([
        navigator.permissions.query({ name: 'camera' }),
        navigator.permissions.query({ name: 'microphone' })
      ]);
      
      const cameraOk = permissions[0].state === 'granted';
      const micOk = permissions[1].state === 'granted';
      
      setCameraGranted(cameraOk);
      setMicGranted(micOk);
      
      return cameraOk && micOk;
    } catch (error) {
      logger.error('Permission check failed', error);
      setCameraGranted(false);
      setMicGranted(false);
      return false;
    }
  };

  const requestAllPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      await checkMediaPermissions();
    } catch (error) {
      logger.error('Permission request failed', error);
      await checkMediaPermissions();
    }
  };

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      logger.error('Failed to enter fullscreen', error);
    }
  };

  const submitAnswer = async (questionId) => {
    const answer = answers[questionId];
    const startTime = questionStartTimeRef.current;
    const timeTaken = startTime ? (Date.now() - startTime) / 1000 : 0;
    await API.post(`/attempts/${attemptId}/answer`, {
      questionId,
      userAnswer: answer,
      timeTaken
    });
    setSubmittedQuestions(prev => new Set([...prev, questionId]));
  };

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  const handleAutoSubmit = async () => {
    if (isSubmitting || testSubmitted || !attemptIdRef.current) return;
    setIsSubmitting(true);
    try {
      for (const question of questions) {
        const qId = question._id;
        if (answers[qId] !== undefined && !submittedQuestions.has(qId)) {
          await submitAnswer(qId);
        }
      }

      const result = await API.post(`/attempts/${attemptIdRef.current}/complete`);
      setTestSubmitted(true);

      if (storageKeyRef.current) {
        clearStoredState(storageKeyRef.current);
      }
      localStorage.removeItem(`testHive_currentAttempt_${testId}`);

      if (result.data.passed || result.data.isFirstAttempt) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      showModal({
        title: 'Test Auto-Submitted',
        message: 'Your test is autosubmitted.',
        onConfirm: () => navigate('/dashboard'),
        confirmText: 'OK',
        type: 'confirm'
      });
    } catch (error) {
      logger.error('Failed to auto-submit test', error);
      showModal({
        title: 'Auto-Submission Error',
        message: 'Failed to auto-submit test. Please contact support.',
        onConfirm: () => navigate('/dashboard'),
        confirmText: 'OK',
        type: 'confirm'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    autoSubmitRef.current = handleAutoSubmit;
  });

  const startViolationTimer = (type) => {
    if (violationIntervalRef.current) {
      clearInterval(violationIntervalRef.current);
    }
    setViolationModalType(type);
    setViolationTimeLeft(10);
    
    violationIntervalRef.current = setInterval(() => {
      setViolationTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(violationIntervalRef.current);
          autoSubmitRef.current();
          setViolationModalType(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleViolationAction = async () => {
    if (violationModalType === 'fullscreen') {
      await enterFullscreen();
      if (document.fullscreenElement) {
        setIsFullscreenExited(false);
        setViolationModalType(null);
        if (violationIntervalRef.current) {
          clearInterval(violationIntervalRef.current);
          violationIntervalRef.current = null;
        }
      }
    } else if (violationModalType === 'permissions') {
      const allGranted = await requestAllPermissions();
      if (allGranted) {
        setPermissionRevoked(false);
        setViolationModalType(null);
        if (violationIntervalRef.current) {
          clearInterval(violationIntervalRef.current);
          violationIntervalRef.current = null;
        }
      }
    }
  };

  useEffect(() => {
    checkMediaPermissions();
  }, []);

  useEffect(() => {
    if (permissionsGranted) {
      fetchTest();
      enterFullscreen();
    }
  }, [permissionsGranted]);

  useEffect(() => {
    const checkDuringTest = async () => {
      if (!permissionsGranted || testSubmitted || !attemptId) return;
      
      const allGranted = await checkMediaPermissions();
      if (!allGranted && !permissionRevoked) {
        setPermissionRevoked(true);
        startViolationTimer('permissions');
      }
    };

    if (permissionsGranted) {
      permissionCheckIntervalRef.current = setInterval(checkDuringTest, 2000);
    }

    return () => {
      if (permissionCheckIntervalRef.current) {
        clearInterval(permissionCheckIntervalRef.current);
      }
    };
  }, [permissionsGranted, testSubmitted, permissionRevoked, attemptId]);

  const fetchTest = async () => {
    try {
      setLoading(true);

      const testRes = await API.get(`/tests/${testId}`);
      setTest(testRes.data);

      const savedAttemptId = attemptId || localStorage.getItem(`testHive_currentAttempt_${testId}`);
      let savedState = null;
      if (savedAttemptId) {
        storageKeyRef.current = getStorageKey(testId, savedAttemptId);
        savedState = getStoredState(storageKeyRef.current);
      }

      let questionsRes = await API.get(`/tests/${testId}/questions`);
      let fetchedQuestions = questionsRes.data;

      if (testRes.data.randomizeQuestions) {
        fetchedQuestions = shuffleArray(fetchedQuestions);
      }

      fetchedQuestions = fetchedQuestions.map(q => {
        if (q.type === 'mcq' || q.type === 'checkbox') {
          const optionsWithCorrect = q.options.map(opt => ({
            option: opt,
            isCorrect: (q.correctAnswer || []).includes(opt)
          }));
          const shuffledOptions = shuffleArray(optionsWithCorrect);
          return {
            ...q,
            options: shuffledOptions.map(item => item.option),
            correctAnswer: shuffledOptions.filter(item => item.isCorrect).map(item => item.option)
          };
        }
        return q;
      });

      setQuestions(fetchedQuestions);

      let currentAttemptId = savedAttemptId;
      if (!currentAttemptId) {
        const attemptRes = await API.post(`/attempts/${testId}/start`);
        currentAttemptId = attemptRes.data._id;
        localStorage.setItem(`testHive_currentAttempt_${testId}`, currentAttemptId);
      }
      setAttemptId(currentAttemptId);
      storageKeyRef.current = getStorageKey(testId, currentAttemptId);

      if (savedState) {
        setAnswers(savedState.answers || {});
        setFlaggedQuestions(new Set(savedState.flaggedQuestions || []));
        setSubmittedQuestions(new Set(savedState.submittedQuestions || []));
        setTimeLeft(savedState.timeLeft || testRes.data.duration * 60);
        setIsRestored(true);
      } else {
        setTimeLeft(testRes.data.duration * 60);
      }

      setLoading(false);
    } catch (error) {
      logger.error('Failed to load test', error);
      const errorMessage = error.response?.data?.message || 'Failed to load test';

      if (errorMessage.includes('Maximum attempts reached')) {
        showModal({
          title: 'Maximum Attempts Reached',
          message: `You have reached the maximum number of attempts (${error.response?.data?.maxAttempts || 'allowed'}) for this test.`,
          onConfirm: () => navigate('/dashboard'),
          confirmText: 'OK',
          type: 'confirm'
        });
        return;
      } else if (errorMessage.includes('not currently available')) {
        showModal({
          title: 'Test Unavailable',
          message: 'This test is not currently available.',
          onConfirm: () => navigate('/dashboard'),
          confirmText: 'OK',
          type: 'confirm'
        });
        return;
      }

      showModal({
        title: 'Error',
        message: errorMessage,
        onConfirm: () => navigate('/dashboard'),
        confirmText: 'OK',
        type: 'confirm'
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Code Scapex Test | Test";
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      questionStartTimeRef.current = Date.now();
    }
  }, [currentQuestion, questions]);

  useEffect(() => {
    submitTestRef.current = submitTest;
  });

  useEffect(() => {
    showModalRef.current = showModal;
  });

  useEffect(() => {
    if (!storageKeyRef.current || !attemptId || testSubmitted) return;

    const persist = () => {
      setStoredState(storageKeyRef.current, {
        answers,
        flaggedQuestions: Array.from(flaggedQuestions),
        submittedQuestions: Array.from(submittedQuestions),
        timeLeft,
        restoredAt: Date.now()
      });
    };

    persist();
    timerIntervalRef.current = setInterval(persist, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [answers, flaggedQuestions, submittedQuestions, timeLeft, attemptId, testSubmitted]);

  useEffect(() => {
    if (timeLeft <= 0 || testSubmitted) return;

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, testSubmitted]);

  useEffect(() => {
    if (timeLeft === 0 && test && attemptId && !isSubmitting && !testSubmitted && !loading) {
      handleAutoSubmit();
    }
  }, [timeLeft, test, attemptId, isSubmitting, testSubmitted, loading]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && attemptId && !loading && !testSubmitted) {
        handleAutoSubmit();
      }
    };

    const preventActions = (e) => {
      e.preventDefault();
      showModalRef.current({
        title: 'Action Not Allowed',
        message: 'Copy, paste, cut, or right-click is disabled during the test.',
        onConfirm: () => {},
        confirmText: 'OK',
        type: 'confirm'
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', preventActions);
    document.addEventListener('paste', preventActions);
    document.addEventListener('cut', preventActions);
    document.addEventListener('contextmenu', preventActions);

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !testSubmitted && permissionsGranted && attemptId) {
        setIsFullscreenExited(true);
        startViolationTimer('fullscreen');
      }

      if (document.fullscreenElement && isFullscreenExited) {
        setIsFullscreenExited(false);
        if (violationIntervalRef.current) {
          clearInterval(violationIntervalRef.current);
          violationIntervalRef.current = null;
        }
        setViolationModalType(null);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', preventActions);
      document.removeEventListener('paste', preventActions);
      document.removeEventListener('cut', preventActions);
      document.removeEventListener('contextmenu', preventActions);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (violationIntervalRef.current) clearInterval(violationIntervalRef.current);
    };
  }, [permissionsGranted, testSubmitted, loading, attemptId]);

  const submitTest = async () => {
    if (!attemptId) {
      showModal({
        title: 'Error',
        message: 'Test session not properly initialized. Please try again.',
        onConfirm: () => navigate('/dashboard'),
        confirmText: 'OK',
        type: 'confirm'
      });
      return;
    }

    if (isSubmitting) {
      return;
    }

    const confirmed = await confirm('Are you sure you want to submit the test? You will not be able to make any more changes.', 'Submit Test');

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      for (const question of questions) {
        const qId = question._id;
        if (answers[qId] !== undefined && !submittedQuestions.has(qId)) {
          await submitAnswer(qId);
        }
      }

      const result = await API.post(`/attempts/${attemptId}/complete`);
      setTestSubmitted(true);

      if (storageKeyRef.current) {
        clearStoredState(storageKeyRef.current);
      }
      localStorage.removeItem(`testHive_currentAttempt_${testId}`);

      if (result.data.passed || result.data.isFirstAttempt) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      showModal({
        title: 'Test Submitted',
        message: 'Your test has been submitted successfully!',
        onConfirm: () => {
          setTimeout(() => navigate('/dashboard'), 100);
        },
        confirmText: 'OK',
        type: 'confirm'
      });
    } catch (error) {
      logger.error('Failed to submit test', error);
      showModal({
        title: 'Submission Error',
        message: 'Failed to submit test. Your progress may not have been saved.',
        onConfirm: () => navigate('/dashboard'),
        confirmText: 'OK',
        type: 'confirm'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearResponse = async (questionId) => {
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });

    setSubmittedQuestions(prev => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });

    if (submittedQuestions.has(questionId) && attemptId) {
      const question = questions.find(q => q._id === questionId);
      const emptyAnswer = question?.type === 'checkbox' ? [] : '';
      try {
        await API.post(`/attempts/${attemptId}/answer`, {
          questionId,
          userAnswer: emptyAnswer,
          timeTaken: 0
        });
      } catch (err) {
        console.error('Failed to clear answer on backend:', err);
      }
    }
  };

  const handleAnswer = (questionId, answer, isCheckbox = false) => {
    if (isCheckbox) {
      const currentAnswers = answers[questionId] || [];
      const newAnswers = currentAnswers.includes(answer)
        ? currentAnswers.filter(a => a !== answer)
        : [...currentAnswers, answer];
      setAnswers({ ...answers, [questionId]: newAnswers });
    } else {
      setAnswers({ ...answers, [questionId]: answer });
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      submitAnswer(questions[currentQuestion]._id);
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      submitAnswer(questions[currentQuestion]._id);
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const goToQuestion = (index) => {
    if (index !== currentQuestion) {
      submitAnswer(questions[currentQuestion]._id);
      setCurrentQuestion(index);
    }
  };

  const toggleFlag = (e) => {
    e.stopPropagation();
    const qId = questions[currentQuestion]._id;
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  const getQuestionStatus = (index) => {
    const q = questions[index];
    const isAnswered = answers[q._id] !== undefined;
    const isFlagged = flaggedQuestions.has(q._id);
    if (index === currentQuestion) return 'current';
    if (isFlagged) return 'flagged';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  if (loading || !test || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <Loader message={!test ? "Please grant camera and microphone permissions to start the test" : "Loading..."} />
        </div>
        {showPermissionModal && (
          <PermissionModal
            cameraGranted={cameraGranted}
            micGranted={micGranted}
            onRequestPermissions={requestAllPermissions}
            onContinue={() => {
              if (cameraGranted && micGranted) {
                setPermissionsGranted(true);
                setShowPermissionModal(false);
              }
            }}
          />
        )}
      </div>
    );
  }

  const question = questions[currentQuestion];

  const getQuestionStatusClass = (index) => {
    const status = getQuestionStatus(index);
    const baseClass = "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all ";
    if (status === 'current') return baseClass + 'bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2';
    if (status === 'answered') return baseClass + 'bg-green-100 text-green-800 hover:bg-green-200';
    if (status === 'flagged') return baseClass + 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    return baseClass + 'bg-gray-100 text-gray-600 hover:bg-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showPermissionModal && (
        <PermissionModal
          cameraGranted={cameraGranted}
          micGranted={micGranted}
          onRequestPermissions={requestAllPermissions}
          onContinue={() => {
            if (cameraGranted && micGranted) {
              setPermissionsGranted(true);
              setShowPermissionModal(false);
            }
          }}
        />
      )}

      {violationModalType && (
        <ViolationModal
          key={violationTimeLeft}
          violationType={violationModalType}
          timeRemaining={violationTimeLeft}
          onAction={handleViolationAction}
          onRequestPermissions={requestAllPermissions}
          cameraGranted={cameraGranted}
          micGranted={micGranted}
        />
      )}

      <header className="bg-white shadow p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
          <div className="flex items-center space-x-4">
            <div className="text-lg font-mono text-gray-700">
              Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <button
              onClick={toggleFlag}
              disabled={testSubmitted}
              className={`px-3 py-1 rounded text-sm font-medium border ${
                flaggedQuestions.has(questions[currentQuestion]?._id)
                  ? 'bg-orange-100 text-orange-700 border-orange-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              } ${testSubmitted ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {flaggedQuestions.has(questions[currentQuestion]?._id) ? '🚩 Flagged' : '🚩 Flag'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="bg-white p-6 rounded-lg shadow">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-semibold text-gray-900">
                   Question {currentQuestion + 1} of {questions.length}
                 </h2>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       clearResponse(question._id);
                     }}
                     disabled={testSubmitted}
                     className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                       question.type === 'checkbox'
                         ? (answers[question._id] || []).length > 0
                           ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-900'
                           : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                         : answers[question._id]
                           ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-900'
                           : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                     } ${testSubmitted ? 'cursor-not-allowed opacity-50' : ''}`}
                     title="Clear response"
                   >
                     Clear
                   </button>
                   <span className={`px-2 py-1 rounded text-xs font-medium ${
                     question.marks === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                   }`}>
                     {question.marks} mark{question.marks !== 1 ? 's' : ''}
                   </span>
                 </div>
               </div>

               <p className="mb-4 text-lg text-gray-800 break-words whitespace-normal">{question.questionText}</p>

               {question.imageUrl && (
                 <div className="mb-6">
                   <img
                     src={question.imageUrl}
                     alt="Question"
                     className="max-w-md max-h-80 object-contain border rounded-lg shadow-sm cursor-zoom-in hover:shadow-md transition-shadow"
                     onClick={() => setZoomedImage(question.imageUrl)}
                     onError={(e) => { e.target.style.display = 'none'; }}
                   />
                 </div>
               )}

                 {(question.type === 'mcq' || question.type === 'checkbox') && question.options && (
                   <div className="space-y-2 mb-6">
                     {question.options.map((option, index) => {
                       const isSelected = question.type === 'mcq'
                         ? answers[question._id] === option
                         : (answers[question._id] || []).includes(option);
                       return (
                         <label
                           key={index}
                           className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                             isSelected
                               ? 'bg-emerald-50 border-emerald-500'
                               : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                           }`}
                         >
                            <input
                              type={question.type === 'mcq' ? 'radio' : 'checkbox'}
                              name={question.type === 'mcq' ? 'answer' : `answer-${index}`}
                              value={option}
                              checked={isSelected}
                              onChange={() => handleAnswer(question._id, option, question.type === 'checkbox')}
                              disabled={testSubmitted}
                              className="mr-3 h-4 w-4 mt-0.5 flex-shrink-0"
                            />
                            <span className="text-sm font-medium text-gray-700 break-words whitespace-normal flex-1 min-w-0">
                              {String.fromCharCode(65 + index)}. {option}
                            </span>
                         </label>
                       );
                     })}
                   </div>
                 )}

               {question.type === 'descriptive' && (
                 <textarea
                   className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                   rows="6"
                   value={answers[question._id] || ''}
                   onChange={(e) => handleAnswer(question._id, e.target.value)}
                   disabled={testSubmitted}
                   placeholder="Enter your answer here..."
                 />
               )}

               {question.type === 'coding' && (
                 <textarea
                   className="w-full p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                   rows="12"
                   value={answers[question._id] || ''}
                   onChange={(e) => handleAnswer(question._id, e.target.value)}
                   disabled={testSubmitted}
                   placeholder="Write your code here..."
                 />
               )}

               <div className="flex justify-between mt-6">
                 <button
                   onClick={prevQuestion}
                   disabled={currentQuestion === 0 || testSubmitted}
                   className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                 >
                   Previous
                 </button>
                 {currentQuestion < questions.length - 1 ? (
                   <button
                     onClick={nextQuestion}
                     disabled={testSubmitted}
                     className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     Next
                   </button>
                 ) : (
                    <button
                      onClick={submitTest}
                      disabled={isSubmitting || testSubmitted}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-400 flex items-center space-x-2"
                    >
                      {isSubmitting && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      <span>{isSubmitting ? 'Submitting...' : testSubmitted ? 'Test Submitted' : 'Submit Test'}</span>
                    </button>
                  )}
               </div>
             </div>
           </div>

          <div className="w-64 hidden lg:block">
            <div className="sticky top-6 bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Question Navigation
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => (
                  <button
                    key={q._id}
                    onClick={() => goToQuestion(index)}
                    disabled={testSubmitted}
                    className={getQuestionStatusClass(index)}
                    title={`Question ${index + 1}${getQuestionStatus(index) === 'flagged' ? ' (flagged)' : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600"></span>
                    <span className="text-gray-600">Current</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-800 border border-green-300 flex items-center justify-center text-[10px]">✓</span>
                    <span className="text-gray-600">Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-800 border border-orange-300 flex items-center justify-center text-[10px]">🚩</span>
                    <span className="text-gray-600">Flagged</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-600 border border-gray-300 flex items-center justify-center text-[10px]">-</span>
                    <span className="text-gray-600">Not Answered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

       <Confetti trigger={showConfetti} duration={3000} />
       <ImageZoomModal
         imageUrl={zoomedImage}
         isOpen={!!zoomedImage}
         onClose={() => setZoomedImage(null)}
       />
       {modal}
     </div>
   );
};

export default TestTaking;