const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const CardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg shadow space-y-4">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="flex space-x-4 pt-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

const QuestionCardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg shadow space-y-4">
    <Skeleton className="h-5 w-1/4" />
    <Skeleton className="h-6 w-full" />
    <Skeleton className="h-6 w-5/6" />
    <div className="space-y-2">
      {[1,2,3,4].map(i => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  </div>
);

export { Skeleton, CardSkeleton, QuestionCardSkeleton };
export default Skeleton;
