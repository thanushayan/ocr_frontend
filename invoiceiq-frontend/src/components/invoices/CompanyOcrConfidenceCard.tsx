'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronDown, ChevronRight, Gauge } from 'lucide-react'
import { invoiceService } from '../../services/invoice.service'

// Company-wide OCR confidence analytics + threshold control.
// Wires GET /ocr/confidence-report and PUT /ocr/confidence-threshold.
export function CompanyOcrConfidenceCard({ companyId }: { companyId: string }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['companyOcrConfidence', companyId],
    queryFn: () => invoiceService.getCompanyConfidenceReport(companyId),
    enabled: open && !!companyId, // lazy: only fetch when expanded
  })

  const [threshold, setThreshold] = useState<number | null>(null)
  const [autoFlag, setAutoFlag] = useState(true)
  const thresholdPct = threshold ?? Math.round((data?.threshold ?? 0.8) * 100)

  const save = useMutation({
    mutationFn: () => invoiceService.setConfidenceThreshold(companyId, {
      threshold: Math.min(1, Math.max(0, thresholdPct / 100)),
      autoFlagLowConfidence: autoFlag,
    }),
    onSuccess: () => {
      toast.success('Confidence threshold updated.')
      setThreshold(null)
      qc.invalidateQueries({ queryKey: ['companyOcrConfidence', companyId] })
    },
    onError: () => toast.error('Could not update the threshold.'),
  })

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <Gauge className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-bold text-gray-900 flex-1">OCR confidence (company)</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : isError || !data ? (
            <div className="text-sm text-gray-400 py-6 text-center">
              Couldn&rsquo;t load the confidence report.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Stat tiles */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Threshold', `${Math.round(data.threshold * 100)}%`],
                  ['Invoices processed', String(data.totalInvoicesProcessed)],
                  ['Low-confidence', String(data.lowConfidenceCount)],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">{k}</div>
                    <div className="text-lg font-bold text-gray-900 tabular-nums">{v}</div>
                  </div>
                ))}
              </div>

              {/* Per-field averages */}
              {data.fieldAverages.length > 0 ? (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Field</th>
                        <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Avg score</th>
                        <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Low-conf</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.fieldAverages.map(f => (
                        <tr key={f.fieldName}>
                          <td className="px-3 py-2 font-semibold text-gray-700">{f.fieldName}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">{Math.round(f.averageScore * 100)}%</td>
                          <td className="px-3 py-2 text-right tabular-nums text-gray-500">{f.lowConfidenceCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-4">No field data yet.</div>
              )}

              {/* Threshold control */}
              <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Low-confidence threshold (%)</label>
                  <input
                    type="number" min={0} max={100}
                    value={thresholdPct}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="h-9 w-28 px-3 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <label className="flex items-center gap-2 h-9 text-sm text-gray-600">
                  <input type="checkbox" checked={autoFlag} onChange={e => setAutoFlag(e.target.checked)} />
                  Auto-flag low confidence
                </label>
                <button
                  onClick={() => save.mutate()}
                  disabled={save.isPending}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {save.isPending ? 'Saving…' : 'Update threshold'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}