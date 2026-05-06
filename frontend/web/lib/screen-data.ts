import { formatRupee } from '@/lib/utils/format'
import {
  computedTaxResult,
  dashboardMetrics,
  mockCalendarEvents,
  mockFunds,
  mockGoals,
  mockHoldings,
  mockInvestmentPlan,
  mockMandates,
  mockNotifications,
  mockSupportArticles,
  mockTaxBreakdown,
  mockTransactions,
  mockUser,
  portfolioSummary,
  yearlyReturnSeries,
} from '@/lib/mock-data'
import type { ActionLink, ScreenCard, ScreenConfig, ScreenVariant } from './screen-types'

const primary = (label: string, href: string, variant: ActionLink['variant'] = 'primary'): ActionLink => ({
  label,
  href,
  variant,
})

const authMeta = ['Dark/light ready', 'Responsive at 375px+', 'Animated entry']

export const authScreens: Record<string, ScreenConfig> = {
  splash: {
    id: 'S01',
    title: 'Money OS',
    description: 'Tax-optimized annual savings planning for Indian salaried professionals.',
    badge: 'Launch',
    meta: ['Made for India', 'Bank-grade security', 'FY 2025-26 ready'],
    primaryAction: primary('Get started', '/welcome'),
    secondaryAction: primary('Log in', '/login', 'ghost'),
    blocks: [
      {
        type: 'cards',
        columns: 3,
        items: [
          { eyebrow: 'Secure', title: 'Private by default', description: 'Your salary, deductions, and investments stay neatly compartmentalized.', tone: 'info' },
          { eyebrow: 'Clarity', title: 'Know your best regime', description: 'See old vs new regime outcomes before you lock in annual decisions.', tone: 'brand' },
          { eyebrow: 'Execution', title: 'Plan month by month', description: 'Turn annual tax strategy into SIPs, deadlines, and one clear next action.', tone: 'success' },
        ],
      },
      { type: 'cta', title: 'Start your annual plan', description: 'It takes a few minutes to set up the profile that drives the full planner.', primary: primary('Continue', '/welcome') },
    ],
  },
  welcome: {
    id: 'S02',
    title: 'A calmer way to run your financial year',
    description: 'Compare regimes, map deductions, and keep savings aligned with actual life goals.',
    badge: 'Welcome',
    meta: authMeta,
    primaryAction: primary('Create free account', '/signup'),
    secondaryAction: primary('Sign in', '/login', 'ghost'),
    blocks: [
      {
        type: 'cards',
        columns: 2,
        items: [
          { eyebrow: 'Regimes', title: 'Know where the money goes', description: 'We break gross income, deductions, taxable income, cess, and take-home into one view.' },
          { eyebrow: 'Planner', title: 'Invest with a tax reason', description: 'Every suggested SIP maps to 80C, 80D, NPS, or a personal goal instead of floating in space.' },
          { eyebrow: 'Tracker', title: 'Stay ahead of deadlines', description: 'Advance tax, proof submission, ITR, and March 31 all stay visible in one calendar.' },
          { eyebrow: 'Portfolio', title: 'Read the year, not just the day', description: 'XIRR, goal progress, and annual cash flow sit together so tradeoffs are easier to see.' },
        ],
      },
    ],
  },
  signup: {
    id: 'S03',
    title: 'Create your Money OS account',
    description: 'Start with your contact details and we will take you straight into the tax setup flow.',
    badge: 'Required',
    meta: authMeta,
    primaryAction: primary('Send OTP', '/otp'),
    secondaryAction: primary('Already have an account', '/login', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'Full name', type: 'text', value: '', placeholder: 'Your full name' },
          { label: 'Mobile number', type: 'text', value: '', placeholder: '10-digit mobile number' },
          { label: 'Email address', type: 'email', value: '', placeholder: 'you@example.com' },
        ],
      },
      {
        type: 'list',
        title: 'What unlocks next',
        style: 'check',
        items: ['OTP verification', 'PAN confirmation', 'KYC and bank setup', 'Salary and deductions profiling'],
      },
    ],
  },
  otp: {
    id: 'S04',
    title: 'Verify your mobile number',
    description: 'A six-digit OTP keeps the session tied to your number before we move into profile setup.',
    badge: '60s timer',
    meta: authMeta,
    primaryAction: primary('Verify OTP', '/profile'),
    secondaryAction: primary('Resend code', '/otp', 'ghost'),
    blocks: [
      { type: 'fields', items: [{ label: 'OTP', type: 'otp', value: '_ _ _ _ _ _', hint: 'Enter the 6-digit code sent to your mobile.' }] },
      {
        type: 'cards',
        items: [
          { eyebrow: 'Security', title: 'Auto-read if available', description: 'On supported devices the code can be picked up automatically from SMS.' },
          { eyebrow: 'Fallback', title: 'Recovery is built in', description: 'Three failed attempts trigger a cooldown instead of silently locking you out.' },
        ],
      },
    ],
  },
  login: {
    id: 'S05',
    title: 'Welcome back',
    description: 'Use email, OTP, or MPIN to re-enter your plan and keep the year moving.',
    badge: 'Returning user',
    meta: authMeta,
    primaryAction: primary('Sign in', '/dashboard'),
    secondaryAction: primary('Create account', '/signup', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'Mobile number', type: 'text', value: '', placeholder: '10-digit mobile number' },
        ],
      },
      {
        type: 'list',
        title: 'Faster options',
        style: 'chip',
        items: ['OTP login', 'MPIN login', 'Biometric unlock'],
      },
    ],
  },
  profile: {
    id: 'S06',
    title: 'Create your profile',
    description: 'A few personal details help us place deadlines, retirement horizons, and compliance checks correctly.',
    badge: 'Step 1 of 6',
    meta: authMeta,
    primaryAction: primary('Continue to PAN', '/pan'),
    secondaryAction: primary('Back', '/login', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'Full name', type: 'text', value: mockUser.name },
          { label: 'Date of birth', type: 'date', value: mockUser.dob },
          { label: 'Gender', type: 'select', value: 'Male', options: ['Male', 'Female', 'Other'] },
          { label: 'Primary email', type: 'email', value: mockUser.email },
        ],
      },
    ],
  },
  pan: {
    id: 'S07',
    title: 'Verify PAN',
    description: 'This is the anchor for tax planning, deductions, and investment account setup.',
    badge: 'Step 2 of 6',
    meta: authMeta,
    primaryAction: primary('Verify PAN', '/kyc'),
    secondaryAction: primary('Back', '/profile', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'PAN number', type: 'text', value: mockUser.pan },
          { label: 'Legal name as per PAN', type: 'text', value: mockUser.name },
        ],
      },
      {
        type: 'cards',
        items: [
          { eyebrow: 'Why', title: 'Helps compare real tax outcomes', description: 'PAN identity keeps projected deductions and reports tied to the right person.' },
          { eyebrow: 'Matching', title: 'Name mismatch is flagged gently', description: 'You can still continue and resolve small spelling differences later.' },
        ],
      },
    ],
  },
  kyc: {
    id: 'S08',
    title: 'Complete Aadhaar eKYC',
    description: 'Identity and address verification keep the investment side ready when you choose to execute the plan.',
    badge: 'Step 3 of 6',
    meta: authMeta,
    primaryAction: primary('Send Aadhaar OTP', '/face'),
    secondaryAction: primary('Back', '/pan', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'Aadhaar number', type: 'text', value: 'XXXX XXXX 4521' },
          { label: 'Consent confirmed', type: 'toggle', value: true },
          { label: 'Address preview', type: 'textarea', value: 'Andheri East, Mumbai, Maharashtra 400069' },
        ],
      },
    ],
  },
  face: {
    id: 'S09',
    title: 'Run the face liveness check',
    description: 'This is the last verification step before account and bank setup.',
    badge: 'Camera',
    meta: authMeta,
    primaryAction: primary('Start scan', '/bank'),
    secondaryAction: primary('Back', '/kyc', 'ghost'),
    blocks: [
      {
        type: 'list',
        title: 'How the scan works',
        style: 'check',
        items: ['Hold the phone at eye level', 'Blink when prompted', 'Turn slightly left and right', 'Retry if the lighting is poor'],
      },
      {
        type: 'cards',
        items: [
          { eyebrow: 'Fallback', title: 'VKYC stays available', description: 'If liveness fails a few times, the app can shift you into an assisted review flow.' },
        ],
      },
    ],
  },
  bank: {
    id: 'S10',
    title: 'Link your bank account',
    description: 'Bank verification is optional right now, but it removes friction once you start SIPs or redemptions.',
    badge: 'Optional',
    meta: authMeta,
    primaryAction: primary('Verify bank', '/mpin'),
    secondaryAction: primary('Skip for now', '/mpin', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'Account number', type: 'text', value: 'XXXXXX9182' },
          { label: 'IFSC code', type: 'text', value: 'HDFC0001744' },
          { label: 'UPI ID', type: 'text', value: 'rahul@okhdfcbank' },
          { label: 'Penny drop status', type: 'toggle', value: true },
        ],
      },
    ],
  },
  mpin: {
    id: 'S11',
    title: 'Set your six-digit MPIN',
    description: 'This gives returning access a fast path on mobile without exposing your full account password.',
    badge: 'Security',
    meta: authMeta,
    primaryAction: primary('Finish setup', '/salary'),
    secondaryAction: primary('Back', '/bank', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'Create MPIN', type: 'pin', value: '1 8 0 5 2 6' },
          { label: 'Confirm MPIN', type: 'pin', value: '1 8 0 5 2 6' },
          { label: 'Enable biometric unlock', type: 'toggle', value: true },
        ],
      },
    ],
  },
}

