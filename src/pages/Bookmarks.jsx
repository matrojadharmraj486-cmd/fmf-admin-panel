import { useState } from 'react'

export default function Bookmarks() {
  const [items, setItems] = useState([
    { id: 1, user: 'User 1', question: 'What is anatomy?', year: '2022', subject: 'Anatomy' },
    { id: 2, user: 'User 2', question: 'Define physiology.', year: '2023', subject: 'Physiology' }
  ])
  const remove = (id) => setItems((x) => x.filter((i) => i.id !== id))
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Bookmarks</h2>
      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Question</th>
              <th className="px-4 py-2 text-left">Year</th>
              <th className="px-4 py-2 text-left">Subject</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((i) => (
              <tr key={i.id} className="bg-white dark:bg-gray-800">
                <td className="px-4 py-2">{i.user}</td>
                <td className="px-4 py-2">{i.question}</td>
                <td className="px-4 py-2">{i.year}</td>
                <td className="px-4 py-2">{i.subject}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => remove(i.id)} className="px-3 py-1 rounded bg-red-600 text-white">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
