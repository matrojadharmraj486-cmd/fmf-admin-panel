export function Loader({ inline }) {
  const cls = inline ? 'inline-block' : 'w-full flex justify-center py-6'
  return (
    <div className={cls}>
      <div className="h-6 w-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin dark:border-gray-700 dark:border-t-white" />
    </div>
  )
}
