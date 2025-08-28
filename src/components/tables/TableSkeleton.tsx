import Skeleton from '../ui/Skeleton';

const TableRowSkeleton = () => (
  <div className="flex items-center space-x-4 p-4">
    <div className="flex-1"><Skeleton className="h-5" /></div>
    <div className="flex-1"><Skeleton className="h-5" /></div>
    <div className="flex-1"><Skeleton className="h-5" /></div>
    <div className="flex-1"><Skeleton className="h-5" /></div>
    <div className="flex-1"><Skeleton className="h-5" /></div>
    <div className="w-16"><Skeleton className="h-5" /></div>
  </div>
);

const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden divide-y divide-gray-700">
      {/* Header Skeleton */}
      <div className="flex items-center space-x-4 p-4">
        <div className="flex-1"><Skeleton className="h-4 w-3/4" /></div>
        <div className="flex-1"><Skeleton className="h-4 w-3/4" /></div>
        <div className="flex-1"><Skeleton className="h-4 w-1/2" /></div>
        <div className="flex-1"><Skeleton className="h-4 w-1/2" /></div>
        <div className="flex-1"><Skeleton className="h-4 w-2/3" /></div>
        <div className="w-16"></div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
};

export default TableSkeleton;
