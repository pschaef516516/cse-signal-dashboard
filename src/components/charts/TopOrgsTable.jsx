import { countByField } from '../../utils/aggregate'

export default function TopOrgsTable({ signals }) {
  const matched = signals.filter((s) => s.org_name != null)
  const rows = countByField(matched, 'org_name').slice(0, 10)

  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">No matched signals yet.</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b border-gray-200">
          <th className="pb-2 font-semibold text-gray-600">#</th>
          <th className="pb-2 font-semibold text-gray-600">Org Name</th>
          <th className="pb-2 font-semibold text-gray-600 text-right">Signals</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.name} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-2 text-gray-400">{i + 1}</td>
            <td className="py-2 text-gray-800">{row.name}</td>
            <td className="py-2 text-right font-medium text-gray-900">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
