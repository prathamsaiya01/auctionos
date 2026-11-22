'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import { MetricCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  MessageSquare,
  Mail,
  Send,
  Smartphone,
  RefreshCw
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
          subtitle="Real-time delivery log for Meta WhatsApp Cloud API, Email, and SMS auction notifications"
          actions={
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => refetch()}
            >
              Refresh Logs
            </Button>
          }
        />

        <div className="p-8 space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Dispatches"
              value={stats.total}
              icon={Send}
              iconColor="text-brand-600"
              iconBg="bg-brand-50"
            />
            <MetricCard
              title="Delivered Successfully"
              value={stats.delivered}
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <MetricCard
              title="Failed / Bounced"
              value={stats.failed}
              icon={AlertCircle}
              iconColor="text-rose-600"
              iconBg="bg-rose-50"
            />
            <MetricCard
              title="Queued / Processing"
              value={stats.pending}
              icon={Clock}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
          </div>

          {/* Notifications Log Table */}
          <div className="bg-white rounded-3xl border border-admin-border/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-admin-border/80 flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-admin-text">Outbox & Delivery Receipts</span>
                <p className="text-xs text-admin-muted mt-0.5">Automated transaction alerts sent directly to cricketers' WhatsApp & email</p>
              </div>
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-refreshes every 4s</span>
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs font-semibold text-admin-muted">Loading delivery logs...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-xs text-admin-muted">
                No notification receipts logged yet. When players are sold in the auction room, WhatsApp and Email congratulatory messages will be dispatched and logged here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-admin-muted font-bold uppercase tracking-wider border-b border-admin-border">
                    <tr>
                      <th className="py-3.5 px-5">Player</th>
                      <th className="py-3.5 px-4">Channel</th>
                      <th className="py-3.5 px-4">Recipient Destination</th>
                      <th className="py-3.5 px-4">Message Summary</th>
                      <th className="py-3.5 px-4">Delivery Status</th>
                      <th className="py-3.5 px-4">Timestamp</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {notifications.map((n: any) => (
                      <tr key={n.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-5 font-black text-admin-text">{n.player?.fullName || 'Tournament User'}</td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            n.channel === 'WHATSAPP'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : n.channel === 'EMAIL'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {n.channel === 'WHATSAPP' ? (
                              <Smartphone className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Mail className="w-3 h-3 text-blue-600" />
                            )}
                            {n.channel}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-admin-text">{n.recipient}</td>

                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{n.message}</td>

                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              n.status === 'DELIVERED'
                                ? 'success'
                                : n.status === 'FAILED'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {n.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-slate-400 text-[11px] tabular-nums">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </td>

                        <td className="py-3 px-5 text-right">
                          {n.status === 'FAILED' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={RotateCcw}
                              onClick={() => handleRetry(n.id)}
                            >
                              Retry
                            </Button>
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
