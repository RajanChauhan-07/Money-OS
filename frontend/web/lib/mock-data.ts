import type {
  ExistingInvestments,
  EmployerDetails,
  FinancialGoal,
  Holding,
  InvestmentPlan,
  LifeSituation,
  MonthlyPlan,
  MutualFund,
  SalaryDetails,
  SalaryStructure,
  SIPMandate,
  TaxComparisonResult,
  TaxInput,
  Transaction,
  UserProfile,
} from '@money-os/types'
import { compareTaxRegimes } from '@money-os/tax-engine'

export interface CalendarEvent {
  month: string
  date: string
  title: string
  description: string
  status: 'done' | 'next' | 'upcoming'
  href: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  category: 'sip' | 'tax' | 'goal' | 'planning' | 'system'
  time: string
  href: string
  unread: boolean
}

export interface SupportArticle {
  title: string
  category: string
  readTime: string
}

export const mockUser: UserProfile = {
  id: 'user_rahul_001',
  name: 'Rahul Sharma',
  pan: 'ABCDE1234F',
  dob: '1990-05-15',
  gender: 'male',
  mobile: '+91 98765 43210',
  email: 'rahul.sharma@email.com',
  kycStatus: 'verified',
  createdAt: '2025-04-01T09:30:00.000Z',
}

export const mockSalary: SalaryDetails = {
  annualCTC: 1800000,
  inHandMonthly: 134867,
  variablePayPercent: 10,
  payFrequency: 'monthly',
}

export const mockStructure: SalaryStructure = {
  basicSalary: 38825,
  hra: 25000,
  lta: 2500,
  specialAllowance: 54000,
  otherAllowances: 9600,
  isMetroCity: true,
  cityName: 'Mumbai',
  monthlyRent: 25000,
}

export const mockEmployer: EmployerDetails = {
  epfEmployeePercent: 12,
  epfEmployerPercent: 12,
  hasEmployerNPS: false,
  employerNPSPercent: 0,
  companyName: 'Finrise Technologies India Pvt Ltd',
}

export const mockLife: LifeSituation = {
  isRenting: true,
  hasHomeLoan: true,
  homeLoanEMI: 19500,
  homeLoanOutstanding: 2450000,
  homeLoanInterestAnnual: 200000,
  homeLoanPrincipalAnnual: 0,
  dependentChildren: 0,
  hasSeniorParents: false,
  parentAge: 56,
  selfHealthPremium: 18000,
  familyHealthPremium: 0,
  parentHealthPremium: 0,
}

export const mockInvestments: ExistingInvestments = {
  ppfAnnual: 0,
  licPremiumAnnual: 0,
  elssAnnual: 20000,
  nscAnnual: 0,
  ssyAnnual: 0,
  tuitionFees: 0,
  epfEmployee: 72000,
  npsEmployee: 0,
  otherSection80C: 0,
}

export const mockTaxInput: TaxInput = {
  salary: mockSalary,
  structure: mockStructure,
  employer: mockEmployer,
  life: mockLife,
  investments: mockInvestments,
  financialYear: 'FY 2025-26',
}

export const computedTaxResult = compareTaxRegimes(mockTaxInput)

export const mockTaxResult: TaxComparisonResult = {
  ...computedTaxResult,
  reasoning:
    'Old Regime saves you about ₹34.2K a year because your Mumbai HRA claim, 80C usage, and second-home interest meaningfully reduce taxable income.',
}

export const mockGoals: FinancialGoal[] = [
  {
    id: 'goal_retirement',
    type: 'retirement',
    name: 'Retirement Corpus',
    targetAmount: 50000000,
    targetYear: 2050,
    currentSavings: 980000,
    priority: 1,
    monthlyRequired: 24000,
  },
  {
    id: 'goal_emergency',
    type: 'emergency',
    name: 'Emergency Fund',
    targetAmount: 600000,
    targetYear: 2026,
    currentSavings: 325000,
    priority: 2,
    monthlyRequired: 12000,
  },
  {
    id: 'goal_home',
    type: 'home',
    name: 'Home Down Payment',
    targetAmount: 3000000,
    targetYear: 2029,
    currentSavings: 640000,
    priority: 3,
    monthlyRequired: 18500,
  },
]

