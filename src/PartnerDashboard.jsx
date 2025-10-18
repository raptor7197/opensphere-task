import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001';

export default function PartnerDashboard() {
  const [apiKey, setApiKey] = useState('test-partner-key');
  const [stats, setStats] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/partner/stats`, {
        headers: { 'x-api-key': apiKey }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/partner/evaluations?limit=20`, {
        headers: { 'x-api-key': apiKey }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEvaluations(data.evaluations || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchStats();
      fetchEvaluations();
    }
  }, [apiKey]);

  return (
    <div className="bg-black text-white min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Partner Dashboard</h1>
              <p className="text-gray-400">Immigration Lead Analytics & Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Enter API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => { fetchStats(); fetchEvaluations(); }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-500 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-md mb-6">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <p className="mt-2 text-gray-400">Loading...</p>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.totalEvaluations}</p>
                <p className="text-gray-400">Total Evaluations</p>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.averageScore?.toFixed(1) || 0}</p>
                <p className="text-gray-400">Average Score</p>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.excellentCount + stats.goodCount}</p>
                <p className="text-gray-400">High Quality Leads</p>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{((stats.excellentCount + stats.goodCount) / Math.max(stats.totalEvaluations, 1) * 100).toFixed(1)}%</p>
                <p className="text-gray-400">Success Rate</p>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Likelihood Distribution</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{stats.excellentCount}</p>
                <p className="text-sm text-gray-400">Excellent</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-300">{stats.goodCount}</p>
                <p className="text-sm text-gray-400">Good</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-400">{stats.fairCount}</p>
                <p className="text-sm text-gray-400">Fair</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-orange-400">{stats.lowCount}</p>
                <p className="text-sm text-gray-400">Low</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-400">{stats.veryLowCount}</p>
                <p className="text-sm text-gray-400">Very Low</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Evaluations</h2>
          {evaluations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No evaluations found for this API key.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 text-gray-300">Date</th>
                    <th className="text-left py-3 text-gray-300">User</th>
                    <th className="text-left py-3 text-gray-300">Country</th>
                    <th className="text-left py-3 text-gray-300">Visa Type</th>
                    <th className="text-left py-3 text-gray-300">Score</th>
                    <th className="text-left py-3 text-gray-300">Likelihood</th>
                    <th className="text-left py-3 text-gray-300">Email Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((evaluation, index) => (
                    <tr key={evaluation.id || index} className="border-b border-gray-800">
                      <td className="py-3 text-gray-300">
                        {evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 text-white">
                        {evaluation.user?.name || 'Unknown'}
                        <div className="text-xs text-gray-400">{evaluation.user?.email || ''}</div>
                      </td>
                      <td className="py-3 text-gray-300">{evaluation.country}</td>
                      <td className="py-3 text-gray-300">{evaluation.visaType}</td>
                      <td className="py-3">
                        <span className={`font-bold ${
                          evaluation.score >= 80 ? 'text-green-400' :
                          evaluation.score >= 60 ? 'text-yellow-400' :
                          evaluation.score >= 40 ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {evaluation.score}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          evaluation.likelihood === 'Excellent' ? 'bg-green-900/20 text-green-400' :
                          evaluation.likelihood === 'Good' ? 'bg-green-900/20 text-green-300' :
                          evaluation.likelihood === 'Fair' ? 'bg-yellow-900/20 text-yellow-400' :
                          evaluation.likelihood === 'Low' ? 'bg-orange-900/20 text-orange-400' :
                          'bg-red-900/20 text-red-400'
                        }`}>
                          {evaluation.likelihood}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          evaluation.emailSent ? 'bg-green-900/20 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {evaluation.emailSent ? 'Sent' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-gray-400 text-sm">
          <p>Partner API Dashboard - OpenSphere Visa Evaluation Tool</p>
          <p>Use API key: <code className="bg-gray-800 px-2 py-1 rounded">test-partner-key</code> for demo</p>
        </footer>
      </div>
    </div>
  );
}