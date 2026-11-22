'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  MessageSquare,
  Mail,
  Send
} from 'lucide-react';

export default function NotificationsDeliveryPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['notifications', tournamentId],
    queryFn: async () => {
      const res: any = await api.get(`/notifications/delivery-report?tournamentId=${tournamentId}`);
      return res.data;
    },
    enabled: !!tournamentId,
    refetchInterval: 4000 // auto-refresh to see real-time delivery
  });

  const handleRetry = async (notificationId: string) => {
    try {
      await api.post(`/notifications/${notificationId}/retry`);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Error retrying notification');
    }
  };

  const stats = reportData?.stats || { total: 0, delivered: 0, failed: 0, pending: 0 };
  const notifications = reportData?.notifications || [];

  return (
    <div className="flex min-h-screen bg-admin-secondary">
      <AdminSidebar tournamentId={tournamentId} />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title="Automated Player Communications"
          subtitle="Real-time delivery log for Meta WhatsApp Cloud API, Email and SMS auction notifications"
        />

        <div className="p-8 space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-admin-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-admin-muted uppercase tracking-wider">Total Dispatches</p>
                <h3 className="text-2xl font-black text-admin-text mt-1">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-admin-primary flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-admin-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-admin-muted uppercase tracking-wider">Delivered</p>
                <h3 className="text-2xl font-black text-green-600 mt-1">{stats.delivered}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-admin-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-admin-muted uppercase tracking-wider">Failed / Bounced</p>
                <h3 className="text-2xl font-black text-red-600 mt-1">{stats.failed}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-admin-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-admin-muted uppercase tracking-wider">Queued / Sending</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Notifications Log Table */}
          <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Recent Automated Messages</span>
              <span className="text-xs text-admin-muted">Auto-refreshes every 4s</span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs font-semibold text-gray-400">Loading delivery reports...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                No notifications logged yet. When a player is marked SOLD in the auction, automatic notifications will be triggered here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">Channel</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Message Summary</th>
                      <th className="py-3 px-4">Delivery Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {notifications.map((n: any) => (
                      <tr key={n.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-bold text-gray-900">{n.player?.fullName || 'Tournament User'}</td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                            {n.channel === 'WHATSAPP' ? (
                              <MessageSquare className="w-3 h-3 text-green-600" />
                            ) : (
                              <Mail className="w-3 h-3 text-blue-600" />
                            )}
                            {n.channel}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-gray-600">{n.recipient}</td>

                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{n.message}</td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              n.status === 'DELIVERED'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : n.status === 'FAILED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {n.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-gray-400 text-[11px]">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {n.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetry(n.id)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold flex items-center gap-1 ml-auto"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
