import { createContext, useContext, useState, useEffect } from "react";

const translations = {
  en: {
    // Header & Brand
    brandName: "BuildManage",
    systemSubtitle: "Construction Project & Resource Management",
    roleGeneralManager: "General Manager",
    workspaceTitle: "General Manager Workspace",
    profile: "My Profile",
    logout: "Logout",
    overview: "Overview",
    projects: "Projects",
    users: "Users",
    tasks: "Tasks & Progress",
    workforce: "Workforce",
    inventory: "Materials & Inventory",
    procurement: "Procurement & Suppliers",
    finance: "Finance & Expenses",
    aiInsights: "AI Insights",
    reports: "Reports & Analytics",
    auditLogs: "Audit Logs",
    notifications: "Notifications",
    settings: "Settings",

    // Project Page
    projectsTitle: "Projects",
    projectsSubtitle: "Manage construction projects and assignments",
    createProjectBtn: "Create Project",
    refreshBtn: "Refresh",
    totalProjects: "Total Projects",
    inProgress: "In Progress",
    completed: "Completed",
    unassigned: "Unassigned",
    planned: "Planned",
    onHold: "On Hold",
    cancelled: "Cancelled",
    activeConstruction: "Active construction",
    completedProjects: "Completed projects",
    noProjectManager: "No Project Manager",
    countFromDb: "Count from database",

    // Filters & Search
    searchPlaceholder: "Search name, code, or location...",
    statusFilter: "Status",
    managerFilter: "Project Manager",
    allStatus: "All Status",
    allManagers: "All Managers",
    dateRange: "Date Range",
    startDateFrom: "Start date from",
    startDateTo: "Start date to",
    clearFilters: "Clear Filters",
    filtersLabel: "Search and filters",

    // Table
    tableProject: "Project",
    tableLocation: "Location",
    tableTimeline: "Timeline",
    tableBudget: "Budget",
    tableStatus: "Status",
    tableManager: "Manager",
    tableActions: "Actions",
    viewAction: "View",
    editAction: "Edit",
    assignAction: "Assign",
    archiveAction: "Archive",
    deleteAction: "Delete",
    loadingProjects: "Loading construction projects...",
    noProjectsFound: "No construction projects found matching your criteria.",
    showingResults: "Showing",
    to: "to",
    of: "of",
    projectsWord: "projects",
    previous: "Previous",
    next: "Next",

    // Statuses
    status_PLANNED: "Planned",
    status_IN_PROGRESS: "In Progress",
    status_ON_HOLD: "On Hold",
    status_COMPLETED: "Completed",
    status_CANCELLED: "Cancelled",

    // Create / Edit Form
    createProjectTitle: "Create Construction Project",
    editProjectTitle: "Edit Construction Project",
    projectDetailsTitle: "Project Details",
    section1Title: "Section 1 — Basic Project Information",
    section1Desc: "Identify the construction project.",
    projectNameLabel: "Project Name",
    projectNameHelp: "Required. A clear name that identifies the project.",
    projectCodeLabel: "Project Code",
    projectCodeHelp: "Required unique identifier. Use auto-generate or custom code.",
    autoGenerateBtn: "Auto-generate",
    locationLabel: "Location",
    locationHelp: "Construction site location or municipality.",
    descriptionLabel: "Description",
    descriptionHelp: "Detailed scope, objectives, or construction notes.",

    section2Title: "Section 2 — Schedule and Status",
    section2Desc: "Define the planned timeline.",
    startDateLabel: "Planned Start Date",
    endDateLabel: "Planned End Date",
    endDateHelp: "Must be on or after the planned start date.",
    initialStatusLabel: "Initial Status",
    statusHelp: "New projects should normally start as PLANNED.",

    section3Title: "Section 3 — Budget",
    section3Desc: "Record the approved or initially allocated budget.",
    budgetLabel: "Project Budget",
    budgetHelp: "Validated decimal amount (e.g. 5,000,000.00).",
    currencyLabel: "Currency",

    section4Title: "Section 4 — Project Manager Assignment",
    section4Desc: "Assign responsibility for project delivery.",
    selectManagerPrompt: "Select a Project Manager",
    unassignedOption: "Leave Unassigned (Assign later)",
    managerHelp: "Loads active users with the PROJECT_MANAGER role from the database.",

    cancelBtn: "Cancel",
    saveChangesBtn: "Save Changes",
    submitCreateBtn: "Create Project",
    saving: "Saving...",
    assignManagerTitle: "Assign Project Manager",
    confirmArchiveTitle: "Archive Project",
    confirmArchiveMsg: "Are you sure you want to archive this project? Archived projects are kept safely without destroying audit history.",
    confirmDeleteMsg: "Are you sure you want to permanently delete this project record?",

    // User Management
    userManagementTitle: "User Management",
    userManagementSubtitle: "Manage system users, roles, and account access.",
    addUserBtn: "Add User",
    totalUsersLabel: "Total Users",
    allUserAccountsDesc: "All user accounts",
    activeUsersLabel: "Active Users",
    accountsEnabledDesc: "Accounts enabled",
    inactiveUsersLabel: "Inactive Users",
    accountsDisabledDesc: "Accounts disabled",
    rolesCountLabel: "Roles",
    supportedRolesDesc: "Supported system roles",
    searchUsersPlaceholder: "Search by name, email, or phone...",
    allRolesLabel: "All Roles",
    accountStatusLabel: "Account Status",
    allStatusOption: "All Status",
    activeOption: "Active",
    inactiveOption: "Inactive",

    // UI Tools
    themeDark: "Dark Mode",
    themeLight: "Light Mode",
    language: "Language",
    english: "English",
    amharic: "አማርኛ (Amharic)",

    // HR Module
    hrPortalTitle: "Human Resources Portal",
    hrSuite: "HR Suite",
    workforceManagement: "Workforce Management",
    workforceAndHr: "Workforce & HR",
    allEmployees: "All Employees",
    workforceRoster: "Workforce Roster",
    dailyAttendance: "Daily Attendance",
    leaveRequests: "Leave Requests",
    laborAndPayroll: "Labor & Payroll",
    realTimeActive: "Real-time Active",
    noNotificationsYet: "No notifications yet",
    markAllRead: "Mark all read",
    viewAllNotifications: "View all notifications →",
  },

  am: {
    // Header & Brand
    brandName: "BuildManage",
    systemSubtitle: "የግንባታ ፕሮጀክት እና ሀብት አስተዳደር ሥርዓት",
    roleGeneralManager: "ዋና ሥራ አስኪያጅ",
    workspaceTitle: "የዋና ሥራ አስኪያጅ የሥራ ገጽ",
    profile: "የእኔ መገለጫ",
    logout: "ውጣ",
    overview: "አጠቃላይ እይታ",
    projects: "ፕሮጀክቶች",
    users: "ተጠቃሚዎች",
    tasks: "ተግባራት እና ሂደት",
    workforce: "የሰው ኃይል",
    inventory: "ዕቃዎች እና ክምችት",
    procurement: "ግዥ እና አቅራቢዎች",
    finance: "ፋይናንስ እና ወጪዎች",
    aiInsights: "የAI ግንዛቤዎች",
    reports: "ሪፖርቶች እና ትንታኔ",
    auditLogs: "የኦዲት መዝገቦች",
    notifications: "ማሳወቂያዎች",
    settings: "ቅንብሮች",

    // Project Page
    projectsTitle: "ፕሮጀክቶች",
    projectsSubtitle: "የግንባታ ፕሮጀክቶችን እና ምደባዎችን ያስተዳድሩ",
    createProjectBtn: "ፕሮጀክት ፍጠር",
    refreshBtn: "አድስ",
    totalProjects: "ጠቅላላ ፕሮጀክቶች",
    inProgress: "በሂደት ላይ",
    completed: "የተጠናቀቁ",
    unassigned: "ያልተመደበ",
    planned: "የታቀደ",
    onHold: "ለጊዜው የቆመ",
    cancelled: "የተሰረዘ",
    activeConstruction: "በግንባታ ላይ ያሉ",
    completedProjects: "ሥራቸው ያለቀ ፕሮጀክቶች",
    noProjectManager: "ሥራ አስኪያጅ አልተመደበም",
    countFromDb: "ከመረጃ ቋት የተገኘ ብዛት",

    // Filters & Search
    searchPlaceholder: "በስም፣ በኮድ ወይም በቦታ ፈልግ...",
    statusFilter: "ሁኔታ",
    managerFilter: "የፕሮጀክት ሥራ አስኪያጅ",
    allStatus: "ሁሉም ሁኔታዎች",
    allManagers: "ሁሉም ሥራ አስኪያጆች",
    dateRange: "የቀን ክልል",
    startDateFrom: "የመጀመሪያ ቀን ከ",
    startDateTo: "የመጀመሪያ ቀን እስከ",
    clearFilters: "ማጣሪያዎችን አጽዳ",
    filtersLabel: "ፍለጋ እና ማጣሪያዎች",

    // Table
    tableProject: "ፕሮጀክት",
    tableLocation: "ቦታ",
    tableTimeline: "የጊዜ ሰሌዳ",
    tableBudget: "በጀት",
    tableStatus: "ሁኔታ",
    tableManager: "ሥራ አስኪያጅ",
    tableActions: "እርምጃዎች",
    viewAction: "እይ",
    editAction: "አስተካክል",
    assignAction: "መድብ",
    archiveAction: "ወደ ማህደር አስገባ",
    deleteAction: "ሰርዝ",
    loadingProjects: "የግንባታ ፕሮጀክቶችን በመጫን ላይ...",
    noProjectsFound: "ምንም የተገኘ ፕሮጀክት የለም።",
    showingResults: "የሚታየው",
    to: "እስከ",
    of: "ከ",
    projectsWord: "ፕሮጀክቶች",
    previous: "ቀዳሚ",
    next: "ቀጣይ",

    // Statuses
    status_PLANNED: "የታቀደ",
    status_IN_PROGRESS: "በሂደት ላይ",
    status_ON_HOLD: "ለጊዜው የቆመ",
    status_COMPLETED: "የተጠናቀቀ",
    status_CANCELLED: "የተሰረዘ",

    // Create / Edit Form
    createProjectTitle: "አዲስ የግንባታ ፕሮጀክት ፍጠር",
    editProjectTitle: "የግንባታ ፕሮጀክት መረጃ አስተካክል",
    projectDetailsTitle: "የፕሮጀክት ዝርዝር መረጃ",
    section1Title: "ክፍል 1 — መሰረታዊ የፕሮጀክት መረጃ",
    section1Desc: "የግንባታ ፕሮጀክቱን ይለዩ።",
    projectNameLabel: "የፕሮጀክት ስም",
    projectNameHelp: "ግዴታ። ፕሮጀክቱን በግልጽ የሚለይ ስም።",
    projectCodeLabel: "የፕሮጀክት መለያ ኮድ",
    projectCodeHelp: "የማይደገም ልዩ ኮድ። ራስ-ሰር አመንጭ ይጠቀሙ።",
    autoGenerateBtn: "ራስ-ሰር አመንጭ",
    locationLabel: "የግንባታ ቦታ",
    locationHelp: "የግንባታው ሳይት ወይም ከተማ።",
    descriptionLabel: "ዝርዝር መግለጫ",
    descriptionHelp: "የፕሮጀክቱ ዓላማ፣ ወሰን ወይም ዝርዝር ማስታወሻዎች።",

    section2Title: "ክፍል 2 — የጊዜ ሰሌዳ እና ሁኔታ",
    section2Desc: "የታቀደውን የጊዜ ሰሌዳ ይግለጹ።",
    startDateLabel: "የታቀደ መጀመሪያ ቀን",
    endDateLabel: "የታቀደ ማጠናቀቂያ ቀን",
    endDateHelp: "ከመጀመሪያው ቀን በኋላ ወይም እኩል መሆን አለበት።",
    initialStatusLabel: "የመጀመሪያ ሁኔታ",
    statusHelp: "አዳዲስ ፕሮጀክቶች አብዛኛውን ጊዜ 'የታቀደ' በሚል ይጀምራሉ።",

    section3Title: "ክፍል 3 — በጀት",
    section3Desc: "የተፈቀደውን ወይም የተመደበውን በጀት ያስመዝግቡ።",
    budgetLabel: "የፕሮጀክት በጀት",
    budgetHelp: "ትክክለኛ የቁጥር መጠን (ለምሳሌ 5,000,000.00)።",
    currencyLabel: "የገንዘብ ምንዛሬ",

    section4Title: "ክፍል 4 — የፕሮጀክት ሥራ አስኪያጅ ምደባ",
    section4Desc: "ለፕሮጀክቱ ተጠያቂ ሥራ አስኪያጅ ይመድቡ።",
    selectManagerPrompt: "የፕሮጀክት ሥራ አስኪያጅ ይምረጡ",
    unassignedOption: "ያለ ሥራ አስኪያጅ ይቆይ (በኋላ ይመደባል)",
    managerHelp: "ንቁ የሆኑ የPROJECT_MANAGER ሚና ያላቸውን ተጠቃሚዎች ከመረጃ ቋት ይጭናል።",

    cancelBtn: "ተመለስ",
    saveChangesBtn: "ለውጦችን መዝግብ",
    submitCreateBtn: "ፕሮጀክት ፍጠር",
    saving: "በማስቀመጥ ላይ...",
    assignManagerTitle: "የፕሮጀክት ሥራ አስኪያጅ መድብ",
    confirmArchiveTitle: "ፕሮጀክት ወደ ማህደር አስገባ",
    confirmArchiveMsg: "ይህንን ፕሮጀክት ወደ ማህደር ማስገባት ይፈልጋሉ? በማህደር የተቀመጡ ፕሮጀክቶች ታሪካቸው ሳይጠፋ በደህንነት ይቀመጣሉ።",
    confirmDeleteMsg: "ይህንን ፕሮጀክት በቋሚነት መሰረዝ ይፈልጋሉ?",

    // User Management
    userManagementTitle: "የተጠቃሚዎች አስተዳደር",
    userManagementSubtitle: "የሥርዓቱ ተጠቃሚዎችን፣ ሚናዎችን እና የመለያ ፈቃዶችን ያስተዳድሩ።",
    addUserBtn: "አዲስ ተጠቃሚ ጨምር",
    totalUsersLabel: "አጠቃላይ ተጠቃሚዎች",
    allUserAccountsDesc: "ሁሉም የተጠቃሚ መለያዎች",
    activeUsersLabel: "ንቁ ተጠቃሚዎች",
    accountsEnabledDesc: "የነቁ መለያዎች",
    inactiveUsersLabel: "የቦዘኑ ተጠቃሚዎች",
    accountsDisabledDesc: "የታገዱ መለያዎች",
    rolesCountLabel: "ሚናዎች",
    supportedRolesDesc: "የሚደገፉ የሥርዓት ሚናዎች",
    searchUsersPlaceholder: "በስም፣ ኢሜይል ወይም ስልክ ፈልግ...",
    allRolesLabel: "ሁሉም ሚናዎች",
    accountStatusLabel: "የመለያ ሁኔታ",
    allStatusOption: "ሁሉም ሁኔታዎች",
    activeOption: "ንቁ",
    inactiveOption: "የቦዘነ",

    // UI Tools
    themeDark: "ጨለማ ገጽታ",
    themeLight: "ብርሃን ገጽታ",
    language: "ቋንቋ",
    english: "English",
    amharic: "አማርኛ",

    // HR Module
    hrPortalTitle: "የሰው ኃይል መምሪያ ፖርታል",
    hrSuite: "የሰው ኃይል",
    workforceManagement: "የሰው ኃይል አስተዳደር",
    workforceAndHr: "የሰው ኃይል እና አስተዳደር",
    allEmployees: "ሁሉም ሠራተኞች",
    workforceRoster: "የሠራተኞች መዝገብ",
    dailyAttendance: "ዕለታዊ የሥራ ክትትል",
    leaveRequests: "የዕረፍት ጥያቄዎች",
    laborAndPayroll: "የደመወዝ ክፍያ",
    realTimeActive: "በቀጥታ ንቁ",
    noNotificationsYet: "ምንም ማሳወቂያዎች የሉም",
    markAllRead: "ሁሉንም እንደተነበበ ምልክት አድርግ",
    viewAllNotifications: "ሁሉንም ማሳወቂያዎች ይመልከቱ →",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("app_language") || "en";
  });

  const changeLanguage = (lang) => {
    if (lang === "en" || lang === "am") {
      setLanguage(lang);
      localStorage.setItem("app_language", lang);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
