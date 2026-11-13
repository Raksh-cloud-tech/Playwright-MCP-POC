/** Shared routes, messages and enums used by pages, tests and helpers. */
export const BASE_URL = process.env.BASE_URL ?? 'https://opensource-demo.orangehrmlive.com';

export const ROUTES = {
  login: '/web/index.php/auth/login',
  validate: '/web/index.php/auth/validate',
  forgotPassword: '/web/index.php/auth/requestPasswordResetCode',
  dashboard: '/web/index.php/dashboard/index',
  adminUsers: '/web/index.php/admin/viewSystemUsers',
  addUser: '/web/index.php/admin/saveSystemUser',
  employeeList: '/web/index.php/pim/viewEmployeeList',
  addEmployee: '/web/index.php/pim/addEmployee',
  myInfo: '/web/index.php/pim/viewMyDetails',
  leaveList: '/web/index.php/leave/viewLeaveList',
  timesheets: '/web/index.php/time/viewEmployeeTimesheet',
  candidates: '/web/index.php/recruitment/viewCandidates',
  addCandidate: '/web/index.php/recruitment/addCandidate',
  performanceReviews: '/web/index.php/performance/searchEvaluatePerformanceReview',
  directory: '/web/index.php/directory/viewDirectory',
  maintenance: '/web/index.php/maintenance/purgeEmployee',
  employeeClaims: '/web/index.php/claim/viewAssignClaim',
  submitClaim: '/web/index.php/claim/submitClaim',
  buzz: '/web/index.php/buzz/viewBuzz',
} as const;

export const URL_PATTERNS = {
  login: /\/auth\/login/,
  dashboard: /\/dashboard\/index/,
  forgotPassword: /\/auth\/requestPasswordResetCode/,
} as const;

export const MESSAGES = {
  invalidCredentials: 'Invalid credentials',
  required: 'Required',
  passwordsDoNotMatch: 'Passwords do not match',
  noRecordsFound: 'No Records Found',
  deleteConfirmation: 'Are you Sure?',
} as const;

export const SESSION_COOKIE_NAME = 'orangehrm';

export enum UserMenuItem {
  About = 'About',
  Support = 'Support',
  ChangePassword = 'Change Password',
  Logout = 'Logout',
}

/** Entries of the left-hand main menu. */
export enum MainMenuItem {
  Admin = 'Admin',
  PIM = 'PIM',
  Leave = 'Leave',
  Time = 'Time',
  Recruitment = 'Recruitment',
  MyInfo = 'My Info',
  Performance = 'Performance',
  Dashboard = 'Dashboard',
  Directory = 'Directory',
  Maintenance = 'Maintenance',
  Claim = 'Claim',
  Buzz = 'Buzz',
}

export interface ModuleLanding {
  menu: MainMenuItem;
  urlPattern: RegExp;
  heading: string;
}

/** Where each main-menu module lands (verified against the live application). */
export const MODULE_LANDINGS: readonly ModuleLanding[] = [
  { menu: MainMenuItem.Admin, urlPattern: /\/admin\/viewSystemUsers/, heading: 'System Users' },
  { menu: MainMenuItem.PIM, urlPattern: /\/pim\/viewEmployeeList/, heading: 'Employee Information' },
  { menu: MainMenuItem.Leave, urlPattern: /\/leave\/viewLeaveList/, heading: 'Leave List' },
  { menu: MainMenuItem.Time, urlPattern: /\/time\/viewEmployeeTimesheet/, heading: 'Select Employee' },
  { menu: MainMenuItem.Recruitment, urlPattern: /\/recruitment\/viewCandidates/, heading: 'Candidates' },
  { menu: MainMenuItem.MyInfo, urlPattern: /\/pim\/viewPersonalDetails/, heading: 'Personal Details' },
  { menu: MainMenuItem.Performance, urlPattern: /\/performance\/searchEvaluatePerformanceReview/, heading: 'Employee Reviews' },
  { menu: MainMenuItem.Directory, urlPattern: /\/directory\/viewDirectory/, heading: 'Directory' },
  { menu: MainMenuItem.Maintenance, urlPattern: /\/maintenance\/purgeEmployee/, heading: 'Administrator Access' },
  { menu: MainMenuItem.Claim, urlPattern: /\/claim\/viewAssignClaim/, heading: 'Employee Claims' },
  { menu: MainMenuItem.Buzz, urlPattern: /\/buzz\/viewBuzz/, heading: 'Buzz' },
];

/** Builds an absolute URL so tests work with or without a configured baseURL. */
export const absoluteUrl = (path: string): string => new URL(path, BASE_URL).toString();
