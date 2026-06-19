export interface MonthlyBreakdown {
  year: number
  month: number
  monthName: string
  totalAmount: number
  invoiceCount: number
}

export interface RecentInvoice {
  id: string
  fileName: string
  invoiceNumber?: string
  totalAmount?: number
  currency?: string
  status: string
  vendorName?: string
  createdAt: string
}

export interface DashboardData {
  totalInvoices: number
  pendingInvoices: number
  approvedInvoices: number
  failedInvoices: number
  totalSpend: number
  monthSpend: number
  monthlyBreakdown: MonthlyBreakdown[]
  recentInvoices: RecentInvoice[]
}