export const mockFunds: MutualFund[] = [
  {
    id: 'fund_elss_axis',
    name: 'Axis ELSS Tax Saver Fund',
    amcName: 'Axis MF',
    category: 'ELSS',
    nav: 86.12,
    navDate: '2026-04-28',
    returns1Y: 14.2,
    returns3Y: 18.6,
    returns5Y: 16.9,
    rating: 4,
    riskLevel: 'Very High',
    minSIP: 500,
    minLumpsum: 500,
    exitLoad: 'Nil after 3 years lock-in',
    isElss: true,
  },
  {
    id: 'fund_mirae_largecap',
    name: 'Mirae Asset Large Cap Fund',
    amcName: 'Mirae Asset MF',
    category: 'Large Cap',
    nav: 112.44,
    navDate: '2026-04-28',
    returns1Y: 12.7,
    returns3Y: 16.2,
    returns5Y: 15.1,
    rating: 5,
    riskLevel: 'High',
    minSIP: 1000,
    minLumpsum: 5000,
    exitLoad: '1% if redeemed within 1 year',
    isElss: false,
  },
  {
    id: 'fund_ppfas',
    name: 'Parag Parikh Flexi Cap Fund',
    amcName: 'PPFAS MF',
    category: 'Hybrid',
    nav: 74.31,
    navDate: '2026-04-28',
    returns1Y: 18.9,
    returns3Y: 21.4,
    returns5Y: 19.5,
    rating: 5,
    riskLevel: 'Moderately High',
    minSIP: 1000,
    minLumpsum: 1000,
    exitLoad: '2% up to 365 days',
    isElss: false,
  },
  {
    id: 'fund_nifty_index',
    name: 'UTI Nifty 50 Index Fund',
    amcName: 'UTI MF',
    category: 'Index',
    nav: 188.72,
    navDate: '2026-04-28',
    returns1Y: 13.1,
    returns3Y: 15.2,
    returns5Y: 14.0,
    rating: 4,
    riskLevel: 'High',
    minSIP: 500,
    minLumpsum: 1000,
    exitLoad: 'Nil',
    isElss: false,
  },
  {
    id: 'fund_bharat_bond',
    name: 'Bharat Bond FOF',
    amcName: 'Edelweiss MF',
    category: 'Debt',
    nav: 18.42,
    navDate: '2026-04-28',
    returns1Y: 7.3,
    returns3Y: 7.8,
    returns5Y: 7.6,
    rating: 4,
    riskLevel: 'Moderately Low',
    minSIP: 1000,
    minLumpsum: 5000,
    exitLoad: 'Nil',
    isElss: false,
  },
]

export const mockMandates: SIPMandate[] = [
  {
    id: 'sip_001',
    fundId: 'fund_elss_axis',
    fundName: 'Axis ELSS Tax Saver Fund',
    amount: 5000,
    frequency: 'monthly',
    sipDate: 5,
    startDate: '2025-05-05',
    status: 'active',
    nextDebitDate: '2026-05-05',
  },
  {
    id: 'sip_002',
    fundId: 'fund_mirae_largecap',
    fundName: 'Mirae Asset Large Cap Fund',
    amount: 4000,
    frequency: 'monthly',
    sipDate: 7,
    startDate: '2025-05-07',
    status: 'active',
    nextDebitDate: '2026-05-07',
  },
  {
    id: 'sip_003',
    fundId: 'fund_ppfas',
    fundName: 'Parag Parikh Flexi Cap Fund',
    amount: 3000,
    frequency: 'monthly',
    sipDate: 10,
    startDate: '2025-05-10',
    status: 'active',
    nextDebitDate: '2026-05-10',
  },
  {
    id: 'sip_004',
    fundId: 'fund_nifty_index',
    fundName: 'UTI Nifty 50 Index Fund',
    amount: 2500,
    frequency: 'monthly',
    sipDate: 12,
    startDate: '2025-05-12',
    status: 'active',
    nextDebitDate: '2026-05-12',
  },
  {
    id: 'sip_005',
    fundId: 'fund_bharat_bond',
    fundName: 'Bharat Bond FOF',
    amount: 3000,
    frequency: 'monthly',
    sipDate: 18,
    startDate: '2025-05-18',
    status: 'active',
    nextDebitDate: '2026-05-18',
  },
]

