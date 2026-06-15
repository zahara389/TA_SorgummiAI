import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Activity, BookOpen, MessageSquare, UserPlus, Bot } from 'lucide-react';
import { fetchAdminDashboardActivityLogs } from '../../services/dataService';

interface ActivityLogProps {
  onBack: () => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ onBack }) => {
  const [logPage, setLogPage] = useState(1);
  const [logs, setLogs] = useState<Array<any>>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAdminDashboardActivityLogs(page, 10);
      setLogs(data.items || []);
      setTotalPages(data.totalPages || 1);
      setLogPage(data.page || page);
    } catch (err: any) {
      console.error('[ActivityLog] loadLogs error', err);
      setError('Tidak dapat memuat log aktivitas. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(logPage);
  }, []);

  const renderIcon = (type: string) => {
    if (type.toLowerCase().includes('chat')) return <Bot className="w-4 h-4" />;
    if (type.toLowerCase().includes('artikel')) return <BookOpen className="w-4 h-4" />;
    if (type.toLowerCase().includes('profil') || type.toLowerCase().includes('kelola')) return <UserPlus className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 mb-6"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </button>

        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-accent">Admin Activity</p>
              <h1 className="mt-2 text-3xl font-bold">Log Aktivitas Admin</h1>
              <p className="mt-2 text-sm text-slate-500">Semua aktivitas penting yang direkam dari chat AI, artikel, dan pengelolaan profil.</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Clock className="w-4 h-4" /> Terakhir diperbarui: {new Date().toLocaleString()}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-[0.2em] text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">Tipe</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                  <th className="px-4 py-3 text-left">Detail</th>
                  <th className="px-4 py-3 text-left">Pengguna</th>
                  <th className="px-4 py-3 text-left">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Memuat log aktivitas...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-red-600">{error}</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Tidak ada aktivitas terdaftar.</td>
                  </tr>
                ) : (
                  logs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {renderIcon(item.type)}
                          {item.type}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{item.action}</td>
                      <td className="px-4 py-4 text-slate-600">{item.details || '-'}</td>
                      <td className="px-4 py-4 text-slate-600">{item.user_email || item.user_id || 'Guest'}</td>
                      <td className="px-4 py-4 text-slate-500">{item.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Halaman {logPage} dari {totalPages}</p>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                disabled={logPage <= 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => loadLogs(Math.max(1, logPage - 1))}
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={logPage >= totalPages}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => loadLogs(Math.min(totalPages, logPage + 1))}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
