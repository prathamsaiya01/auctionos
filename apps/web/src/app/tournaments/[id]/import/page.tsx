'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api, API_URL } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  Gavel,
  RefreshCw,
  FileCheck,
  ChevronRight,
  Database,
  Users,
  ShieldCheck,
  Layers
} from 'lucide-react';

export default function ExcelImportPage() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importJob, setImportJob] = useState<any>(null);
  const [mapping, setMapping] = useState<any>({});
  const [targetAuctionId, setTargetAuctionId] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [resultSummary, setResultSummary] = useState<any>(null);

  // Fetch tournament auctions for direct pool queuing
  const { data: tournament } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => {
      const res: any = await api.get(`/tournaments/${tournamentId}`);
      return res.data;
    },
    enabled: !!tournamentId
  });

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res: any = await api.post('/imports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImportJob(res.data);
      setMapping(res.data.suggestedMapping || {});
    } catch (err: any) {
      alert(err.message || 'Error uploading Excel file');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importJob) return;

    setImporting(true);
    try {
      const res: any = await api.post('/imports/confirm', {
        importJobId: importJob.importJobId,
        tournamentId,
        mapping,
        targetAuctionId: targetAuctionId || undefined
      });

      setResultSummary(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to complete import');
    } finally {
      setImporting(false);
    }
  };

  const auctions = tournament?.auctions || [];

  // Determine current active step (1 to 4)
  const currentStep = resultSummary ? 4 : importJob ? 2 : 1;

  return (
    <div className="flex min-h-screen bg-admin-secondary">
      <AdminSidebar tournamentId={tournamentId} />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title="Excel & CSV Bulk Importer"
          subtitle="Import hundreds of cricket players with automated column detection and validation"
          actions={
            <div className="flex items-center gap-2">
              <a
                href={`${API_URL}/imports/templates/basic`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-admin-border hover:bg-slate-50 text-admin-text rounded-xl text-xs font-bold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-brand-600" />
                <span>Basic Template</span>
              </a>
              <a
                href={`${API_URL}/imports/templates/complete`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-admin-border hover:bg-slate-50 text-admin-text rounded-xl text-xs font-bold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-brand-600" />
                <span>Complete Cricket Template</span>
              </a>
            </div>
          }
        />

        <div className="p-8 max-w-5xl space-y-6">
          {/* Stepper Wizard Indicator */}
          <div className="bg-white p-4 rounded-2xl border border-admin-border/80 shadow-xs">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                { step: 1, label: 'Upload Sheet' },
                { step: 2, label: 'Map Columns' },
                { step: 3, label: 'Preview & Queue' },
                { step: 4, label: 'Complete' }
              ].map((s, idx) => (
                <React.Fragment key={s.step}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                        currentStep >= s.step
                          ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {currentStep > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                    </div>
                    <span
                      className={`text-xs font-bold hidden sm:inline ${
                        currentStep >= s.step ? 'text-admin-text' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 transition-colors ${
                        currentStep > s.step ? 'bg-brand-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {!resultSummary ? (
            <>
              {/* Step 1: Upload Card */}
              {!importJob ? (
                <div className="bg-white rounded-3xl border border-admin-border/80 p-8 shadow-xs">
                  <div className="max-w-xl mx-auto text-center">
                    <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-brand-100 shadow-sm">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-admin-text tracking-tight">Upload Player Roster Sheet</h2>
                    <p className="text-xs text-admin-muted mt-1.5 mb-6 leading-relaxed">
                      Upload .xlsx or .csv files with player credentials. Our intelligent mapper automatically detects player names, mobile numbers, roles, categories, base prices, and cricket statistics.
                    </p>

                    <form onSubmit={handleFileUpload} className="space-y-4">
                      <div className="border-2 border-dashed border-slate-200 hover:border-brand-500 rounded-3xl p-8 transition-colors bg-slate-50/50">
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100 cursor-pointer"
                        />
                        {file && (
                          <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                            <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        )}
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        disabled={!file || uploading}
                        loading={uploading}
                        icon={Upload}
                      >
                        {uploading ? 'Parsing Columns & Records...' : 'Upload & Map Columns'}
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                /* Step 2 & 3: Mapping & Preview */
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-admin-border/80 p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-admin-border">
                      <div>
                        <h3 className="font-black text-admin-text text-base">Step 2: Intelligent Column Mapping</h3>
                        <p className="text-xs text-admin-muted mt-0.5">
                          Found <span className="font-bold text-admin-text">{importJob.totalRows} player rows</span> in <span className="font-bold text-brand-600 font-mono">{importJob.fileName}</span>.
                        </p>
                      </div>

                      <button
                        onClick={() => setImportJob(null)}
                        className="text-xs font-bold text-slate-500 hover:text-admin-text transition-colors"
                      >
                        Upload Different Sheet
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-5">
                      {[
                        { key: 'fullName', label: 'Full Name *' },
                        { key: 'mobileNumber', label: 'Mobile / WhatsApp' },
                        { key: 'role', label: 'Playing Role *' },
                        { key: 'basePrice', label: 'Base Price *' },
                        { key: 'playerCategory', label: 'Category' },
                        { key: 'city', label: 'City / District' },
                        { key: 'age', label: 'Player Age' },
                        { key: 'battingStyle', label: 'Batting Style' }
                      ].map((field) => (
                        <div key={field.key} className="bg-slate-50 p-3.5 rounded-2xl border border-admin-border">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                            {field.label}
                          </label>
                          <select
                            value={mapping[field.key] || ''}
                            onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-admin-border rounded-xl text-xs font-bold text-admin-text focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="">-- Ignore / Not in Sheet --</option>
                            {importJob.headers.map((h: string) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Direct to Auction Option */}
                    <div className="mt-6 pt-5 border-t border-admin-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-50 rounded-2xl text-purple-600 border border-purple-100">
                          <Gavel className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-admin-text">Queue Directly into Live Auction</p>
                          <p className="text-[11px] text-admin-muted font-medium">
                            Automatically create auction lot numbers for these players in the live room.
                          </p>
                        </div>
                      </div>

                      <select
                        value={targetAuctionId}
                        onChange={(e) => setTargetAuctionId(e.target.value)}
                        className="px-3.5 py-2 bg-slate-50 border border-admin-border rounded-xl text-xs font-bold text-admin-text focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto"
                      >
                        <option value="">Do not queue to auction now (Add to tournament pool only)</option>
                        {auctions.map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.mode})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 3: Record Preview Table */}
                  <div className="bg-white rounded-3xl border border-admin-border/80 p-6 shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-black text-admin-text text-sm">Step 3: Data Preview (First 30 Rows)</h4>
                        <p className="text-xs text-admin-muted">Review parsed rows before committing to the database.</p>
                      </div>
                      <Badge variant="success" size="md">
                        {importJob.previewRows.filter((r: any) => r.isValid).length} Valid Records
                      </Badge>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-admin-border">
                          <tr>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Player Name</th>
                            <th className="py-3 px-3">Role</th>
                            <th className="py-3 px-3">Base Price</th>
                            <th className="py-3 px-3">Category</th>
                            <th className="py-3 px-3">City</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {importJob.previewRows.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-3">
                                {row.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" /> Valid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                    <AlertCircle className="w-3 h-3" /> {row.errors[0]}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-admin-text">{row.mapped.fullName}</td>
                              <td className="py-2.5 px-3 text-slate-600 font-medium">{row.mapped.role}</td>
                              <td className="py-2.5 px-3 font-black text-admin-text tabular-nums">
                                ₹{row.mapped.basePrice ? Number(row.mapped.basePrice).toLocaleString() : '1,000'}
                              </td>
                              <td className="py-2.5 px-3 text-purple-700 font-bold">{row.mapped.playerCategory}</td>
                              <td className="py-2.5 px-3 text-slate-500">{row.mapped.city || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 pt-5 border-t border-admin-border flex items-center justify-end gap-3">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setImportJob(null)}
                      >
                        Cancel
                      </Button>

                      <Button
                        variant="primary"
                        size="md"
                        loading={importing}
                        onClick={handleConfirmImport}
                        icon={ArrowRight}
                      >
                        {importing ? 'Importing & Saving Records...' : 'Confirm & Import Players'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Step 4: Import Complete Success Screen */
            <div className="bg-white rounded-3xl border border-admin-border/80 p-8 shadow-xs text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-admin-text tracking-tight">Import Completed Successfully!</h2>
              <p className="text-xs text-admin-muted mt-1.5">
                Processed <span className="font-bold text-admin-text">{resultSummary.totalRows} records</span> from uploaded sheet.
              </p>

              <div className="grid grid-cols-2 gap-3 my-6">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">Imported Players</span>
                  <span className="text-3xl font-black text-emerald-950 tabular-nums">{resultSummary.importedCount}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-admin-border">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Skipped / Invalid</span>
                  <span className="text-3xl font-black text-slate-700 tabular-nums">{resultSummary.invalidCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => router.push(`/tournaments/${tournamentId}/players`)}
                >
                  View Player Directory
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setResultSummary(null);
                    setImportJob(null);
                    setFile(null);
                  }}
                >
                  Import Another Sheet
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
