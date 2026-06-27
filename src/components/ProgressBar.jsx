const ProgressBar = ({ currentStep, totalSteps, labels = [] }) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between mb-2 text-sm">
        {labels.length > 0 ? (
          labels.map((label, index) => (
            <span
              key={index}
              className={index < currentStep ? 'text-emerald-600 font-medium' : 'text-gray-400'}
            >
              {label}
            </span>
          ))
        ) : (
          <>
            <span className="text-emerald-600 font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-gray-500">{percentage}% Complete</span>
          </>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-emerald-700 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;