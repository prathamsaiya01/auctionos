'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, API_URL } from '@/lib/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertCircle,
  Download,
  ArrowRight,
  Gavel,
  RefreshCw
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

  // Fetch auctions for direct pool queuing
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

  return (
    <div className="flex min-h-screen bg-admin-secondary">
      <AdminSidebar tournamentId={tournamentId} />

      <main className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          title="Excel & CSV Bulk Import Engine"
          subtitle="Import hundreds of cricket players with intelligent column detection and automatic mapping"
          actions={
            <div className="flex items-center gap-2">
              <a
                href={`${API_URL}/imports/templates/basic`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Basic Template</span>
              </a>
              <a
                href={`${API_URL}/imports/templates/complete`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Complete Cricket Template</span>
              </a>
            </div>
          }
        />

        <div className="p-8 max-w-5xl space-y-6">
          {!resultSummary ? (
            <>
              {/* Step 1: Upload Card */}
              {!importJob ? (
                <div className="bg-white rounded-3xl border border-admin-border p-8 shadow-sm">
                  <div className="max-w-xl mx-auto text-center">
                    <div className="w-16 h-16 bg-blue-50 text-admin-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Upload Player Roster Sheet</h2>
                    <p className="text-xs text-gray-500 mt-1 mb-6">
                      Upload .xlsx or .csv files. Our intelligent column mapper automatically detects player names, mobile numbers, roles, categories, and base amounts.
                    </p>

                    <form onSubmit={handleFileUpload} className="space-y-4">
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-blue-500 transition-colors bg-gray-50/50">
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-admin-primary hover:file:bg-blue-100 cursor-pointer"
                        />
                        {file && (
                          <p className="text-xs font-bold text-green-700 mt-3">
                            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!file || uploading}
                        className="w-full py-3 bg-admin-primary hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Parsing Columns & Records...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Upload & Map Columns</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* Step 2: Mapping & Preview */
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-admin-border p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">Step 2: Review Intelligent Column Mapping</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Found {importJob.totalRows} rows in <span className="font-bold text-gray-700">{importJob.fileName}</span>.
                        </p>
                      </div>

                      <button
                        onClick={() => setImportJob(null)}
                        className="text-xs font-bold text-gray-500 hover:text-gray-900"
                      >
                        Upload Different File
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {['fullName', 'mobileNumber', 'role', 'basePrice', 'playerCategory', 'city', 'age'].map((field) => (
                        <div key={field} className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            {field.replace(/([A-Z])/g, ' $1')}
                          </label>
                          <select
                            value={mapping[field] || ''}
                            onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none"
                          >
                            <option value="">-- Ignore / Not in Excel --</option>
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
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gavel className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">Directly Queue into Live Auction Pool</p>
                          <p className="text-[11px] text-gray-500">
                            Automatically create auction lot numbers for these players.
                          </p>
                        </div>
                      </div>

                      <select
                        value={targetAuctionId}
                        onChange={(e) => setTargetAuctionId(e.target.value)}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                      >
                        <option value="">Do not add to auction now</option>
                        {auctions.map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.mode})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 3: Record Preview */}
                  <div className="bg-white rounded-2xl border border-admin-border p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900 text-sm">Data Preview (First 30 Rows)</h4>
                      <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        {importJob.previewRows.filter((r: any) => r.isValid).length} Valid Records
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                          <tr>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Player Name</th>
                            <th className="py-2.5 px-3">Role</th>
                            <th className="py-2.5 px-3">Base Price</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">City</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {importJob.previewRows.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="py-2.5 px-3">
                                {row.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-3 h-3" /> Valid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                                    <AlertCircle className="w-3 h-3" /> {row.errors[0]}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-gray-900">{row.mapped.fullName}</td>
                              <td className="py-2.5 px-3 text-gray-600">{row.mapped.role}</td>
                              <td className="py-2.5 px-3 font-semibold text-gray-800">
                                ₹{row.mapped.basePrice.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-purple-700 font-medium">{row.mapped.playerCategory}</td>
                              <td className="py-2.5 px-3 text-gray-500">{row.mapped.city || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                      <button
                        onClick={() => setImportJob(null)}
                        className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleConfirmImport}
                        disabled={importing}
                        className="px-6 py-2.5 bg-admin-primary hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {importing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Importing & Saving to Database...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm & Import Records</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Step 4: Import Complete Success Screen */
            <div className="bg-white rounded-3xl border border-admin-border p-8 shadow-sm text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Import Completed Successfully!</h2>
              <p className="text-xs text-gray-500 mt-2">
                Processed <span className="font-bold text-gray-900">{resultSummary.totalRows} records</span> from file.
              </p>

              <div className="grid grid-cols-2 gap-3 my-6">
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                  <span className="text-[10px] uppercase font-bold text-green-700 block">Imported Players</span>
                  <span className="text-2xl font-black text-green-900">{resultSummary.importedCount}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Skipped / Invalid</span>
                  <span className="text-2xl font-black text-gray-700">{resultSummary.invalidCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(`/tournaments/${tournamentId}/players`)}
                  className="flex-1 py-2.5 bg-admin-primary hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  View Player Roster
                </button>
                <button
                  onClick={() => {
                    setResultSummary(null);
                    setImportJob(null);
                    setFile(null);
                  }}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Import Another File
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