export const mockHoldings: Holding[] = [
  {
    fundId: 'fund_elss_axis',
    fundName: 'Axis ELSS Tax Saver Fund',
    units: 932.14,
    avgNav: 70.72,
    currentNav: 86.12,
    investedAmount: 65930,
    currentValue: 80282,
    gainLoss: 14352,
    gainLossPercent: 21.77,
    xirr: 15.6,
    goalId: 'goal_home',
    section: '80C',
  },
  {
    fundId: 'fund_mirae_largecap',
    fundName: 'Mirae Asset Large Cap Fund',
    units: 905.44,
    avgNav: 94.95,
    currentNav: 112.44,
    investedAmount: 85950,
    currentValue: 101793,
    gainLoss: 15843,
    gainLossPercent: 18.43,
    xirr: 12.4,
    goalId: 'goal_retirement',
  },
  {
    fundId: 'fund_ppfas',
    fundName: 'Parag Parikh Flexi Cap Fund',
    units: 743.82,
    avgNav: 62.42,
    currentNav: 74.31,
    investedAmount: 46430,
    currentValue: 55279,
    gainLoss: 8849,
    gainLossPercent: 19.06,
    xirr: 14.3,
    goalId: 'goal_retirement',
  },
  {
    fundId: 'fund_nifty_index',
    fundName: 'UTI Nifty 50 Index Fund',
    units: 730.15,
    avgNav: 173.56,
    currentNav: 188.72,
    investedAmount: 126700,
    currentValue: 137791,
    gainLoss: 11091,
    gainLossPercent: 8.75,
    xirr: 10.6,
    goalId: 'goal_home',
  },
  {
    fundId: 'fund_bharat_bond',
    fundName: 'Bharat Bond FOF',
    units: 2597.99,
    avgNav: 23.09,
    currentNav: 18.42,
    investedAmount: 59990,
    currentValue: 47855,
    gainLoss: -12135,
    gainLossPercent: -20.23,
    xirr: 4.9,
    goalId: 'goal_emergency',
  },
]

const transactionDates = [
  '2025-09-05',
  '2025-10-05',
  '2025-11-05',
  '2025-12-05',
  '2026-01-05',
  '2026-02-05',
  '2026-03-05',
  '2026-04-05',
]

export const mockTransactions: Transaction[] = transactionDates.flatMap((date, index) => [
  {
    id: `txn_elss_${index + 1}`,
    type: 'SIP',
    fundId: 'fund_elss_axis',
    fundName: 'Axis ELSS Tax Saver Fund',
    amount: 5000,
    units: 57.4 + index * 0.5,
    nav: 87.11 - index * 0.4,
    date,
    status: 'allotted',
    orderId: `ORD-ELSS-${index + 1}`,
  },
  {
    id: `txn_large_${index + 1}`,
    type: 'SIP',
    fundId: 'fund_mirae_largecap',
    fundName: 'Mirae Asset Large Cap Fund',
    amount: 4000,
    units: 35.8 + index * 0.4,
    nav: 111.42 - index * 0.2,
    date,
    status: 'allotted',
    orderId: `ORD-LC-${index + 1}`,
  },
])

