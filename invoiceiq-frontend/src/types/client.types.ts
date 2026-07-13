// All types related to Clients (off-licence shops)

export interface Client {
  id: string
  accountantId: string
  businessName: string
  tradingName?: string
  clientType: string          // 'OffLicence' | 'Restaurant' | 'Supermarket'
  ownerFullName?: string
  ownerEmail?: string
  ownerPhone?: string
  businessAddress?: string
  businessPostcode?: string
  localAuthority?: string
  companyRegistrationNumber?: string
  vatRegistrationNumber?: string
  vatRegistrationDate?: string
  baseCurrency: string
  financialYearEnd?: string
  awrsUrn?: string
  awrsRegistrationDate?: string
  monthlyFee: number
  isActive: boolean
  onboardedAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateClientRequest {
  businessName: string
  tradingName?: string
  clientType?: string
  ownerFullName?: string
  ownerEmail?: string
  ownerPhone?: string
  businessAddress?: string
  businessPostcode?: string
  localAuthority?: string
  vatRegistrationNumber?: string
  awrsUrn?: string
  monthlyFee?: number
}

export interface ClientDashboard {
  clientId: string
  businessName: string
  totalInvoices: number
  pendingInvoices: number
  approvedInvoices: number
  failedInvoices: number
  totalSpend: number
  vatReturnDue?: string
  premisesLicenceExpiry?: string
  alcoholDutyDue?: string
  complianceAlerts: number
  monthlyBreakdown?: { monthName: string; totalAmount: number }[]
  recentInvoices?: {
    id: string
    vendorName?: string
    totalAmount?: number
    status: string
    createdAt: string
  }[]
}

export interface PremisesLicence {
  id: string
  clientId: string
  licenceNumber: string
  issuingAuthority?: string
  issueDate?: string
  expiryDate?: string
  dpsFullName?: string
  dpsPersonalLicenceNumber?: string
  dpsLicenceExpiryDate?: string
  licensedActivities?: string
  documentUrl?: string
  notes?: string
}

export interface AwrsCompliance {
  id: string
  clientId: string
  awrsUrn?: string
  registrationDate?: string
  lastInspectionDate?: string
  inspectionResult: string    // 'Pass' | 'Fail' | 'Advisory' | 'Pending'
  nextReviewDate?: string
  notes?: string
  isRegistered: boolean
}

// GET /api/accountant/dashboard
export interface AccountantDashboard {
  totalClients: number
  activeClients: number
  openTasks: number
  unresolvedAlerts: number
  criticalAlerts: number
  draftVatReturns: number
  invoicesThisMonth: number
  monthlyRecurringFees: number
  recentAlerts: ComplianceAlert[]
}

export interface ComplianceAlert {
  id: string
  clientId: string
  alertType: string
  severity: string            // 'Warning' | 'Urgent' | 'Critical'
  title: string
  message: string
  dueDate?: string
  isResolved: boolean
  createdAt: string
}

export interface AlcoholDutyPeriod {
  id: string
  clientId: string
  periodFrom: string
  periodTo: string
  quarterLabel?: string
  beerDutyAmount: number
  wineDutyAmount: number
  spiritsDutyAmount: number
  ciderDutyAmount: number
  totalDutyPayable: number
  finalDutyPayable: number
  smallProducerRelief: boolean
  reliefAmount: number
  isSubmitted: boolean
  submittedAt?: string
  hmrcReference?: string
  dueDate?: string
  notes?: string
  createdAt: string
  lineItems?: AlcoholDutyLineItem[]
}

export interface AlcoholDutyLineItem {
  id: string
  dutyCategory: string
  abvBand: string
  totalLitresPurchased: number
  litresOfPureAlcohol: number
  dutyRatePerLitre: number
  dutyAmount: number
}

export interface AlcoholDutyRate {
  id: string
  dutyCategory: string
  abvBand: string
  abvFrom: number
  abvTo: number
  ratePerLitre: number
  effectiveFrom: string
  description: string
}

export interface VatReturn {
  id: string
  clientId: string
  periodFrom: string
  periodTo: string
  periodKey?: string
  box1_VatOnSales: number
  box2_VatOnAcquisitions: number
  box3_TotalVatDue: number
  box4_VatReclaimed: number
  box5_NetVatPayable: number
  box6_NetSalesValue: number
  box7_NetPurchasesValue: number
  box8_NetEuSupplies: number
  box9_NetEuAcquisitions: number
  status: string              // 'Draft' | 'ReadyToSubmit' | 'Submitted' | 'Accepted'
  submittedAt?: string
  hmrcReceiptId?: string
  paymentDueDate?: string
  notes?: string
  createdAt: string
}

export interface ManagementAccount {
  id: string
  clientId: string
  month: number
  year: number
  alcoholSalesRevenue: number
  tobaccoSalesRevenue: number
  grocerySalesRevenue: number
  lotteryCommission: number
  otherRevenue: number
  totalRevenue: number
  totalCostOfGoods: number
  grossProfit: number
  grossMarginPercent: number
  totalOverheads: number
  netProfitBeforeTax: number
  taxProvision: number
  netProfitAfterTax: number
  status: string              // 'Draft' | 'Prepared' | 'SentToClient' | 'Approved'
  sentToClientAt?: string
  clientApprovedAt?: string
  notes?: string
  createdAt: string
}