export const onboardingScreens: Record<string, ScreenConfig> = {
  salary: {
    id: 'S12',
    title: 'Tell us about your salary',
    description: 'This sets the annual envelope for every tax, cash flow, and investment recommendation.',
    badge: 'Step 1 of 7',
    meta: ['Uses salary structure later', 'Variable pay aware'],
    primaryAction: primary('Save salary details', '/structure'),
    secondaryAction: primary('Back', '/mpin', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'Annual CTC', type: 'number', value: 1800000 },
          { label: 'In-hand per month', type: 'number', value: 134867 },
          { label: 'Variable pay percent', type: 'slider', value: 10, min: 0, max: 40, step: 1 },
          { label: 'Pay frequency', type: 'select', value: 'Monthly', options: ['Monthly', 'Quarterly'] },
        ],
      },
    ],
  },
  structure: {
    id: 'S13',
    title: 'Map the salary structure',
    description: 'Basic salary and HRA are the levers that matter most for Rahul’s Mumbai rent story.',
    badge: 'Step 2 of 7',
    primaryAction: primary('Continue to employer', '/employer'),
    secondaryAction: primary('Back', '/salary', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'Monthly basic salary', type: 'number', value: 38825 },
          { label: 'Monthly HRA', type: 'number', value: 25000 },
          { label: 'LTA per month', type: 'number', value: 2500 },
          { label: 'Metro city status', type: 'toggle', value: true },
          { label: 'Monthly rent', type: 'number', value: 25000 },
          { label: 'City', type: 'text', value: 'Mumbai' },
        ],
      },
    ],
  },
  employer: {
    id: 'S14',
    title: 'Add employer and EPF details',
    description: 'This is where we capture what is already being done automatically on payroll.',
    badge: 'Step 3 of 7',
    primaryAction: primary('Continue to life', '/life'),
    secondaryAction: primary('Back', '/structure', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'Company name', type: 'text', value: 'Finrise Technologies India Pvt Ltd' },
          { label: 'Employee EPF percent', type: 'number', value: 12 },
          { label: 'Employer EPF percent', type: 'number', value: 12 },
          { label: 'Employer NPS available', type: 'toggle', value: false },
        ],
      },
      {
        type: 'banner',
        title: 'Current auto-contribution',
        description: 'EPF already uses ₹72,000 of your 80C basket, which is why the planner does not treat the full ₹1.5L as empty space.',
        tone: 'info',
      },
    ],
  },
  life: {
    id: 'S15',
    title: 'Capture real-life tax context',
    description: 'Rent, loans, and insurance change the answer more than most people expect.',
    badge: 'Step 4 of 7',
    primaryAction: primary('Continue to investments', '/investments'),
    secondaryAction: primary('Back', '/employer', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'Currently renting', type: 'toggle', value: true },
          { label: 'Monthly rent', type: 'number', value: 25000 },
          { label: 'Own a home with loan', type: 'toggle', value: true },
          { label: 'Annual home-loan interest', type: 'number', value: 200000 },
          { label: 'Health premium for self', type: 'number', value: 18000 },
          { label: 'Dependent children', type: 'number', value: 0 },
        ],
      },
    ],
  },
  investments: {
    id: 'S16',
    title: 'Add existing tax-saving investments',
    description: 'We count what is already on the books first so the annual plan does not double-assign money.',
    badge: 'Step 5 of 7',
    primaryAction: primary('Continue to goals', '/goals'),
    secondaryAction: primary('Back', '/life', 'ghost'),
    blocks: [
      {
        type: 'fields',
        columns: 2,
        items: [
          { label: 'EPF employee contribution', type: 'number', value: 72000 },
          { label: 'ELSS invested so far', type: 'number', value: 20000 },
          { label: 'PPF annual contribution', type: 'number', value: 0 },
          { label: 'NPS employee contribution', type: 'number', value: 0 },
        ],
      },
      {
        type: 'section-progress',
        items: [{ label: 'Current 80C usage', used: 92000, max: 150000, section: '80C' }],
      },
    ],
  },
  goals: {
    id: 'S17',
    title: 'Define the goals behind the tax plan',
    description: 'A smart tax plan is nicer when it also knows which buckets matter first.',
    badge: 'Step 6 of 7',
    primaryAction: primary('Continue to risk', '/risk'),
    secondaryAction: primary('Back', '/investments', 'ghost'),
    blocks: [
      {
        type: 'cards',
        columns: 3,
        items: mockGoals.map((goal) => ({
          eyebrow: goal.type.toUpperCase(),
          title: goal.name,
          description: `${formatRupee(goal.currentSavings)} saved toward ${formatRupee(goal.targetAmount)} by ${goal.targetYear}.`,
          value: `${goal.monthlyRequired ? formatRupee(goal.monthlyRequired) : 'TBD'}/mo`,
        })),
      },
    ],
  },
  risk: {
    id: 'S18',
    title: 'Set the risk profile',
    description: 'This is the last profiling step before we calculate the regimes and build the annual allocation.',
    badge: 'Step 7 of 7',
    primaryAction: primary('Run tax calculation', '/tax/calculating'),
    secondaryAction: primary('Back', '/goals', 'ghost'),
    blocks: [
      {
        type: 'fields',
        items: [{ label: 'Comfort with volatility', type: 'slider', value: 62, min: 0, max: 100 }],
      },
      {
        type: 'cards',
        items: [
          { eyebrow: 'Result', title: 'Moderate profile', description: 'Suggested allocation leans toward equity for long goals and debt for the emergency bucket.', value: '65 / 35' },
        ],
      },
      {
        type: 'list',
        style: 'check',
        items: ['Equity for retirement and home goal growth', 'Debt for emergency reserve stability', 'ELSS favored over additional lock-ins right now'],
      },
    ],
  },
}

