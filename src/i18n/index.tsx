import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

export type Language = "en" | "hi" | "mr";

export interface Translations {
  appName: string;
  appSubtitle: string;
  macroDashboard: string;
  candidatePortal: string;
  skillAssessment: string;
  verifyRegistry: string;
  employerPortal: string;
  instituteDashboard: string;
  trainerPortal: string;
  adminPortal: string;
  marketIntelligence: string;
  demandTrends: string;
  skillGapAnalysis: string;
  curriculumAlignment: string;
  employerInsights: string;
  aiRecommendations: string;
  districtPlanning: string;
  reportsAnalytics: string;
  userManagement: string;
  systemSettings: string;
  signIn: string;
  register: string;
  signOut: string;
  askCopilot: string;
  whatToLearnToday: string;
  verifiedOfficialAccount: string;
  liveDbConnected: string;
  liveDbConnecting: string;
  languageSelect: string;
  takeAssessment: string;
  verifyCertificate: string;
  jobMatches: string;
  whyExplanation: string;
  onboardingTitle: string;
  onboardingDesc: string;
}

const translations: Record<Language, Translations> = {
  en: {
    appName: "SARATHI",
    appSubtitle: "Labour Market Intelligence & Career Platform",
    macroDashboard: "Macro Labour Market",
    candidatePortal: "Candidate Portal",
    skillAssessment: "Skill Assessment",
    verifyRegistry: "Certificate Registry",
    employerPortal: "Employer Portal",
    instituteDashboard: "Institute Dashboard",
    trainerPortal: "Trainer Portal",
    adminPortal: "Admin & Verification Console",
    marketIntelligence: "Market Intelligence",
    demandTrends: "Demand Trends",
    skillGapAnalysis: "Skill Gap Analysis",
    curriculumAlignment: "Curriculum Alignment",
    employerInsights: "Employer Insights",
    aiRecommendations: "AI Recommendations",
    districtPlanning: "District Planning",
    reportsAnalytics: "Reports & Analytics",
    userManagement: "User Management",
    systemSettings: "System Settings",
    signIn: "Sign In",
    register: "Register",
    signOut: "Sign Out",
    askCopilot: "Ask SARATHI AI Copilot",
    whatToLearnToday: "What should I learn today?",
    verifiedOfficialAccount: "Official SARATHI Account",
    liveDbConnected: "DB: Connected (SQLite Live)",
    liveDbConnecting: "DB: Connecting...",
    languageSelect: "Language",
    takeAssessment: "Take Skill Assessment",
    verifyCertificate: "Verify Certificate",
    jobMatches: "Matching Opportunities",
    whyExplanation: "Why is this recommended?",
    onboardingTitle: "Personalize Your Career Roadmap",
    onboardingDesc: "Tell us about your interests, preferred work mode, and target roles to unlock tailored daily learning.",
  },
  hi: {
    appName: "सारथी (SARATHI)",
    appSubtitle: "श्रम बाजार आसूचना एवं कौशल विकास मंच",
    macroDashboard: "समग्र श्रम बाजार डैशबोर्ड",
    candidatePortal: "विद्यार्थी / अभ्यर्थी पोर्टल",
    skillAssessment: "कौशल मूल्यांकन परीक्षा",
    verifyRegistry: "प्रमाणपत्र सत्यापन केंद्र",
    employerPortal: "नियोक्ता एवं उद्योग पोर्टल",
    instituteDashboard: "प्रशिक्षण संस्थान डैशबोर्ड",
    trainerPortal: "प्रशिक्षक पोर्टल",
    adminPortal: "प्रशासनिक एवं सत्यापन कंसोल",
    marketIntelligence: "बाजार आसूचना",
    demandTrends: "मांग एवं प्रवृत्तियाँ",
    skillGapAnalysis: "कौशल अंतराल विश्लेषण",
    curriculumAlignment: "पाठ्यचर्या संरेखण",
    employerInsights: "नियोक्ता अंतर्दृष्टि",
    aiRecommendations: "एआई अनुशंसाएं",
    districtPlanning: "जिला स्तरीय योजना",
    reportsAnalytics: "रिपोर्ट एवं विश्लेषण",
    userManagement: "उपयोगकर्ता प्रबंधन",
    systemSettings: "सिस्टम सेटिंग्स",
    signIn: "लॉग इन करें",
    register: "पंजीकरण करें",
    signOut: "लॉग आउट",
    askCopilot: "सारथी एआई से पूछें",
    whatToLearnToday: "आज मुझे क्या सीखना चाहिए?",
    verifiedOfficialAccount: "सत्यापित आधिकारिक सारथी खाता",
    liveDbConnected: "डेटाबेस: सक्रिय जुड़ाव (SQLite)",
    liveDbConnecting: "डेटाबेस से जुड़ रहा है...",
    languageSelect: "भाषा",
    takeAssessment: "कौशल मूल्यांकन लें",
    verifyCertificate: "प्रमाणपत्र सत्यापित करें",
    jobMatches: "अनुरूप रोजगार अवसर",
    whyExplanation: "यह क्यों अनुशंसित है?",
    onboardingTitle: "अपनी करियर कार्ययोजना बनाएं",
    onboardingDesc: "दैनिक शिक्षण योजना के लिए अपनी रुचियां, कार्य प्राथमिकताएं और लक्षित भूमिकाएं चुनें।",
  },
  mr: {
    appName: "सारथी (SARATHI)",
    appSubtitle: "कामगार बाजार बुद्धिमत्ता व कौशल्य विकास व्यासपीठ",
    macroDashboard: "सर्वसमावेशक कामगार बाजार",
    candidatePortal: "उमेदवार / विद्यार्थी दालन",
    skillAssessment: "कौशल्य मूल्यमापन चाचणी",
    verifyRegistry: "प्रमाणपत्र पडताळणी नोंदवही",
    employerPortal: "नियोक्ता व उद्योग दालन",
    instituteDashboard: "प्रशिक्षण संस्था डॅशबोर्ड",
    trainerPortal: "प्रशिक्षक दालन",
    adminPortal: "प्रशासकीय व पडताळणी केंद्र",
    marketIntelligence: "बाजार बुद्धिमत्ता",
    demandTrends: "मागणी आणि कल",
    skillGapAnalysis: "कौशल्य तफावत विश्लेषण",
    curriculumAlignment: "अभ्यासक्रम सुसंगतीकरण",
    employerInsights: "नियोक्ता निरीक्षणे",
    aiRecommendations: "एआय शिफारसी",
    districtPlanning: "जिल्हास्तरीय नियोजन",
    reportsAnalytics: "अहवाल व विश्लेषण",
    userManagement: "वापरकर्ता व्यवस्थापन",
    systemSettings: "प्रणाली संरचना",
    signIn: "साइन इन करा",
    register: "नोंदणी करा",
    signOut: "साइन आउट",
    askCopilot: "सारथी एआय ला विचारा",
    whatToLearnToday: "मी आज काय शिकले पाहिजे?",
    verifiedOfficialAccount: "अधिकृत सारथी खाते",
    liveDbConnected: "डेटाबेस: जोडणी सक्रिय (SQLite)",
    liveDbConnecting: "डेटाबेस जोडणी सुरू आहे...",
    languageSelect: "भाषा",
    takeAssessment: "कौशल्य चाचणी द्या",
    verifyCertificate: "प्रमाणपत्र तपासा",
    jobMatches: "योग्य नोकरीच्या संधी",
    whyExplanation: "ही शिफारस का केली आहे?",
    onboardingTitle: "आपला करिअर मार्ग निश्चित करा",
    onboardingDesc: "आपल्या आवडी, कामाचे स्वरूप आणि लक्ष्यित नोकऱ्या निवडून वैयक्तिकृत मार्गदर्शन मिळवा.",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: (k) => translations.en[k] || k,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("sarathi_lang") as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("sarathi_lang", lang);
  }, []);

  const t = useCallback(
    (key: keyof Translations): string => {
      return translations[language]?.[key] || translations.en[key] || String(key);
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
