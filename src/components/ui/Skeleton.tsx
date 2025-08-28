const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div className={`animate-pulse rounded-md bg-gray-700 ${className}`} />
  );
};
export default Skeleton;
