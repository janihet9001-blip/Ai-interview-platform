export const SkeletonLoader = ({ type = 'card' }) => {
  const styles = {
    card: 'h-32 bg-surface2 rounded-lg animate-pulse',
    text: 'h-4 bg-surface2 rounded animate-pulse w-full',
    avatar: 'h-12 w-12 rounded-full bg-surface2 animate-pulse'
  };
  
  return <div className={styles[type]} />;
};

export const FullPageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-bg/80 backdrop-blur-sm z-50">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent" />
  </div>
);