export const mockMonthlyPlan: MonthlyPlan[] = [
  { month: 3, year: 2025, income: 135000, fixedOutflows: 76000, investableAmount: 59000, sipDebitDate: 5, isLumpsumMonth: false, remainingAfterSIP: 76000 },
  { month: 4, year: 2025, income: 135000, fixedOutflows: 74500, investableAmount: 60500, sipDebitDate: 5, isLumpsumMonth: false, remainingAfterSIP: 74500 },
  { month: 5, year: 2025, income: 135000, fixedOutflows: 76000, investableAmount: 59000, sipDebitDate: 5, isLumpsumMonth: false, remainingAfterSIP: 76000 },
  { month: 6, year: 2025, income: 135000, fixedOutflows: 78000, investableAmount: 57000, sipDebitDate: 5, isLumpsumMonth: false, remainingAfterSIP: 78000 },
  { month: 7, year: 2025, income: 135000, fixedOutflows: 75000, investableAmount: 60000, sipDebitDate: 5, isLumpsumMonth: true, lumpsumSuggestion: 25000, remainingAfterSIP: 75000 },
  { month: 8, year: 2025, income: 135000, fixedOutflows: 76000, investableAmount: 59000, sipDebitDate: 5, isLumpsumMonth: false, remainingAfterSIP: 76000 },
  { month: 9, year: 2025, income: 135000, fixedOutflows: 78000, investableAmount: 57000, sipDebitDate: 5, isLumpsumMonth: false, remainingAfterSIP: 78000 },
  { month: 10, year: 2025, income: 135000, fixedOutflows: 77000, investableAmount: 58000, sipDebitDate: 5, isLumpsumMonth: false, remainingAfterSIP: 77000 },
  { month: 11, year: 2025, income: 135000, fixedOutflows: 76000, investableAmount: 59000, sipDebitDate: 5, isLumpsumMonth: false, remainingAfterSIP: 76000 },
  { month: 0, year: 2026, income: 135000, fixedOutflows: 75000, investableAmount: 60000, sipDebitDate: 5, isLumpsumMonth: true, lumpsumSuggestion: 15000, remainingAfterSIP: 75000 },
  { month: 1, year: 2026, income: 135000, fixedOutflows: 76500, investableAmount: 58500, sipDebitDate: 5, isLumpsumMonth: false, remainingAfterSIP: 76500 },
  { month: 2, year: 2026, income: 135000, fixedOutflows: 78000, investableAmount: 57000, sipDebitDate: 5, isLumpsumMonth: false, remainingAfterSIP: 78000 },
]

export const mockInvestmentPlan: InvestmentPlan = {
  allocations: [
    { instrument: 'EPF', section: '80C', annualAmount: 72000, monthlyAmount: 6000, risk: 'low', lockIn: 0, expectedReturn: 8.1, taxSaving: 22464, priority: 1 },
    { instrument: 'Axis ELSS Tax Saver Fund', section: '80C', annualAmount: 60000, monthlyAmount: 5000, goalId: 'goal_home', risk: 'high', lockIn: 3, expectedReturn: 12.5, taxSaving: 18720, priority: 2 },
    { instrument: 'Health insurance premium', section: '80D', annualAmount: 18000, monthlyAmount: 1500, risk: 'low', lockIn: 1, expectedReturn: 0, taxSaving: 5616, priority: 3 },
    { instrument: 'Parag Parikh Flexi Cap Fund', section: 'Other', annualAmount: 36000, monthlyAmount: 3000, goalId: 'goal_retirement', risk: 'high', lockIn: 0, expectedReturn: 13.0, taxSaving: 0, priority: 4 },
    { instrument: 'Bharat Bond FOF', section: 'Other', annualAmount: 36000, monthlyAmount: 3000, goalId: 'goal_emergency', risk: 'low', lockIn: 0, expectedReturn: 7.4, taxSaving: 0, priority: 5 },
  ],
  totalAnnualInvestment: 222000,
  section80CUsed: 92000,
  section80DUsed: 18000,
  npsUsed: 0,
  projectedTaxSaving: 34200,
  monthlyPlan: mockMonthlyPlan,
  feasibility: 'moderate',
  monthlyAffordability: 19500,
  generatedAt: '2026-04-29T09:00:00.000Z',
}

export const portfolioSummary = {
  investedAmount: 385000,
  currentValue: 423000,
  gainLoss: 38000,
  gainLossPercent: 9.87,
  xirr: 11.2,
}

export const dashboardMetrics = {
  taxSaved: 34200,
  section80CUsed: 92000,
  section80CMax: 150000,
  section80DUsed: 18000,
  section80DMax: 25000,
  npsUsed: 0,
  npsMax: 50000,
  monthlySurplus: 59000,
}