export const edgeScreens: Record<string, ScreenConfig> = {
  offline: {
    id: 'S66',
    title: 'You are offline right now',
    description: 'Recent portfolio and plan snapshots are still visible. Fresh NAVs and transactions will wait for a connection.',
    badge: 'Edge case',
    primaryAction: primary('Retry connection', '/dashboard'),
    secondaryAction: primary('View cached portfolio', '/tracker/portfolio', 'outline'),
    blocks: [
      { type: 'banner', tone: 'warning', title: 'Last synced 18 minutes ago', description: 'We kept the most recent dashboard, plan summary, and holdings snapshot on device.' },
      { type: 'list', style: 'check', items: ['Portfolio view remains readable', 'Cash-flow plan is still available', 'Queued actions resume on reconnect'] },
    ],
  },
  'session-expired': {
    id: 'S67',
    title: 'Your session expired',
    description: 'Nothing dramatic happened. We just need you to sign back in before moving money or personal data again.',
    badge: 'Security',
    primaryAction: primary('Log in again', '/login'),
    secondaryAction: primary('Back to welcome', '/welcome', 'ghost'),
    blocks: [
      { type: 'cards', items: [{ title: 'State is preserved', description: 'When possible, Money OS drops you back into the exact screen you were using.' }] },
    ],
  },
  failed: {
    id: 'S68',
    title: 'The transaction did not go through',
    description: 'We explain the failure plainly so the user knows whether to retry, wait, or talk to support.',
    badge: 'Transaction',
    primaryAction: primary('Retry investment', '/invest/sip'),
    secondaryAction: primary('Contact support', '/support/chat', 'outline'),
    blocks: [
      { type: 'banner', tone: 'danger', title: 'Reason: bank mandate was not active', description: 'No units were allotted and the money was not invested.' },
      { type: 'list', style: 'check', items: ['Retry after eNACH refresh', 'No tax position changed', 'Support has the failure reference if needed'] },
    ],
  },
  'mandate-expired': {
    id: 'S69',
    title: 'Your SIP mandate has expired',
    description: 'The annual plan still exists, but the auto-debit instruction needs a quick refresh.',
    badge: 'Mandate',
    primaryAction: primary('Re-register eNACH', '/invest/sip'),
    secondaryAction: primary('See affected SIPs', '/history/sip-management', 'outline'),
    blocks: [
      { type: 'cards', items: mockMandates.slice(0, 3).map((sip) => ({ title: sip.fundName, description: `₹${sip.amount.toLocaleString('en-IN')} monthly on the ${sip.sipDate}th.`, value: 'Paused' })) },
    ],
  },
  're-kyc': {
    id: 'S70',
    title: 'KYC re-verification needed',
    description: 'Aadhaar-based KYC needs a refresh before new transactions can continue.',
    badge: 'Compliance',
    primaryAction: primary('Renew KYC', '/kyc'),
    secondaryAction: primary('Talk to support', '/support', 'ghost'),
    blocks: [
      { type: 'banner', tone: 'warning', title: '30-day grace period', description: 'Planning stays visible, but fresh investments pause if KYC is not renewed in time.' },
    ],
  },
  'law-change': {
    id: 'S71',
    title: 'Income tax update is live',
    description: 'Budget changes can move the regime recommendation, so this alert makes the impact explicit instead of hidden.',
    badge: 'Regulatory',
    primaryAction: primary('Recalculate my plan', '/tax/result'),
    secondaryAction: primary('Review what changed', '/reports/tax', 'outline'),
    blocks: [
      { type: 'banner', tone: 'info', title: 'New slab guidance is available', description: 'Money OS refreshed FY assumptions and queued a recalculation for Rahul’s profile.' },
      {
        type: 'cards',
        items: [
          { eyebrow: 'Impact', title: 'Current plan still favors the old regime', description: 'HRA plus second-home interest continue to outweigh the simplified new-regime path.' },
          { eyebrow: 'Action', title: 'Best next move', description: 'Use the 80C gap and optional NPS only if your liquidity feels comfortable after rent and EMI.' },
        ],
      },
    ],
  },
  update: {
    id: 'S72',
    title: 'A new Money OS release is ready',
    description: 'This is the soft-update surface for non-breaking improvements and polish.',
    badge: 'App update',
    primaryAction: primary('Update now', '/dashboard'),
    secondaryAction: primary('Later', '/dashboard', 'ghost'),
    blocks: [
      { type: 'list', style: 'check', items: ['Refreshed annual calendar', 'Faster tax breakdown view', 'Better dark-mode contrast on charts'] },
    ],
  },
  'update-required': {
    id: 'S73',
    title: 'Update required before continuing',
    description: 'When tax logic or compliance APIs change in a breaking way, the app blocks until the user is on a compatible version.',
    badge: 'Force update',
    primaryAction: primary('Update app', '/dashboard'),
    blocks: [
      { type: 'banner', tone: 'danger', title: 'Version mismatch detected', description: 'This screen mirrors the non-dismissible update gate the mobile app would show.' },
    ],
  },
}

const transactionRows = mockTransactions.slice(0, 10).map((txn) => ({
  date: txn.date,
  type: txn.type,
  fund: txn.fundName,
  amount: formatRupee(txn.amount),
  status: txn.status,
}))

const mandateRows = mockMandates.map((sip) => ({
  fund: sip.fundName,
  amount: formatRupee(sip.amount),
  date: `${sip.sipDate}th`,
  status: sip.status,
  next: sip.nextDebitDate,
}))

const holdingRows = mockHoldings.map((holding) => ({
  fund: holding.fundName,
  invested: formatRupee(holding.investedAmount),
  current: formatRupee(holding.currentValue),
  xirr: `${holding.xirr.toFixed(1)}%`,
}))

