import { auImages } from "./images";

export type UniversityMatch = {
  id: string;
  university: string;
  course: string;
  location: string;
  score: number;
  budget: string;
  duration: string;
  ielts: string;
  tuition: string;
  intake: string;
  image: string;
  reasons: string[];
  summary: string;
};

export type ChatPrompt = {
  id: string;
  label: string;
  response: string;
};

export type ProfileData = {
  name: string;
  country: string;
  ielts: string;
  gpa: string;
  field: string;
  budget: string;
  outcomesFocus: string;
};

export const universities: UniversityMatch[] = [
  {
    id: "unsw-bcs",
    university: "UNSW Sydney",
    course: "Bachelor of Computer Science",
    location: "Sydney, NSW",
    score: 92,
    budget: "A$58k / year",
    duration: "3 years",
    ielts: "6.5 overall",
    tuition: "Premium metro",
    intake: "Term 1 / 3",
    image: auImages.unsw,
    reasons: ["Strong English", "Career-led", "Industry-linked"],
    summary: "Best aligned for software outcomes, Sydney internships, and a clean English threshold."
  },
  {
    id: "uom-data",
    university: "University of Melbourne",
    course: "Master of Data Science",
    location: "Melbourne, VIC",
    score: 90,
    budget: "A$56k / year",
    duration: "2 years",
    ielts: "6.5 overall",
    tuition: "Premium metro",
    intake: "Feb / Jul",
    image: auImages.melbourneCbd,
    reasons: ["Prestige signal", "Research depth", "City network"],
    summary: "High-signal brand value with strong research and employer recognition."
  },
  {
    id: "monash-it",
    university: "Monash University",
    course: "Master of Information Technology",
    location: "Melbourne, VIC",
    score: 88,
    budget: "A$50k / year",
    duration: "2 years",
    ielts: "6.5 overall",
    tuition: "Balanced",
    intake: "Feb / Jul / Nov",
    image: auImages.monashClayton,
    reasons: ["In budget", "Flexible intakes", "Tech fit"],
    summary: "Balanced choice for cost, intake flexibility, and technical alignment."
  },
  {
    id: "anu-cyber",
    university: "Australian National University",
    course: "Master of Cyber Security",
    location: "Canberra, ACT",
    score: 86,
    budget: "A$49k / year",
    duration: "2 years",
    ielts: "6.5 overall",
    tuition: "Balanced",
    intake: "Feb / Jul",
    image: auImages.anuLibrary,
    reasons: ["Policy adjacency", "Capital city", "Security niche"],
    summary: "Strong option for cyber students interested in policy and government pathways."
  },
  {
    id: "uq-business",
    university: "University of Queensland",
    course: "Master of Business Analytics",
    location: "Brisbane, QLD",
    score: 85,
    budget: "A$47k / year",
    duration: "1.5 years",
    ielts: "6.5 overall",
    tuition: "Value metro",
    intake: "Feb / Jul",
    image: auImages.uqGreatCourt,
    reasons: ["Fast duration", "Warm market", "Budget fit"],
    summary: "Shorter duration with a softer cost profile and a strong Queensland market."
  },
  {
    id: "deakin-se",
    university: "Deakin University",
    course: "Master of Software Engineering",
    location: "Geelong, VIC",
    score: 83,
    budget: "A$41k / year",
    duration: "2 years",
    ielts: "6.0 overall",
    tuition: "Regional value",
    intake: "Mar / Jul / Nov",
    image: auImages.melbourneTram,
    reasons: ["Industry placement", "In budget", "Lower IELTS"],
    summary: "Value-led regional option with a practical entry threshold."
  },
  {
    id: "griffith-nursing",
    university: "Griffith University",
    course: "Bachelor of Nursing",
    location: "Gold Coast, QLD",
    score: 81,
    budget: "A$36k / year",
    duration: "3 years",
    ielts: "7.0 overall",
    tuition: "Regional value",
    intake: "Feb / Jul",
    image: auImages.bondi,
    reasons: ["Healthcare demand", "Regional appeal", "Career clarity"],
    summary: "A practical healthcare pathway for students prioritising employability."
  },
  {
    id: "utas-ict",
    university: "University of Tasmania",
    course: "Bachelor of ICT",
    location: "Hobart, TAS",
    score: 79,
    budget: "A$33k / year",
    duration: "3 years",
    ielts: "6.0 overall",
    tuition: "Most affordable",
    intake: "Feb / Jul",
    image: auImages.outback,
    reasons: ["Budget-first", "Regional pathway", "Accessible entry"],
    summary: "Most affordable pathway for students optimising around budget and regional points."
  }
];

export const advisorPrompts: ChatPrompt[] = [
  {
    id: "ielts-unsw",
    label: "What IELTS for UNSW?",
    response: "For the UNSW Computer Science pathway, a safe benchmark is IELTS 6.5 overall with no band below 6.0. If your current score is lower, UniMate would usually shortlist pathway-friendly alternatives while planning a retake."
  },
  {
    id: "outcomes-courses",
    label: "Strong graduate outcomes",
    response: "For graduate-outcomes-focused planning, UniMate tends to favour regional study options, nursing, software, cyber, and select business analytics pathways where industry placement, employer networks, and campus employability services stack more cleanly. A MARA-registered counsellor handles anything beyond course selection in consultation."
  },
  {
    id: "budget-options",
    label: "Best under A$40k",
    response: "Below A$40k yearly tuition, the shortlist usually moves toward Tasmania, Deakin, Griffith, and other regional-friendly campuses where affordability and academic fit align well with strong graduate employability."
  }
];

export const sopTemplate = {
  intro: "I am applying to {course} at {university} because it offers the academic environment and professional exposure I need to build my next chapter in Australia.",
  background: "My academic and professional background reflects {background}. These experiences have shaped both my discipline and my motivation to pursue advanced study.",
  goals: "In the long term, I aim to {goals}. This course is the bridge between my current foundation and the career I plan to build."
};

export const defaultProfile: ProfileData = {
  name: "Aarav Sharma",
  country: "India",
  ielts: "6.5",
  gpa: "3.4 / 4.0",
  field: "Computer Science",
  budget: "A$45k / year",
  outcomesFocus: "Prioritise courses with strong industry placement"
};

export const admissionsUpdate = {
  title: "Admissions update",
  body: "Australian universities in 2026 emphasise genuine-student evidence, English preparedness, and clear academic intent. Strong financial documentation and a clear course logic matter more than ever. A MARA-registered counsellor can help you assemble an admissions-ready file."
};

export const advisorTip =
  "Pair one prestige option with two outcome-led regional choices. Strong storytelling beats a random list of famous universities.";