export const mockCalendarEvents: CalendarEvent[] = [
  {
    month: 'Apr',
    date: '05 Apr',
    title: 'Kick off monthly SIPs',
    description: 'Confirm your five SIP mandates have debited after salary credit.',
    status: 'done',
    href: '/history/sip-management',
  },
  {
    month: 'Jun',
    date: '15 Jun',
    title: 'Advance tax check',
    description: 'Variable pay landed. Review tax tracker before Q1 advance tax.',
    status: 'next',
    href: '/tracker',
  },
  {
    month: 'Jul',
    date: '31 Jul',
    title: 'ITR filing window',
    description: 'Use the tax report and capital gains statement for filing.',
    status: 'upcoming',
    href: '/reports/tax',
  },
  {
    month: 'Jan',
    date: '20 Jan',
    title: 'Employer proof submission',
    description: 'Export the investment plan PDF in Form 12BB format.',
    status: 'upcoming',
    href: '/reports/investment-plan',
  },
  {
    month: 'Mar',
    date: '31 Mar',
    title: 'Final deduction deadline',
    description: 'Use remaining 80C and 80D headroom before year close.',
    status: 'upcoming',
    href: '/plan/summary',
  },
]

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif_001',
    title: 'SIP processed successfully',
    body: 'Your Axis ELSS SIP for ₹5,000 was allotted at NAV 86.12.',
    category: 'sip',
    time: '2h ago',
    href: '/notifications/sip-alert',
    unread: true,
  },
  {
    id: 'notif_002',
    title: '80C headroom still available',
    body: 'You can still invest ₹58,000 before 31 March to optimize old regime savings.',
    category: 'tax',
    time: 'Yesterday',
    href: '/notifications/tax-reminder',
    unread: true,
  },
  {
    id: 'notif_003',
    title: 'Emergency fund hit 54%',
    body: 'You crossed the halfway mark for your emergency fund target.',
    category: 'goal',
    time: '2d ago',
    href: '/notifications/goal-milestone',
    unread: false,
  },
  {
    id: 'notif_004',
    title: 'Salary hike season check-in',
    body: 'Update your salary structure to refresh your annual plan.',
    category: 'planning',
    time: '4d ago',
    href: '/notifications/replan',
    unread: false,
  },
  {
    id: 'notif_005',
    title: 'Budget update available',
    body: 'A slab change is live. Recalculate your plan in under a minute.',
    category: 'system',
    time: '1w ago',
    href: '/law-change',
    unread: false,
  },
]

export const mockSupportArticles: SupportArticle[] = [
  { title: 'How to submit Form 12BB through HR', category: 'Tax', readTime: '4 min' },
  { title: 'Why old regime wins for dual-city salaried users', category: 'Planning', readTime: '6 min' },
  { title: 'How ELSS lock-in affects redemption timelines', category: 'Investments', readTime: '5 min' },
  { title: 'When re-KYC is required and how to finish it fast', category: 'KYC', readTime: '3 min' },
]

export const mockTaxBreakdown = [
  { section: '80C', used: 92000, max: 150000, note: 'EPF and ELSS are doing most of the work.' },
  { section: '80D', used: 18000, max: 25000, note: 'You still have room for a small top-up policy.' },
  { section: 'NPS', used: 0, max: 50000, note: 'Pure opportunity if you are comfortable with retirement lock-in.' },
  { section: 'HRA', used: 232950, max: 300000, note: 'Mumbai rent meaningfully improves the old regime outcome.' },
]

export const yearlyReturnSeries = [
  { label: 'May', value: 388000 },
  { label: 'Jun', value: 392000 },
  { label: 'Jul', value: 397500 },
  { label: 'Aug', value: 401800 },
  { label: 'Sep', value: 405200 },
  { label: 'Oct', value: 409600 },
  { label: 'Nov', value: 412400 },
  { label: 'Dec', value: 416900 },
  { label: 'Jan', value: 419100 },
  { label: 'Feb', value: 421500 },
  { label: 'Mar', value: 422200 },
  { label: 'Apr', value: 423000 },
]
