export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900">Active Projects</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">3</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900">Equipment Units</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">12</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900">Workers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">8</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900">Revenue MTD</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">SAR 0</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900">Total Cost MTD</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">SAR 0</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900">Gross Margin</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">0%</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900">Overdue Maintenance</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">2</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900">Expiring Documents</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">3</p>
        </div>
      </div>
    </div>
  )
}
