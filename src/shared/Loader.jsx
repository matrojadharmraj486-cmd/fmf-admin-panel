export function Loader({ inline }) {
  const cls = inline ? 'space-y-2' : 'w-full py-6 space-y-3'
  return (
    <div className={cls}>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>
  )
}