const fundCards = mockFunds.map((fund) => ({
  eyebrow: fund.category,
  title: fund.name,
  description: `${fund.amcName} • ${fund.riskLevel} risk • ${fund.rating}/5 rating`,
  value: `${fund.returns3Y.toFixed(1)}% 3Y`,
}))

const notificationCards: ScreenCard[] = mockNotifications.map((item) => ({
  eyebrow: item.category.toUpperCase(),
  title: item.title,
  description: item.body,
  value: item.time,
  tone: item.unread ? 'brand' : 'info',
}))

export const appScreens: Record<string, Record<string, ScreenConfig>> = {
  tax: {
    calculating: {
      id: 'S19',
      title: 'Calculating your best regime',
      description: 'This staged screen narrates what the engine is doing so the wait feels intentional instead of mysterious.',
      badge: 'Auto',
      primaryAction: primary('View comparison', '/tax/result'),
      blocks: [
        {
          type: 'timeline',
          items: [
            { title: 'Reading salary structure', description: 'Basic pay, HRA, rent, and payroll deductions are being aligned.' },
            { title: 'Applying deductions', description: '80C, 80D, HRA, and home-loan interest are being placed against both regimes.', status: 'active' },
            { title: 'Comparing total tax', description: 'We are computing cess, take-home, and the regime delta for the year.' },
            { title: 'Building the execution plan', description: 'The optimizer will propose a month-by-month allocation once the winner is known.' },
          ],
        },
      ],
    },
    breakdown: {
      id: 'S21',
      title: 'Deduction breakdown',
      description: 'Each section shows what is already used, what headroom remains, and why it matters.',
      badge: 'Drill-down',
      primaryAction: primary('Open salary optimizer', '/tax/restructure'),
      secondaryAction: primary('Back to result', '/tax/result', 'ghost'),
      blocks: [
        {
          type: 'section-progress',
          items: mockTaxBreakdown.map((section) => ({
            label: `${section.section} utilization`,
            used: section.used,
            max: section.max,
            section: section.section as '80C' | '80D' | 'NPS' | 'HRA',
          })),
        },
        {
          type: 'cards',
          items: mockTaxBreakdown.map((section) => ({
            eyebrow: `Section ${section.section}`,
            title: `${formatRupee(section.max - section.used)} still open`,
            description: section.note,
          })),
        },
      ],
    },
    restructure: {
      id: 'S22',
      title: 'Salary structure optimizer',
      description: 'This screen frames the HR conversation around reimbursements and structure tweaks that reduce tax drag without extra investing.',
      badge: 'Bonus',
      primaryAction: primary('Share draft with HR', '/reports/tax'),
      secondaryAction: primary('Return to breakdown', '/tax/breakdown', 'ghost'),
      blocks: [
        {
          type: 'table',
          columns: [
            { key: 'component', label: 'Component' },
            { key: 'current', label: 'Current', align: 'right' },
            { key: 'suggested', label: 'Suggested', align: 'right' },
          ],
          rows: [
            { component: 'Basic salary', current: formatRupee(38825 * 12), suggested: formatRupee(420000) },
            { component: 'HRA', current: formatRupee(25000 * 12), suggested: formatRupee(300000) },
            { component: 'Meal and commute reimbursements', current: formatRupee(0), suggested: formatRupee(26400) },
          ],
        },
        {
          type: 'banner',
          tone: 'success',
          title: 'Estimated incremental tax reduction: about ₹8,200',
          description: 'This is separate from investment planning and can be shared as a salary-structure request.',
        },
      ],
    },
  },
  plan: {
    '80c': {
      id: 'S23',
      title: '80C allocation optimizer',
      description: 'The 80C bucket blends automatic EPF with intentional ELSS or other instruments.',
      badge: 'Optimizer',
      primaryAction: primary('Review 80D plan', '/plan/80d'),
      secondaryAction: primary('Go to summary', '/plan/summary', 'ghost'),
      blocks: [
        {
          type: 'chart',
          variant: 'donut',
          labelKey: 'label',
          yKey: 'value',
          colors: ['var(--brand-primary)', 'var(--brand-accent)', 'var(--bg-elevated)'],
          data: [
            { label: 'EPF', value: 72000 },
            { label: 'ELSS', value: 20000 },
            { label: 'Headroom', value: 58000 },
          ],
        },
        {
          type: 'cards',
          items: [
            { eyebrow: 'Used', title: '₹92,000 already counted', description: 'EPF plus current ELSS contributions are auto-applied.' },
            { eyebrow: 'Opportunity', title: '₹58,000 still open', description: 'This can be filled with more ELSS or a lower-risk instrument depending on comfort.' },
          ],
        },
      ],
    },
    '80d': {
      id: 'S24',
      title: '80D health-insurance plan',
      description: 'The planner checks whether tax usage and real cover look balanced rather than chasing deduction for its own sake.',
      badge: 'Optimizer',
      primaryAction: primary('Review NPS', '/plan/nps'),
      secondaryAction: primary('Back to 80C', '/plan/80c', 'ghost'),
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'Premium counted', value: formatRupee(18000), subValue: 'of ₹25,000 self limit' },
            { label: 'Remaining headroom', value: formatRupee(7000), subValue: 'Possible top-up cover' },
          ],
        },
        {
          type: 'cards',
          items: [
            { eyebrow: 'Cover check', title: 'Reasonable but not maxed', description: 'Tax headroom remains small, so a cover decision should be insurance-led before tax-led.' },
          ],
        },
      ],
    },
    nps: {
      id: 'S25',
      title: 'NPS optimizer',
      description: 'NPS is still unused, so this screen frames the tax benefit against the lock-in tradeoff.',
      badge: 'Optimizer',
      primaryAction: primary('Review gains planner', '/plan/gains'),
      secondaryAction: primary('Skip NPS for now', '/plan/summary', 'ghost'),
      blocks: [
        {
          type: 'section-progress',
          items: [{ label: 'NPS additional deduction', used: 0, max: 50000, section: 'NPS' }],
        },
        {
          type: 'chart',
          variant: 'line',
          xKey: 'age',
          yKey: 'corpus',
          data: [
            { age: 36, corpus: 62000 },
            { age: 40, corpus: 364000 },
            { age: 45, corpus: 825000 },
            { age: 50, corpus: 1520000 },
            { age: 60, corpus: 4920000 },
          ],
        },
        {
          type: 'banner',
          tone: 'info',
          title: 'At Rahul’s slab, a full ₹50,000 contribution could save about ₹15,600 in tax',
          description: 'The real question is whether the retirement lock-in still feels worth it after rent and the existing EMI.',
        },
      ],
    },
    gains: {
      id: 'S26',
      title: 'Capital gains planner',
      description: 'A simple view of unrealized gains makes LTCG harvest opportunities much easier to spot.',
      badge: 'Advanced',
      primaryAction: primary('Open cash-flow planner', '/plan/cashflow'),
      secondaryAction: primary('Back to NPS', '/plan/nps', 'ghost'),
      blocks: [
        {
          type: 'table',
          columns: [
            { key: 'fund', label: 'Fund' },
            { key: 'current', label: 'Current value', align: 'right' },
            { key: 'gain', label: 'Unrealized gain', align: 'right' },
          ],
          rows: mockHoldings.map((holding) => ({
            fund: holding.fundName,
            current: formatRupee(holding.currentValue),
            gain: `${holding.gainLoss >= 0 ? '+' : '-'}${formatRupee(Math.abs(holding.gainLoss))}`,
          })),
        },
      ],
    },
    cashflow: {
      id: 'S27',
      title: 'Monthly cash-flow planner',
      description: 'This is where the annual plan becomes something you can actually live with from April through March.',
      badge: 'Core',
      primaryAction: primary('Review plan summary', '/plan/summary'),
      secondaryAction: primary('Back to gains', '/plan/gains', 'ghost'),
      blocks: [
        {
          type: 'chart',
          variant: 'bar',
          xKey: 'label',
          yKey: 'surplus',
          secondaryKey: 'lumpsum',
          data: mockInvestmentPlan.monthlyPlan.map((month, index) => ({
            label: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][index],
            surplus: month.investableAmount,
            lumpsum: month.lumpsumSuggestion ?? 0,
          })),
        },
        {
          type: 'cards',
          items: [
            { eyebrow: 'Best SIP date', title: '5th of each month', description: 'This follows salary credit with enough buffer for rent and EMI.' },
            { eyebrow: 'Bonus months', title: 'August and January', description: 'Both months show extra capacity for targeted lump sums.' },
          ],
        },
      ],
    },
    summary: {
      id: 'S28',
      title: 'Complete annual plan summary',
      description: 'A single surface for commitment, section usage, and the recommended month-by-month execution path.',
      badge: 'Generated',
      primaryAction: primary('Start investing', '/invest'),
      secondaryAction: primary('Download plan PDF', '/reports/investment-plan', 'outline'),
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'Annual investment plan', value: formatRupee(mockInvestmentPlan.totalAnnualInvestment), subValue: 'Across tax and goal buckets' },
            { label: 'Projected tax saving', value: formatRupee(mockInvestmentPlan.projectedTaxSaving), subValue: 'Vs staying unoptimized' },
            { label: 'Monthly commitment', value: formatRupee(18500), subValue: 'Core SIP stack' },
          ],
        },
        {
          type: 'table',
          columns: [
            { key: 'instrument', label: 'Instrument' },
            { key: 'section', label: 'Section' },
            { key: 'annual', label: 'Annual', align: 'right' },
            { key: 'monthly', label: 'Monthly', align: 'right' },
          ],
          rows: mockInvestmentPlan.allocations.map((allocation) => ({
            instrument: allocation.instrument,
            section: allocation.section,
            annual: formatRupee(allocation.annualAmount),
            monthly: formatRupee(allocation.monthlyAmount),
          })),
        },
      ],
    },
  },
  tracker: {
    index: {
      id: 'S30',
      title: 'Tax tracker',
      description: 'A live, plain-English status view for the sections that actually move the recommendation.',
      badge: 'Live',
      primaryAction: primary('View portfolio tracker', '/tracker/portfolio'),
      secondaryAction: primary('Review 80C plan', '/plan/80c', 'ghost'),
      blocks: [
        {
          type: 'section-progress',
          items: [
            { label: 'Section 80C', used: dashboardMetrics.section80CUsed, max: dashboardMetrics.section80CMax, section: '80C' },
            { label: 'Section 80D', used: dashboardMetrics.section80DUsed, max: dashboardMetrics.section80DMax, section: '80D' },
            { label: 'Section 80CCD(1B)', used: dashboardMetrics.npsUsed, max: dashboardMetrics.npsMax, section: 'NPS' },
          ],
        },
        {
          type: 'banner',
          tone: 'warning',
          title: '₹58,000 of 80C headroom still open',
          description: 'This is the biggest remaining lever before the end of the year.',
        },
      ],
    },
    portfolio: {
      id: 'S31',
      title: 'Portfolio tracker',
      description: 'Holdings, XIRR, and value growth sit together so each fund can be read in context.',
      badge: 'Live',
      primaryAction: primary('Inspect goals', '/tracker/goals'),
      secondaryAction: primary('Open transactions', '/history', 'ghost'),
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'Current value', value: formatRupee(portfolioSummary.currentValue), trend: 'up', trendLabel: '+9.9%' },
            { label: 'Invested amount', value: formatRupee(portfolioSummary.investedAmount) },
            { label: 'Portfolio XIRR', value: `${portfolioSummary.xirr.toFixed(1)}%`, subValue: 'Across all active holdings' },
          ],
        },
        {
          type: 'chart',
          variant: 'line',
          xKey: 'label',
          yKey: 'value',
          data: yearlyReturnSeries,
        },
        {
          type: 'table',
          columns: [
            { key: 'fund', label: 'Fund' },
            { key: 'invested', label: 'Invested', align: 'right' },
            { key: 'current', label: 'Current', align: 'right' },
            { key: 'xirr', label: 'XIRR', align: 'right' },
          ],
          rows: holdingRows,
        },
      ],
    },
    goals: {
      id: 'S32',
      title: 'Goals tracker',
      description: 'Each goal shows progress, required monthly pace, and whether the current contribution path is enough.',
      badge: 'Live',
      primaryAction: primary('Review financial calendar', '/tracker/calendar'),
      secondaryAction: primary('Back to dashboard', '/dashboard', 'ghost'),
      blocks: [
        {
          type: 'cards',
          columns: 3,
          items: mockGoals.map((goal) => ({
            eyebrow: `${goal.priority === 1 ? 'Priority' : 'Goal'} ${goal.priority}`,
            title: goal.name,
            description: `${formatRupee(goal.currentSavings)} saved toward ${formatRupee(goal.targetAmount)} by ${goal.targetYear}.`,
            value: `${Math.round((goal.currentSavings / goal.targetAmount) * 100)}%`,
          })),
        },
      ],
    },
    calendar: {
      id: 'S33',
      title: 'Annual financial calendar',
      description: 'Deadlines are easier to handle when the whole year is visible at once.',
      badge: 'Timeline',
      primaryAction: primary('Open reports', '/reports/tax'),
      secondaryAction: primary('Back to tracker', '/tracker', 'ghost'),
      blocks: [
        {
          type: 'timeline',
          items: mockCalendarEvents.map((event) => ({
            title: `${event.date} — ${event.title}`,
            description: event.description,
            meta: event.month,
            status: event.status === 'next' ? 'active' : event.status === 'done' ? 'done' : 'upcoming',
          })),
        },
      ],
    },
  },
  invest: {
    index: {
      id: 'S34',
      title: 'Browse funds',
      description: 'Recommended funds are organized by role: tax saving, compounding, stability, and goal fit.',
      badge: 'Invest',
      primaryAction: primary('Open fund detail', '/invest/fund-detail'),
      secondaryAction: primary('Start SIP setup', '/invest/sip', 'ghost'),
      blocks: [{ type: 'cards', columns: 2, items: fundCards }],
    },
    'fund-detail': {
      id: 'S35',
      title: mockFunds[0].name,
      description: 'The detail screen combines return history, risk framing, and minimums before execution.',
      badge: mockFunds[0].category,
      primaryAction: primary('Start SIP', '/invest/sip'),
      secondaryAction: primary('Invest lump sum', '/invest/lumpsum', 'outline'),
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'NAV', value: formatRupee(mockFunds[0].nav), subValue: mockFunds[0].navDate },
            { label: '3Y CAGR', value: `${mockFunds[0].returns3Y.toFixed(1)}%` },
            { label: 'Minimum SIP', value: formatRupee(mockFunds[0].minSIP) },
          ],
        },
        {
          type: 'chart',
          variant: 'line',
          xKey: 'period',
          yKey: 'value',
          data: [
            { period: '1Y', value: mockFunds[0].returns1Y },
            { period: '3Y', value: mockFunds[0].returns3Y },
            { period: '5Y', value: mockFunds[0].returns5Y },
          ],
        },
      ],
    },
    sip: {
      id: 'S36',
      title: 'Start a SIP',
      description: 'This is the execution screen for translating a recommended monthly amount into a real mandate.',
      badge: 'Transaction',
      primaryAction: primary('Review SIP order', '/invest/confirm'),
      secondaryAction: primary('Back to fund', '/invest/fund-detail', 'ghost'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'Fund', type: 'select', value: mockFunds[0].name, options: mockFunds.map((fund) => fund.name) },
            { label: 'Monthly amount', type: 'number', value: 5000 },
            { label: 'Frequency', type: 'select', value: 'Monthly', options: ['Monthly', 'Quarterly'] },
            { label: 'Debit date', type: 'select', value: '5', options: ['5', '7', '10', '12', '18'] },
          ],
        },
      ],
    },
    lumpsum: {
      id: 'S37',
      title: 'Make a one-time investment',
      description: 'Ideal for bonus months or when a planner month shows spare cash that does not need to stay liquid.',
      badge: 'Transaction',
      primaryAction: primary('Continue to confirmation', '/invest/confirm'),
      secondaryAction: primary('Back to fund', '/invest/fund-detail', 'ghost'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'Fund', type: 'select', value: mockFunds[2].name, options: mockFunds.map((fund) => fund.name) },
            { label: 'Amount', type: 'number', value: 25000 },
            { label: 'Payment method', type: 'select', value: 'UPI', options: ['UPI', 'Netbanking'] },
          ],
        },
      ],
    },
    confirm: {
      id: 'S38',
      title: 'Confirm order details',
      description: 'A final review of amount, bank, and schedule before the order is sent.',
      badge: 'Review',
      primaryAction: primary('Place order', '/history'),
      secondaryAction: primary('Back to edit', '/invest/sip', 'ghost'),
      blocks: [
        {
          type: 'cards',
          items: [
            { eyebrow: 'Fund', title: 'Axis ELSS Tax Saver Fund', description: 'Monthly SIP on the 5th using HDFC salary account.', value: formatRupee(5000) },
            { eyebrow: 'Timeline', title: 'First debit next month', description: 'Confirmation SMS and email will be triggered once the order enters processing.' },
          ],
        },
      ],
    },
    'nps-setup': {
      id: 'S39',
      title: 'Set up an NPS account',
      description: 'This screen captures the one-time PRAN setup details if Rahul chooses the extra retirement deduction.',
      badge: 'One-time',
      primaryAction: primary('Generate PRAN', '/history'),
      secondaryAction: primary('Back to NPS plan', '/plan/nps', 'ghost'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'CRA provider', type: 'select', value: 'Protean (NSDL)', options: ['Protean (NSDL)', 'KFintech'] },
            { label: 'Nominee', type: 'text', value: 'Ananya Sharma' },
            { label: 'Equity allocation', type: 'slider', value: 60, min: 0, max: 75 },
            { label: 'Corporate bond allocation', type: 'slider', value: 25, min: 0, max: 100 },
          ],
        },
      ],
    },
    redeem: {
      id: 'S40',
      title: 'Redeem or withdraw',
      description: 'The withdrawal flow shows lock-in and tax implications before the confirmation step.',
      badge: 'Transaction',
      primaryAction: primary('Continue', '/invest/confirm'),
      secondaryAction: primary('Back to holdings', '/history/holding-detail', 'ghost'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'Fund', type: 'select', value: mockFunds[4].name, options: mockFunds.map((fund) => fund.name) },
            { label: 'Amount', type: 'number', value: 15000 },
            { label: 'Credit account', type: 'text', value: 'HDFC •••• 9182' },
          ],
        },
      ],
    },
  },
  history: {
    index: {
      id: 'S41',
      title: 'Transaction history',
      description: 'Every order is visible with amount, fund, status, and date filters.',
      badge: 'History',
      primaryAction: primary('Manage SIPs', '/history/sip-management'),
      secondaryAction: primary('Holding detail', '/history/holding-detail', 'ghost'),
      blocks: [
        {
          type: 'table',
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'type', label: 'Type' },
            { key: 'fund', label: 'Fund' },
            { key: 'amount', label: 'Amount', align: 'right' },
            { key: 'status', label: 'Status', align: 'right' },
          ],
          rows: transactionRows,
        },
      ],
    },
    'sip-management': {
      id: 'S42',
      title: 'SIP management',
      description: 'Pause, modify, or cancel live SIPs without losing track of the annual plan intent behind them.',
      badge: 'SIPs',
      primaryAction: primary('View capital gains', '/history/capital-gains'),
      secondaryAction: primary('Back to history', '/history', 'ghost'),
      blocks: [
        {
          type: 'table',
          columns: [
            { key: 'fund', label: 'Fund' },
            { key: 'amount', label: 'Amount', align: 'right' },
            { key: 'date', label: 'Debit day', align: 'right' },
            { key: 'status', label: 'Status', align: 'right' },
            { key: 'next', label: 'Next debit', align: 'right' },
          ],
          rows: mandateRows,
        },
      ],
    },
    'capital-gains': {
      id: 'S43',
      title: 'Capital gains statement',
      description: 'A filing-friendly summary of current and realized gains by fund and financial year.',
      badge: 'Tax',
      primaryAction: primary('Open report preview', '/reports/form16'),
      secondaryAction: primary('Back to SIPs', '/history/sip-management', 'ghost'),
      blocks: [
        {
          type: 'banner',
          tone: 'info',
          title: 'Projected LTCG harvest room remains available',
          description: 'Current unrealized gains still leave room under the exemption threshold if you decide to book selectively.',
        },
        {
          type: 'table',
          columns: [
            { key: 'fund', label: 'Fund' },
            { key: 'current', label: 'Current value', align: 'right' },
            { key: 'xirr', label: 'XIRR', align: 'right' },
          ],
          rows: holdingRows,
        },
      ],
    },
    'holding-detail': {
      id: 'S44',
      title: 'Holding detail',
      description: 'A single-fund drilldown with cost, current value, and the recent SIP trail.',
      badge: 'Holding',
      primaryAction: primary('Back to portfolio', '/tracker/portfolio'),
      secondaryAction: primary('Redeem units', '/invest/redeem', 'outline'),
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'Current holding', value: formatRupee(mockHoldings[0].currentValue), trend: 'up', trendLabel: `${mockHoldings[0].gainLossPercent.toFixed(1)}%` },
            { label: 'Invested', value: formatRupee(mockHoldings[0].investedAmount) },
            { label: 'XIRR', value: `${mockHoldings[0].xirr.toFixed(1)}%` },
          ],
        },
        {
          type: 'table',
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'type', label: 'Type' },
            { key: 'amount', label: 'Amount', align: 'right' },
          ],
          rows: transactionRows.slice(0, 5).map((row) => ({ date: row.date, type: row.type, amount: row.amount })),
        },
      ],
    },
  },
  notifications: {
    index: {
      id: 'S45',
      title: 'Notification centre',
      description: 'A quiet, searchable record of nudges, executions, deadlines, and account events.',
      badge: 'Inbox',
      primaryAction: primary('Notification preferences', '/notifications/preferences'),
      blocks: [{ type: 'cards', columns: 2, items: notificationCards }],
    },
    'sip-alert': {
      id: 'S46',
      title: 'SIP debit alert',
      description: 'Execution confirmation after a SIP debit, with a quick path back into the portfolio.',
      badge: 'Push',
      primaryAction: primary('View portfolio', '/tracker/portfolio'),
      blocks: [{ type: 'cards', items: [notificationCards[0]] }],
    },
    'tax-reminder': {
      id: 'S47',
      title: 'Tax deadline reminder',
      description: 'Escalates as deadlines get closer without flooding the user every day.',
      badge: 'Push',
      primaryAction: primary('Open tax tracker', '/tracker'),
      blocks: [{ type: 'cards', items: [notificationCards[1]] }],
    },
    'goal-milestone': {
      id: 'S48',
      title: 'Goal milestone alert',
      description: 'Positive reinforcement when savings progress crosses a visible threshold.',
      badge: 'Push',
      primaryAction: primary('Open goals', '/tracker/goals'),
      blocks: [{ type: 'cards', items: [notificationCards[2]] }],
    },
    replan: {
      id: 'S49',
      title: 'Re-planning nudge',
      description: 'Triggered when salary, liabilities, or life data changes enough to justify a fresh plan.',
      badge: 'Push',
      primaryAction: primary('Update salary details', '/salary'),
      blocks: [{ type: 'cards', items: [notificationCards[3]] }],
    },
    preferences: {
      id: 'S50',
      title: 'Notification preferences',
      description: 'Granular channel settings keep the app useful without becoming loud.',
      badge: 'Settings',
      primaryAction: primary('Save preferences', '/notifications'),
      secondaryAction: primary('Back to inbox', '/notifications', 'ghost'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'SIP updates', type: 'toggle', value: true },
            { label: 'Tax reminders', type: 'toggle', value: true },
            { label: 'Goal milestones', type: 'toggle', value: true },
            { label: 'Quiet hours', type: 'toggle', value: false },
            { label: 'Quiet hours window', type: 'text', value: '10:00 PM - 8:00 AM' },
          ],
        },
      ],
    },
  },
  settings: {
    index: {
      id: 'S51',
      title: 'Profile and account settings',
      description: 'The operational home for profile details, contact methods, and account completeness.',
      badge: 'Settings',
      primaryAction: primary('Open security settings', '/settings/security'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'Name', type: 'text', value: mockUser.name },
            { label: 'Email', type: 'email', value: mockUser.email },
            { label: 'Phone number', type: 'text', value: mockUser.mobile },
            { label: 'KYC status', type: 'text', value: 'Verified' },
          ],
        },
      ],
    },
    security: {
      id: 'S52',
      title: 'Security settings',
      description: 'Everything around MPIN, biometric unlock, and active device sessions.',
      badge: 'Security',
      primaryAction: primary('Open KYC settings', '/settings/kyc'),
      secondaryAction: primary('Back to settings', '/settings', 'ghost'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'Biometric unlock', type: 'toggle', value: true },
            { label: 'Change MPIN', type: 'pin', value: '1 8 0 5 2 6' },
            { label: 'Last login', type: 'text', value: 'MacBook Pro • Today, 9:12 AM' },
          ],
        },
      ],
    },
    kyc: {
      id: 'S53',
      title: 'KYC and documents',
      description: 'Current identity status, masked documents, and linked bank accounts.',
      badge: 'Compliance',
      primaryAction: primary('Open integrations', '/settings/integrations'),
      secondaryAction: primary('Back to security', '/settings/security', 'ghost'),
      blocks: [
        {
          type: 'cards',
          items: [
            { eyebrow: 'PAN', title: mockUser.pan, description: 'Primary tax identity on file.' },
            { eyebrow: 'Aadhaar', title: 'XXXX XXXX 4521', description: 'Masked after verification.' },
            { eyebrow: 'Bank', title: 'HDFC •••• 9182', description: 'Verified via penny drop.' },
          ],
        },
      ],
    },
    integrations: {
      id: 'S54',
      title: 'Linked accounts and integrations',
      description: 'DigiLocker, bank accounts, UPI handles, and future payroll sources.',
      badge: 'Links',
      primaryAction: primary('Open nominee settings', '/settings/nominee'),
      secondaryAction: primary('Back to KYC', '/settings/kyc', 'ghost'),
      blocks: [
        {
          type: 'cards',
          items: [
            { eyebrow: 'DigiLocker', title: 'Connected', description: 'Ready for document fetch during re-KYC.', tone: 'success' },
            { eyebrow: 'UPI', title: 'rahul@okhdfcbank', description: 'Available for lump-sum payments.' },
            { eyebrow: 'Employer feed', title: 'Planned', description: 'Future payroll integration for automatic proof sync.', tone: 'info' },
          ],
        },
      ],
    },
    nominee: {
      id: 'S55',
      title: 'Nominee management',
      description: 'Nomination is framed cleanly so it can be set once without confusion.',
      badge: 'Nominee',
      primaryAction: primary('Open app preferences', '/settings/preferences'),
      secondaryAction: primary('Back to integrations', '/settings/integrations', 'ghost'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'Nominee name', type: 'text', value: 'Ananya Sharma' },
            { label: 'Relationship', type: 'text', value: 'Spouse' },
            { label: 'Allocation share', type: 'number', value: 100 },
          ],
        },
      ],
    },
    preferences: {
      id: 'S56',
      title: 'App preferences',
      description: 'Theme, language, and calendar behavior live here.',
      badge: 'Preferences',
      primaryAction: primary('Open privacy settings', '/settings/privacy'),
      secondaryAction: primary('Back to nominee', '/settings/nominee', 'ghost'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'Theme', type: 'select', value: 'System', options: ['System', 'Light', 'Dark'] },
            { label: 'Language', type: 'select', value: 'English', options: ['English', 'Hindi'] },
            { label: 'Financial year reminders', type: 'toggle', value: true },
          ],
        },
      ],
    },
    privacy: {
      id: 'S57',
      title: 'Data and privacy',
      description: 'Clear controls for export, deletion, and analytics preferences.',
      badge: 'Privacy',
      primaryAction: primary('Go to help centre', '/support'),
      secondaryAction: primary('Back to preferences', '/settings/preferences', 'ghost'),
      blocks: [
        {
          type: 'cards',
          items: [
            { eyebrow: 'Export', title: 'Download my data', description: 'A request can be queued and emailed within 48 hours.' },
            { eyebrow: 'Delete', title: 'Delete account', description: 'Starts a 30-day cooling-off period before the app account is removed.', tone: 'warning' },
          ],
        },
      ],
    },
  },
  support: {
    index: {
      id: 'S58',
      title: 'Help centre',
      description: 'A support surface designed to deflect easy questions and escalate the hard ones quickly.',
      badge: 'Support',
      primaryAction: primary('Open chat', '/support/chat'),
      secondaryAction: primary('Raise complaint', '/support/complaint', 'outline'),
      blocks: [
        {
          type: 'cards',
          columns: 2,
          items: mockSupportArticles.map((article) => ({
            eyebrow: article.category,
            title: article.title,
            description: `${article.readTime} read`,
          })),
        },
      ],
    },
    chat: {
      id: 'S59',
      title: 'In-app chat and ticketing',
      description: 'Bot-first triage with a clean escalation path to a human for the messy cases.',
      badge: 'Chat',
      primaryAction: primary('Raise complaint', '/support/complaint'),
      secondaryAction: primary('Back to help centre', '/support', 'ghost'),
      blocks: [
        {
          type: 'fields',
          items: [
            { label: 'Message', type: 'textarea', value: 'My SIP mandate failed even though my bank balance was sufficient.' },
          ],
        },
      ],
    },
    complaint: {
      id: 'S60',
      title: 'Raise a complaint',
      description: 'The grievance flow captures category, evidence, and the escalation path cleanly.',
      badge: 'Grievance',
      primaryAction: primary('Submit complaint', '/support/feedback'),
      secondaryAction: primary('Back to chat', '/support/chat', 'ghost'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'Category', type: 'select', value: 'Transaction issue', options: ['Transaction issue', 'KYC issue', 'Tax report issue'] },
            { label: 'Reference ID', type: 'text', value: 'ORD-ELSS-8' },
            { label: 'Description', type: 'textarea', value: 'The order failed after mandate approval and I want a timeline for resolution.' },
          ],
        },
      ],
    },
    feedback: {
      id: 'S61',
      title: 'Rate the app and leave feedback',
      description: 'A simple feedback loop that also supports app-store review timing.',
      badge: 'Feedback',
      primaryAction: primary('Submit feedback', '/dashboard'),
      secondaryAction: primary('Back to support', '/support', 'ghost'),
      blocks: [
        {
          type: 'fields',
          columns: 2,
          items: [
            { label: 'Rating', type: 'slider', value: 4, min: 1, max: 5, step: 1 },
            { label: 'What should improve', type: 'textarea', value: 'I would love employer proof reminders to show up a little earlier in January.' },
          ],
        },
      ],
    },
  },
  reports: {
    tax: {
      id: 'S62',
      title: 'Tax savings report',
      description: 'A polished report preview for the user, HR, or CA with the regime comparison up front.',
      badge: 'PDF',
      primaryAction: primary('Download PDF', '/reports/investment-plan'),
      secondaryAction: primary('Back to dashboard', '/dashboard', 'ghost'),
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'Recommended regime', value: 'Old regime' },
            { label: 'Annual tax delta', value: formatRupee(Math.round(computedTaxResult.savingsWithRecommended)) },
            { label: 'Monthly take-home', value: formatRupee(computedTaxResult.old.monthlyTakeHome) },
          ],
        },
      ],
    },
    'investment-plan': {
      id: 'S63',
      title: 'Investment plan PDF',
      description: 'The export view for section-wise allocation, monthly schedule, and Form 12BB alignment.',
      badge: 'PDF',
      primaryAction: primary('Preview Form 16', '/reports/form16'),
      secondaryAction: primary('Back to tax report', '/reports/tax', 'ghost'),
      blocks: [
        {
          type: 'table',
          columns: [
            { key: 'instrument', label: 'Instrument' },
            { key: 'section', label: 'Section' },
            { key: 'monthly', label: 'Monthly', align: 'right' },
          ],
          rows: mockInvestmentPlan.allocations.map((allocation) => ({
            instrument: allocation.instrument,
            section: allocation.section,
            monthly: formatRupee(allocation.monthlyAmount),
          })),
        },
      ],
    },
    form16: {
      id: 'S64',
      title: 'Simulated Form 16 preview',
      description: 'A simplified salary-and-deductions preview to make filing season less surprising.',
      badge: 'Preview',
      primaryAction: primary('Open annual statement', '/reports/account-statement'),
      secondaryAction: primary('Back to plan PDF', '/reports/investment-plan', 'ghost'),
      blocks: [
        {
          type: 'cards',
          items: [
            { eyebrow: 'Part A', title: 'TDS summary', description: `Estimated monthly TDS under the recommended regime is ${formatRupee(computedTaxResult.old.monthlyTDS)}.` },
            { eyebrow: 'Part B', title: 'Salary and deductions', description: `Taxable income projects to ${formatRupee(computedTaxResult.old.taxableIncome)}.` },
          ],
        },
      ],
    },
    'account-statement': {
      id: 'S65',
      title: 'Annual account statement',
      description: 'A full financial-year statement covering transactions, value, and summarized gains.',
      badge: 'PDF',
      primaryAction: primary('Return to dashboard', '/dashboard'),
      secondaryAction: primary('Back to Form 16', '/reports/form16', 'ghost'),
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'Opening portfolio', value: formatRupee(388000) },
            { label: 'Closing portfolio', value: formatRupee(portfolioSummary.currentValue) },
            { label: 'Annual XIRR', value: `${portfolioSummary.xirr.toFixed(1)}%` },
          ],
        },
        {
          type: 'table',
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'type', label: 'Type' },
            { key: 'amount', label: 'Amount', align: 'right' },
          ],
          rows: transactionRows.slice(0, 8).map((row) => ({ date: row.date, type: row.type, amount: row.amount })),
        },
      ],
    },
  },
}

export function getAuthScreen(slug: string) {
  return authScreens[slug]
}

export function getOnboardingScreen(slug: string) {
  return onboardingScreens[slug]
}

export function getEdgeScreen(slug: string) {
  return edgeScreens[slug]
}

export function getTopLevelScreen(slug: string): { screen: ScreenConfig; variant: ScreenVariant } | null {
  if (authScreens[slug]) return { screen: authScreens[slug], variant: 'auth' }
  if (onboardingScreens[slug]) return { screen: onboardingScreens[slug], variant: 'onboard' }
  if (edgeScreens[slug]) return { screen: edgeScreens[slug], variant: 'edge' }
  return null
}

export function getAppScreen(section: keyof typeof appScreens, slug?: string): ScreenConfig | undefined {
  const screens = appScreens[section]
  const key = slug && slug.length > 0 ? slug : 'index'
  return screens[key]
}
