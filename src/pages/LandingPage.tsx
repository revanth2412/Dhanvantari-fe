import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BrandMark } from "@/components/ui/BrandMark";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Calculator,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Cpu,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Globe,
  Headphones,
  HeartPulse,
  Languages,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Mic,
  Pause,
  PhoneCall,
  PhoneForwarded,
  Pill,
  Play,
  QrCode,
  Radio,
  RotateCcw,
  Scale,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
  Volume2,
  WandSparkles,
  Zap,
} from "lucide-react";

interface ClinicalScenario {
  id: string;
  specialty: string;
  badge: string;
  icon: string;
  patientInfo: {
    name: string;
    ageGender: string;
    vitals: string;
  };
  dialogue: Array<{ speaker: "doctor" | "patient"; text: string }>;
  extractedNote: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    vitals: string;
    assessment: string;
    prescriptions: Array<{
      drug: string;
      dosage: string;
      duration: string;
      instructions: string;
    }>;
    investigations: string[];
    advice: string[];
    redFlags: string[];
    confidence: number;
    icd10: string;
  };
}

const CLINICAL_SCENARIOS: ClinicalScenario[] = [
  {
    id: "cardio",
    specialty: "Cardiology",
    badge: "Acute Presentation",
    icon: "🫀",
    patientInfo: {
      name: "Ramesh Verma",
      ageGender: "58 Y / Male",
      vitals: "BP: 154/94 mmHg · HR: 88 bpm · SpO2: 98%",
    },
    dialogue: [
      {
        speaker: "doctor",
        text: "Good morning Mr. Verma. What brings you to the cardiology clinic today?",
      },
      {
        speaker: "patient",
        text: "Doctor, for the past 4 days, I've had this tight squeezing pressure in the center of my chest whenever I climb the stairs.",
      },
      {
        speaker: "doctor",
        text: "Does the pain radiate to your left shoulder, jaw, or down your arm? Any sweating or shortness of breath?",
      },
      {
        speaker: "patient",
        text: "Yes, it travels slightly towards my left shoulder. It subsides within 5 minutes if I sit down and rest.",
      },
      {
        speaker: "doctor",
        text: "Understood. Let's check your blood pressure. 154 over 94. We are starting you on Telmisartan 40mg for BP control, Atorvastatin 20mg for cholesterol, and Sorbitrate 5mg sublingual if acute chest discomfort strikes. We will also do a 12-lead ECG, 2D ECHO, and fasting lipid profile right away.",
      },
    ],
    extractedNote: {
      chiefComplaint: "Retrosternal squeezing chest discomfort on exertion x 4 days",
      historyOfPresentIllness:
        "58M with exertional chest pressure radiating to left shoulder, relieved with rest within 5 min. Associated mild dyspnea, no diaphoresis or syncope.",
      vitals: "BP: 154/94 mmHg (Stage 2 HTN), HR: 88 bpm, SpO2: 98% on room air",
      assessment:
        "1. Suspected Exertional Angina Pectoris (Class II NYHA)\n2. Stage 2 Essential Hypertension\n3. Dyslipidemia (evaluation)",
      icd10: "I20.9 (Angina Pectoris, Unspecified) / I10 (Essential Hypertension)",
      prescriptions: [
        {
          drug: "Tab. Telmisartan",
          dosage: "40 mg",
          duration: "30 Days",
          instructions: "1 tab OD (Morning, after food)",
        },
        {
          drug: "Tab. Atorvastatin",
          dosage: "20 mg",
          duration: "30 Days",
          instructions: "1 tab HS (Bedtime)",
        },
        {
          drug: "Tab. Sorbitrate",
          dosage: "5 mg",
          duration: "SOS",
          instructions: "Sublingual PRN for acute chest pain",
        },
      ],
      investigations: [
        "12-Lead Electrocardiogram (ECG)",
        "2D Echocardiography with Doppler",
        "Fasting Lipid Profile & Hs-Troponin I",
      ],
      advice: [
        "Strict low-salt (<2g/day), cardiac-healthy diet",
        "Avoid strenuous physical exertion until treadmill evaluation",
        "Immediate emergency visit if pain lasts > 15 minutes",
      ],
      redFlags: [
        "Chest pain unresponsive to rest / sublingual nitrate",
        "Acute dyspnea, syncope, or diaphoresis",
      ],
      confidence: 99.4,
    },
  },
  {
    id: "internal-med",
    specialty: "Internal Medicine",
    badge: "Chronic Care",
    icon: "🩺",
    patientInfo: {
      name: "Sunita Patel",
      ageGender: "49 Y / Female",
      vitals: "BP: 128/82 mmHg · BMI: 28.4 · Fasting Glucose: 186 mg/dL",
    },
    dialogue: [
      {
        speaker: "doctor",
        text: "Hello Sunita ji. How have your sugar readings and energy levels been over the last month?",
      },
      {
        speaker: "patient",
        text: "I've been feeling extremely fatigued lately, doctor. I find myself drinking 4 liters of water a day and waking up twice at night to urinate.",
      },
      {
        speaker: "doctor",
        text: "Your recent fasting blood sugar came back at 186 and HbA1c is 8.6%. Any burning sensation or tingling in your feet?",
      },
      {
        speaker: "patient",
        text: "Yes, especially in my soles when I go to sleep at night.",
      },
      {
        speaker: "doctor",
        text: "We need to optimize your glycemic control. We will increase your Metformin to 1000mg extended release with dinner, add Teneligliptin 20mg in the morning, and start Methylcobalamin with Pregabalin for peripheral neuropathy. Let's re-test renal function and urine microalbumin.",
      },
    ],
    extractedNote: {
      chiefComplaint: "Severe fatigue, polydipsia, and nocturnal polyuria x 1 month",
      historyOfPresentIllness:
        "49F with known T2DM presenting with osmotic symptoms (polydipsia, polyuria) and bilateral nocturnal burning paresthesias in feet. Non-adherent to prior diet regimen.",
      vitals:
        "BP: 128/82 mmHg, Weight: 72 kg, BMI: 28.4 kg/m², Fasting Plasma Glucose: 186 mg/dL, HbA1c: 8.6%",
      assessment:
        "1. Uncontrolled Type 2 Diabetes Mellitus with poor glycemic target\n2. Early Diabetic Peripheral Neuropathy\n3. Overweight (BMI 28.4)",
      icd10: "E11.40 (Type 2 DM with Neuropathy) / E11.65 (Uncontrolled T2DM)",
      prescriptions: [
        {
          drug: "Tab. Metformin SR",
          dosage: "1000 mg",
          duration: "60 Days",
          instructions: "1 tab with evening meal",
        },
        {
          drug: "Tab. Teneligliptin",
          dosage: "20 mg",
          duration: "60 Days",
          instructions: "1 tab OD before breakfast",
        },
        {
          drug: "Cap. Methylcobalamin + Pregabalin",
          dosage: "75/750 mcg",
          duration: "30 Days",
          instructions: "1 cap HS at bedtime",
        },
      ],
      investigations: [
        "Serum Creatinine, eGFR, Blood Urea",
        "Spot Urine Albumin-to-Creatinine Ratio (UACR)",
        "Fundus Examination for Retinopathy",
      ],
      advice: [
        "Diabetic nutrition plan: low GI carbs, high fiber",
        "Brisk walking 30 mins/day, 5 days/week",
        "Daily foot inspection for micro-trauma",
      ],
      redFlags: [
        "Non-healing foot ulcers or sudden loss of sensation",
        "Persistent nausea, vomiting, or deep labored breathing",
      ],
      confidence: 99.1,
    },
  },
  {
    id: "pediatrics",
    specialty: "Pediatrics",
    badge: "Acute Respiratory",
    icon: "👶",
    patientInfo: {
      name: "Aarav Nair (Mother reporting)",
      ageGender: "4 Y / Male",
      vitals: "Temp: 100.4°F · RR: 26/min · SpO2: 97%",
    },
    dialogue: [
      { speaker: "doctor", text: "Namaste. How is little Aarav doing today?" },
      {
        speaker: "patient",
        text: "Doctor, he has had a runny nose and dry barking cough for 3 days. Last night he was wheezing and couldn't sleep.",
      },
      {
        speaker: "doctor",
        text: "Let me listen to his lungs. Chest shows bilateral mild expiratory wheezes, throat is mildly congested, no subcostal retractions. Hydration is adequate.",
      },
      {
        speaker: "patient",
        text: "Is it pneumonia doctor? Should we start an antibiotic?",
      },
      {
        speaker: "doctor",
        text: "No pneumonia. This is viral reactive airway bronchitis. We do not need antibiotics. We will give Levosalbutamol nebulizer/syrup for the bronchospasm and Paracetamol drops for fever. Steam inhalation twice daily will soothe the airway.",
      },
    ],
    extractedNote: {
      chiefComplaint: "Barking cough, nocturnal wheezing, and low-grade fever x 3 days",
      historyOfPresentIllness:
        "4yo boy brought by mother with 3-day history of clear rhinorrhea followed by spasmodic dry cough and nocturnal wheezing. No history of foreign body ingestion.",
      vitals:
        "Temp: 100.4°F (38°C), RR: 26/min (normal for age), SpO2: 97% on room air, Weight: 16.2 kg",
      assessment:
        "1. Acute Viral Bronchitis with Reactive Airway Wheeze\n2. No signs of respiratory distress or consolidation",
      icd10: "J20.8 (Acute Bronchitis) / J45.909 (Unspecified Asthma with Wheezing)",
      prescriptions: [
        {
          drug: "Syr. Levosalbutamol",
          dosage: "2.5 ml",
          duration: "5 Days",
          instructions: "2.5 ml TDS (every 8 hours)",
        },
        {
          drug: "Syr. Paracetamol 250mg/5ml",
          dosage: "3.5 ml",
          duration: "SOS",
          instructions: "3.5 ml for fever > 100°F (Max 4 times/day)",
        },
        {
          drug: "Saline Nasal Drops 0.65%",
          dosage: "2 drops",
          duration: "5 Days",
          instructions: "2 drops in each nostril before feeds",
        },
      ],
      investigations: [
        "No imaging or blood work indicated currently",
        "Observe clinical trajectory over 48 hours",
      ],
      advice: [
        "Warm steam inhalation twice daily",
        "Frequent sips of warm fluids and tender coconut water",
        "Avoid exposure to dust, aerosol sprays, and incense smoke",
      ],
      redFlags: [
        "Tachypnea > 35 breaths/minute or chest wall indrawing",
        "Lethargy, refusal of liquids, or grunting breathing",
      ],
      confidence: 99.6,
    },
  },
  {
    id: "neuro",
    specialty: "Neurology",
    badge: "Neurological Workup",
    icon: "🧠",
    patientInfo: {
      name: "Deepa Krishnan",
      ageGender: "36 Y / Female",
      vitals: "BP: 118/76 mmHg · HR: 72 bpm · Neurological exam normal",
    },
    dialogue: [
      {
        speaker: "doctor",
        text: "Hello Deepa. Tell me what's happening with these headaches.",
      },
      {
        speaker: "patient",
        text: "Doctor, 3 to 4 times a month I get this debilitating throbbing pain on the right side of my head. Before it starts, I see shimmering zigzag lights in my vision for about 20 minutes.",
      },
      {
        speaker: "doctor",
        text: "Do you also experience nausea, light sensitivity, or sound intolerance during the attacks?",
      },
      {
        speaker: "patient",
        text: "Yes, I have to lie down in a completely dark, quiet room. Screen light makes me feel like vomiting.",
      },
      {
        speaker: "doctor",
        text: "This is a classic presentation of Migraine with Aura. We will give you Rizatriptan with Naproxen to abort acute attacks early, and start low-dose Propranolol daily to reduce monthly frequency. Keep a headache trigger diary.",
      },
    ],
    extractedNote: {
      chiefComplaint:
        "Recurrent unilateral throbbing headache with visual aura x 4 months",
      historyOfPresentIllness:
        "36F software architect with 3-4 episodes/month of severe hemicranial pulsating headache preceded by 20-min scintillating scotoma. Accompanied by severe photophobia, phonophobia, and nausea.",
      vitals:
        "BP: 118/76 mmHg, Cranial nerves II-XII intact, Fundoscopy normal, No focal deficit",
      assessment:
        "1. Episodic Migraine with Typical Visual Aura (ICD-10 G43.109)\n2. High disability score (MIDAS Grade III)",
      icd10: "G43.109 (Migraine with aura, not intractable)",
      prescriptions: [
        {
          drug: "Tab. Rizatriptan",
          dosage: "10 mg",
          duration: "SOS",
          instructions: "1 tab stat at aura onset; repeat in 2h if needed (Max 2/day)",
        },
        {
          drug: "Tab. Naproxen",
          dosage: "500 mg",
          duration: "SOS",
          instructions: "1 tab with Rizatriptan for synergistic relief",
        },
        {
          drug: "Tab. Propranolol SR",
          dosage: "40 mg",
          duration: "60 Days",
          instructions: "1 tab OD in the morning (Prophylaxis)",
        },
      ],
      investigations: [
        "Headache diary recording sleep, caffeine, and stress triggers",
        "MRI Brain not indicated (benign ICHD-3 criteria)",
      ],
      advice: [
        "Consistent sleep-wake cycle even on weekends",
        "Hydration 2.5L daily, avoid skipping meals",
        "Blue-light filter glasses and hourly screen breaks",
      ],
      redFlags: [
        "Sudden 'thunderclap' headache reaching peak in seconds",
        "Focal neurological deficit lasting > 60 minutes",
      ],
      confidence: 99.5,
    },
  },
  {
    id: "ortho",
    specialty: "Orthopedics",
    badge: "Joint & Mobility",
    icon: "🦴",
    patientInfo: {
      name: "Kalyan Sundaram",
      ageGender: "64 Y / Male",
      vitals: "BP: 132/84 mmHg · BMI: 29.1 · Bilateral Knee Pain",
    },
    dialogue: [
      {
        speaker: "doctor",
        text: "Good afternoon Mr. Sundaram. How are your knees feeling lately?",
      },
      {
        speaker: "patient",
        text: "Doctor, climbing stairs is becoming impossible. My right knee makes cracking sounds and swells up by evening after walking.",
      },
      {
        speaker: "doctor",
        text: "On examination, there is crepitus in the right patellofemoral compartment and mild suprapatellar effusion. Range of motion is 0 to 110 degrees with joint line tenderness. Let's do weight-bearing standing AP and lateral X-rays of both knees.",
      },
      { speaker: "patient", text: "Do I need immediate surgery, doctor?" },
      {
        speaker: "doctor",
        text: "Not right now. We will manage this conservatively: Aceclofenac with Paracetamol for acute pain flare-ups, Glucosamine sulfate, quadriceps strengthening physiotherapy, and weight management.",
      },
    ],
    extractedNote: {
      chiefComplaint:
        "Bilateral knee pain and stiffness (R > L), exacerbated by stairs x 6 months",
      historyOfPresentIllness:
        "64M presenting with progressive mechanical knee pain, morning stiffness lasting 15 mins, and audible crepitus with evening swelling after weight-bearing activity.",
      vitals: "BP: 132/84 mmHg, BMI: 29.1 kg/m², Antalgic gait favoring right lower limb",
      assessment:
        "1. Primary Osteoarthritis of Right Knee (Kellgren-Lawrence Grade III)\n2. Mild Right Knee Reactive Synovial Effusion",
      icd10: "M17.11 (Unilateral primary osteoarthritis, right knee)",
      prescriptions: [
        {
          drug: "Tab. Aceclofenac + Paracetamol",
          dosage: "100/325 mg",
          duration: "7 Days",
          instructions: "1 tab BD after food (Pain SOS)",
        },
        {
          drug: "Cap. Diacerein + Glucosamine",
          dosage: "50/750 mg",
          duration: "90 Days",
          instructions: "1 cap OD after lunch",
        },
        {
          drug: "Gel. Diclofenac Topical",
          dosage: "1%",
          duration: "30 Days",
          instructions: "Apply locally over right knee TDS without vigorous rubbing",
        },
      ],
      investigations: [
        "Standing Weight-Bearing X-Ray Both Knees (AP + Lateral)",
        "Serum Uric Acid & ESR",
      ],
      advice: [
        "Quadriceps isometric exercises with physical therapist 3x/week",
        "Avoid cross-legged sitting and deep squatting",
        "Low-impact pool walking / stationary cycling",
      ],
      redFlags: [
        "Sudden inability to bear weight or joint locking",
        "Erythema, hot joint with high fever (suspect septic arthritis)",
      ],
      confidence: 99.3,
    },
  },
  {
    id: "pulmo",
    specialty: "Pulmonology",
    badge: "Airway & Lungs",
    icon: "🫁",
    patientInfo: {
      name: "Tariq Ahmed",
      ageGender: "52 Y / Male",
      vitals: "BP: 138/86 mmHg · HR: 92 bpm · SpO2: 94% on RA · RR: 22/min",
    },
    dialogue: [
      {
        speaker: "doctor",
        text: "Hello Tariq. You mentioned your breathing has worsened over the past week?",
      },
      {
        speaker: "patient",
        text: "Yes doctor, my chest feels congested with yellowish phlegm in the morning, and I get breathless even walking 100 meters on flat ground.",
      },
      {
        speaker: "doctor",
        text: "Auscultation reveals scattered polyphonic rhonchi throughout both lung fields with prolonged expiratory phase. Peak flow meter reading is 280 L/min. Have you been using your inhaler regularly?",
      },
      {
        speaker: "patient",
        text: "I stopped it two weeks ago when I was feeling better.",
      },
      {
        speaker: "doctor",
        text: "Never discontinue maintenance inhalers abruptly. We will step up to Budesonide with Formoterol 400mcg DPI twice daily, add N-Acetylcysteine effervescent tablets for mucus clearance, and a 5-day course of Cefuroxime for the purulent sputum. Let's do a repeat Spirometry after 2 weeks.",
      },
    ],
    extractedNote: {
      chiefComplaint:
        "Productive cough with yellow sputum and exertional breathlessness x 7 days",
      historyOfPresentIllness:
        "52M with known COPD/Asthma overlap presenting with acute infective exacerbation following non-compliance with maintenance inhaled corticosteroids. Decreased exercise tolerance.",
      vitals:
        "BP: 138/86 mmHg, HR: 92 bpm, SpO2: 94% on room air, RR: 22/min, PEFR: 280 L/min (predicted 450 L/min)",
      assessment:
        "1. Acute Infective Exacerbation of COPD (GOLD Group E)\n2. Airway Mucus Hypersecretion\n3. Inhaler Non-Adherence",
      icd10: "J44.1 (COPD with acute exacerbation) / J45.901 (Asthma with exacerbation)",
      prescriptions: [
        {
          drug: "Inhaler Budesonide + Formoterol",
          dosage: "400/6 mcg",
          duration: "60 Days",
          instructions: "1 puff BD via spacer followed by mouth gargle",
        },
        {
          drug: "Tab. N-Acetylcysteine Effervescent",
          dosage: "600 mg",
          duration: "10 Days",
          instructions: "1 tab dissolved in water OD after breakfast",
        },
        {
          drug: "Tab. Cefuroxime Axetil",
          dosage: "500 mg",
          duration: "5 Days",
          instructions: "1 tab BD after meals",
        },
      ],
      investigations: [
        "Chest X-Ray PA View (rule out focal consolidation)",
        "Sputum Routine & Culture Sensitivity",
        "Post-bronchodilator Spirometry (in 2 weeks)",
      ],
      advice: [
        "Demonstrated proper meter-dose inhaler (MDI) technique with spacer",
        "Annual Influenza and Pneumococcal vaccination",
        "Immediate smoking cessation counseling",
      ],
      redFlags: [
        "Rest dyspnea with SpO2 dropping below 92%",
        "Confusion, cyanosis, or accessory muscle breathing",
      ],
      confidence: 99.7,
    },
  },
];

const VERNACULAR_EXAMPLES = [
  {
    lang: "Hindi & Hinglish",
    flag: "🇮🇳",
    rawAudio:
      "Doctor sahab, 3 din se bahut severe headache hai aur ulti jaisa lag raha hai. BP check kar lijiye please.",
    extracted:
      "Patient reports severe cephalalgia x 3 days with associated nausea. Requests arterial pressure evaluation.",
    tags: ["Headache (Cephalalgia)", "Nausea", "BP Check"],
  },
  {
    lang: "Tamil & Tanglish",
    flag: "🇮🇳",
    rawAudio:
      "Doctor, rendu naala right knee la bayangarama pain. Stairs climb panna mudiyala, swelling irukku.",
    extracted:
      "Right knee mechanical arthralgia x 2 days with functional limitation on stairs and localized joint edema.",
    tags: ["Right Knee Arthralgia", "Joint Effusion", "Stair Impairment"],
  },
  {
    lang: "Telugu-English",
    flag: "🇮🇳",
    rawAudio:
      "Namaskaram doctor garu, past one week nundi sugar levels chala high unnai, frequent ga thirst and urination vastondi.",
    extracted:
      "Presenting with marked osmotic symptoms (polydipsia, polyuria) and uncontrolled glycemic profile x 1 week.",
    tags: ["Hyperglycemia", "Polydipsia", "Polyuria"],
  },
  {
    lang: "Malayalam-English",
    flag: "🇮🇳",
    rawAudio:
      "Doctor, oru aazhchayayi kooduthal chuma undu. Raathriyil breathlessness karanam urangan pattunnilla.",
    extracted:
      "Persistent productive cough x 7 days with nocturnal dyspnea and sleep disruption. Reactive airway wheeze.",
    tags: ["Productive Cough", "Nocturnal Dyspnea", "Sleep Disturbance"],
  },
  {
    lang: "Kannada-English",
    flag: "🇮🇳",
    rawAudio:
      "Doctor, 4 days inda thumba chest heaviness ide, walking madidre breathless agutte. Gas problem ankoltiya?",
    extracted:
      "Exertional retrosternal heaviness with dyspnea on ambulation x 4 days. Queries dyspepsia vs angina pectoris.",
    tags: ["Chest Heaviness", "Exertional Dyspnea", "Differential: Angina"],
  },
  {
    lang: "Bengali & Indian English",
    flag: "🇮🇳",
    rawAudio:
      "Doctor babu, amar khub gas ebong chest discomfort hocche, especially khawar por shuye thakle.",
    extracted:
      "Postprandial retrosternal burning discomfort aggravated in recumbent position. Suggestive of acute GERD.",
    tags: ["Postprandial Pyrosis", "Recumbent Dyspepsia", "GERD"],
  },
];

const FAQS = [
  {
    q: "How does MediVaani capture consultations without special hardware?",
    a: "MediVaani runs directly in any modern web browser on your laptop, tablet, or phone. It uses standard device microphones with ambient acoustic filtering. No proprietary dongles or hardware installations required.",
  },
  {
    q: "How does MediVaani handle Indian regional languages and mixed vernaculars?",
    a: "Our clinical speech pipeline is fine-tuned on diverse Indian clinical vernaculars (Hinglish, Tamil-English, Telugu-English, Hindi, Kannada, Malayalam, Bengali, Gujarati, Marathi) alongside standard medical accents. It accurately identifies Indian pharmaceutical brands (e.g., Telmisartan, Augmentin, Glycomet) and translates colloquial symptom descriptions into standard medical terminology.",
  },
  {
    q: "Is MediVaani compliant with India's DPDP Act 2023?",
    a: "Yes. MediVaani is strictly aligned with India's Digital Personal Data Protection (DPDP) Act 2023. Data is processed in-country, digital patient consent is logged before recording, audio is ephemeral, and patient records are never used to train foundation models.",
  },
  {
    q: "Can I customize the generated notes to match our clinic's specific format?",
    a: "Absolutely. Clinicians can choose between SOAP notes, OPD prescription summaries, discharge summaries, or narrative consultation formats. You can also edit and refine any note in real-time before finalizing.",
  },
  {
    q: "How do MediVaani Voice Agents and WhatsApp integration work?",
    a: "MediVaani includes 24/7 AI voice agents that handle incoming patient phone calls, automate appointment bookings & rescheduling, answer clinic FAQs, and send automated WhatsApp appointment confirmations & digital prescriptions.",
  },
];

export function LandingPage() {
  const pageRef = useRef<HTMLElement | null>(null);

  // Interactive Scenario State
  const [activeScenarioId, setActiveScenarioId] = useState<string>("cardio");
  const [activeNoteTab, setActiveNoteTab] = useState<
    "summary" | "rx" | "investigations" | "safety"
  >("summary");
  const [isPlayingSimulation, setIsPlayingSimulation] = useState<boolean>(false);
  const [activeDialogueIndex, setActiveDialogueIndex] = useState<number>(0);
  const [copiedState, setCopiedState] = useState<boolean>(false);

  // Vernacular Lab State
  const [activeVernacularIndex, setActiveVernacularIndex] = useState<number>(0);

  // Interactive ROI Calculator State
  const [patientsPerDay, setPatientsPerDay] = useState<number>(32);
  const [minsPerPatient, setMinsPerPatient] = useState<number>(10);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState<number>(5.5);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const currentScenario = useMemo(
    () =>
      CLINICAL_SCENARIOS.find((s) => s.id === activeScenarioId) ?? CLINICAL_SCENARIOS[0],
    [activeScenarioId],
  );

  // Dynamic ROI Calculations
  const roiMetrics = useMemo(() => {
    const timeSavedPerPatientMins = Math.max(0, minsPerPatient - 1.4);
    const weeklyHoursSaved =
      (patientsPerDay * timeSavedPerPatientMins * workingDaysPerWeek) / 60;
    const monthlyHoursSaved = weeklyHoursSaved * 4.2;
    const annualHoursSaved = weeklyHoursSaved * 50;

    return {
      weeklyHours: weeklyHoursSaved.toFixed(1),
      monthlyHours: monthlyHoursSaved.toFixed(0),
      annualHours: annualHoursSaved.toFixed(0),
      burnoutReductionPct: Math.min(94, Math.round(65 + minsPerPatient * 1.8)),
    };
  }, [patientsPerDay, minsPerPatient, workingDaysPerWeek]);

  // Simulation playback loop
  useEffect(() => {
    if (!isPlayingSimulation) return;
    const timer = setInterval(() => {
      setActiveDialogueIndex((prev) => {
        if (prev >= currentScenario.dialogue.length - 1) {
          setIsPlayingSimulation(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [isPlayingSimulation, currentScenario]);

  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    setActiveDialogueIndex(0);
    setIsPlayingSimulation(true);
  };

  const handleCopyNote = () => {
    const text = `PATIENT: ${currentScenario.patientInfo.name} (${currentScenario.patientInfo.ageGender})
VITALS: ${currentScenario.extractedNote.vitals}
CHIEF COMPLAINT: ${currentScenario.extractedNote.chiefComplaint}
ASSESSMENT: ${currentScenario.extractedNote.assessment}
ICD-10: ${currentScenario.extractedNote.icd10}
PRESCRIPTIONS:
${currentScenario.extractedNote.prescriptions.map((p) => `- ${p.drug} (${p.dosage}) | ${p.instructions} | ${p.duration}`).join("\n")}
INVESTIGATIONS: ${currentScenario.extractedNote.investigations.join(", ")}
ADVICE: ${currentScenario.extractedNote.advice.join("; ")}
RED FLAGS: ${currentScenario.extractedNote.redFlags.join("; ")}`;

    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2400);
  };

  // GSAP Animations and ScrollTriggers
  useEffect(() => {
    const root = pageRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Hero Entrance Stagger
      gsap.fromTo(
        "[data-hero-elem]",
        { autoAlpha: 0, y: 36 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
        },
      );

      // Hero Parallax ambient orbs
      gsap.to(".mv-hero__ambient--1", {
        x: 45,
        y: -35,
        scale: 1.12,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".mv-hero__ambient--2", {
        x: -40,
        y: 30,
        scale: 0.92,
        duration: 8.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Floating live badge
      gsap.to(".mv-hero-badge-float", {
        y: -12,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.3,
      });

      // Parallax Cards
      const parallaxCards = gsap.utils.toArray<HTMLElement>("[data-parallax-depth]");
      parallaxCards.forEach((card) => {
        const depth = parseFloat(card.getAttribute("data-parallax-depth") || "1");
        gsap.to(card, {
          y: -35 * depth,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      });

      // Generic Scroll Reveals
      const scrollElements = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      scrollElements.forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          },
        );
      });

      // Refresh triggers to ensure correct scroll bounds
      ScrollTrigger.refresh();
    }, root);

    return () => ctx.revert();
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="mv-landing-root" ref={pageRef}>
      {/* ------------------------------------------------------------- */}
      {/* ROUNDED FLOATING GLASS HEADER NAVBAR WITH BUBBLY BOUNCE       */}
      {/* ------------------------------------------------------------- */}
      <header
        className={`mv-navbar-wrapper ${isScrolled ? "mv-navbar-wrapper--scrolled" : ""}`}
      >
        <nav className="mv-navbar" aria-label="Main Navigation">
          <Link className="mv-brand" to="/landing" aria-label="MediVaani Home">
            <BrandMark size={30} className="mv-brand__icon" />
            <span className="mv-brand__text">
              MediVaani<b>AI</b>
            </span>
            <span className="mv-brand__status-tag">
              <span className="mv-status-dot" />
              Ambient Scribe Live
            </span>
          </Link>

          <div className="mv-navbar__links">
            <a href="#simulator">Simulator</a>
            <a href="#vernacular">Indian Languages</a>
            <a href="#voice-agents">Voice Agents</a>
            <a href="#whatsapp">WhatsApp</a>
            <a href="#security">DPDP Privacy</a>
            <a href="#faq">FAQ</a>
            <Link to="/contact">Contact Us</Link>
          </div>

          <div className="mv-navbar__actions">
            <Link className="mv-btn mv-btn--ghost mv-hide-mobile" to="/login">
              Doctor Sign In
            </Link>
            <Link className="mv-btn mv-btn--emerald" to="/login">
              <span className="mv-cta-text--desktop">Start Free Workspace</span>
              <span className="mv-cta-text--mobile">Start Free</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </nav>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION                                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-hero-section">
        <div className="mv-hero__ambient mv-hero__ambient--1" aria-hidden />
        <div className="mv-hero__ambient mv-hero__ambient--2" aria-hidden />
        <div className="mv-hero__grid-overlay" aria-hidden />

        <div className="mv-hero-container">
          <div className="mv-hero-content">
            <div className="mv-pill-badge" data-hero-elem>
              <HeartPulse size={14} className="mv-text-amber" />
              <span>
                Ambient AI Clinical Documentation for Indian &amp; Global Healthcare
              </span>
            </div>

            <h1 className="mv-hero-title" data-hero-elem>
              More Eye Contact.
              <br />
              <span className="mv-gradient-text">Zero Take-Home Charting.</span>
            </h1>

            <p className="mv-hero-desc" data-hero-elem>
              MediVaani listens naturally during patient consultations, detects Indian
              languages &amp; accents, and instantly extracts structured, ICD-10 coded
              clinical SOAP notes into your EMR. Reclaim 2.5 hours every day.
            </p>

            <div className="mv-hero-actions" data-hero-elem>
              <Link className="mv-btn mv-btn--primary-hero" to="/login">
                <Mic size={18} />
                <span>Launch Clinical Workspace</span>
                <ArrowRight size={16} />
              </Link>
              <a className="mv-btn mv-btn--outline-hero" href="#simulator">
                <Play size={16} className="mv-text-amber" />
                <span>Try Live Scribe Simulator</span>
              </a>
            </div>

            <div className="mv-hero-trust-bar" data-hero-elem>
              <div className="mv-trust-item">
                <ShieldCheck size={16} className="mv-text-emerald" />
                <span>DPDP Act 2023 Aligned</span>
              </div>
              <div className="mv-trust-divider" />
              <div className="mv-trust-item">
                <Languages size={16} className="mv-text-emerald" />
                <span>Indian Language &amp; Dialect Detection</span>
              </div>
              <div className="mv-trust-divider" />
              <div className="mv-trust-item">
                <UserCheck size={16} className="mv-text-emerald" />
                <span>Zero Patient Data Model Training</span>
              </div>
            </div>
          </div>

          {/* Floating UI Hero Showcase Mockup */}
          <div className="mv-hero-showcase" data-parallax-depth="0.7">
            <div className="mv-hero-mockup-card">
              <div className="mv-mockup-topbar">
                <div className="mv-mockup-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mv-mockup-title">
                  <Activity size={12} className="mv-text-emerald" />
                  <span>CONSULTATION IN PROGRESS · AMBIENT CAPTURE</span>
                </div>
                <div className="mv-mockup-live-tag">
                  <span className="mv-pulse-ring" />
                  <span>Acoustic Filter Active</span>
                </div>
              </div>

              <div className="mv-mockup-body">
                <div className="mv-mockup-patient-strip">
                  <div>
                    <strong>Ramesh Verma</strong>
                    <small>58 Y / M · Cardiology OPD</small>
                  </div>
                  <div className="mv-mockup-vitals-chip">
                    <span>BP: 154/94</span>
                    <span>HR: 88</span>
                    <span>SpO2: 98%</span>
                  </div>
                </div>

                <div className="mv-mockup-waveform">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <span
                      key={i}
                      className="mv-wave-bar"
                      style={{
                        animationDelay: `${(i % 8) * 0.12}s`,
                        height: `${20 + ((i * 17) % 45)}px`,
                      }}
                    />
                  ))}
                </div>

                <div className="mv-mockup-stream-snippet">
                  <div className="mv-stream-speaker mv-stream-speaker--doc">
                    <span className="mv-speaker-tag">Dr. Nair:</span>
                    <span>
                      "Does the pain radiate to your left shoulder or jaw when climbing
                      stairs?"
                    </span>
                  </div>
                  <div className="mv-stream-speaker mv-stream-speaker--pat">
                    <span className="mv-speaker-tag">Patient:</span>
                    <span>
                      "Yes doctor, it travels towards my left arm and eases when I rest
                      for 5 minutes."
                    </span>
                  </div>
                </div>

                <div className="mv-mockup-note-preview">
                  <div className="mv-note-preview-header">
                    <Sparkles size={13} className="mv-text-emerald" />
                    <span>Real-time Clinical Extraction</span>
                    <span className="mv-confidence-pill">99.4% Match</span>
                  </div>
                  <div className="mv-note-preview-text">
                    <strong>Assessment:</strong> Exertional Angina Pectoris (NYHA Class
                    II) · Stage 2 HTN (ICD-10 I20.9)
                    <br />
                    <strong>Rx:</strong> Tab. Telmisartan 40mg (1-0-0), Tab. Atorvastatin
                    20mg (0-0-1), Tab. Sorbitrate 5mg SOS
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Mini Badges */}
            <div
              className="mv-hero-badge-float mv-hero-badge-float--1"
              data-parallax-depth="1.2"
            >
              <Clock size={16} className="mv-text-emerald" />
              <div>
                <b>2.5 Hours</b>
                <small>Saved daily per doctor</small>
              </div>
            </div>

            <div
              className="mv-hero-badge-float mv-hero-badge-float--2"
              data-parallax-depth="1.5"
            >
              <Zap size={16} className="mv-text-amber" />
              <div>
                <b>&lt; 3.0s Note Prep</b>
                <small>Instant structured draft</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* LIVE SIMULATION (MIRRORING CONSULTATIONS WORKBENCH)           */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-simulator-section" id="simulator" data-reveal>
        <div className="mv-section-header">
          <div className="mv-section-tag">
            <Cpu size={14} />
            <span>INTERACTIVE CONSULTATION WORKBENCH</span>
          </div>
          <h2>Experience Ambient Medical Intelligence</h2>
          <p>
            Select a clinical scenario below. Watch natural doctor-patient dialogue
            transcribe live in the transcript panel and structure simultaneously into the
            clinical note.
          </p>
        </div>

        {/* Specialty Scenario Selector Tabs */}
        <div className="mv-scenario-pills">
          {CLINICAL_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`mv-scenario-pill ${activeScenarioId === s.id ? "mv-scenario-pill--active" : ""}`}
              onClick={() => handleSelectScenario(s.id)}
            >
              <span className="mv-scenario-pill__icon">{s.icon}</span>
              <span className="mv-scenario-pill__name">{s.specialty}</span>
              <span className="mv-scenario-pill__badge">{s.badge}</span>
            </button>
          ))}
        </div>

        {/* Dual Workbench: Mirroring App's Consultation Layout */}
        <div className="mv-workbench-grid">
          {/* Left Column: Live Audio Stream & Diarized Transcript Panel */}
          <div className="mv-workbench-col mv-workbench-col--left">
            <div className="mv-col-header">
              <div className="mv-col-title">
                <Radio size={15} className="mv-text-emerald" />
                <span>Live Diarized Transcript Panel</span>
              </div>
              <div className="mv-player-controls">
                <button
                  type="button"
                  className="mv-btn-sim-play"
                  onClick={() => setIsPlayingSimulation(!isPlayingSimulation)}
                >
                  {isPlayingSimulation ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlayingSimulation ? "Pause" : "Play Dialogue"}</span>
                </button>
                <button
                  type="button"
                  className="mv-btn-sim-reset"
                  onClick={() => setActiveDialogueIndex(0)}
                  title="Reset Dialogue"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            <div className="mv-patient-banner">
              <div className="mv-patient-banner__info">
                <strong>{currentScenario.patientInfo.name}</strong>
                <span>{currentScenario.patientInfo.ageGender}</span>
              </div>
              <div className="mv-patient-banner__vitals">
                <Activity size={13} className="mv-text-emerald" />
                <span>{currentScenario.patientInfo.vitals}</span>
              </div>
            </div>

            <div className="mv-dialogue-stream">
              {currentScenario.dialogue
                .slice(0, activeDialogueIndex + 1)
                .map((turn, i) => (
                  <div
                    key={i}
                    className={`mv-dialogue-bubble mv-dialogue-bubble--${turn.speaker} ${
                      i === activeDialogueIndex ? "mv-dialogue-bubble--active" : ""
                    }`}
                  >
                    <div className="mv-bubble-meta">
                      <span className="mv-bubble-speaker">
                        {turn.speaker === "doctor" ? "👨‍⚕️ Clinician" : "👤 Patient"}
                      </span>
                      <span className="mv-bubble-time">{`00:${(i * 6 + 4).toString().padStart(2, "0")}`}</span>
                    </div>
                    <p className="mv-bubble-text">{turn.text}</p>
                  </div>
                ))}

              {activeDialogueIndex < currentScenario.dialogue.length - 1 && (
                <button
                  type="button"
                  className="mv-btn-next-turn"
                  onClick={() => setActiveDialogueIndex((prev) => prev + 1)}
                >
                  <span>
                    Next Speaker Turn ({activeDialogueIndex + 1}/
                    {currentScenario.dialogue.length})
                  </span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Structured Clinical Note */}
          <div className="mv-workbench-col mv-workbench-col--right">
            <div className="mv-col-header">
              <div className="mv-col-title">
                <BrainCircuit size={15} className="mv-text-amber" />
                <span>Structured Note Panel</span>
              </div>
              <div className="mv-note-meta-actions">
                <span className="mv-confidence-tag">
                  <CheckCircle2 size={12} /> {currentScenario.extractedNote.confidence}%
                  Confidence
                </span>
                <button
                  type="button"
                  className="mv-btn-copy-note"
                  onClick={handleCopyNote}
                >
                  {copiedState ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedState ? "Copied!" : "Copy Note"}</span>
                </button>
              </div>
            </div>

            {/* Note Sub-Tabs */}
            <div className="mv-note-tabs">
              <button
                type="button"
                className={`mv-note-tab ${activeNoteTab === "summary" ? "mv-note-tab--active" : ""}`}
                onClick={() => setActiveNoteTab("summary")}
              >
                <FileText size={13} /> SOAP Note
              </button>
              <button
                type="button"
                className={`mv-note-tab ${activeNoteTab === "rx" ? "mv-note-tab--active" : ""}`}
                onClick={() => setActiveNoteTab("rx")}
              >
                <Pill size={13} /> Prescriptions (
                {currentScenario.extractedNote.prescriptions.length})
              </button>
              <button
                type="button"
                className={`mv-note-tab ${activeNoteTab === "investigations" ? "mv-note-tab--active" : ""}`}
                onClick={() => setActiveNoteTab("investigations")}
              >
                <Stethoscope size={13} /> Labs &amp; Orders
              </button>
              <button
                type="button"
                className={`mv-note-tab ${activeNoteTab === "safety" ? "mv-note-tab--active" : ""}`}
                onClick={() => setActiveNoteTab("safety")}
              >
                <ShieldAlert size={13} /> Safety &amp; Red Flags
              </button>
            </div>

            <div className="mv-note-content-body">
              {activeNoteTab === "summary" && (
                <div className="mv-soap-sections">
                  <div className="mv-soap-card">
                    <span className="mv-soap-label">SUBJECTIVE / CHIEF COMPLAINT</span>
                    <p className="mv-soap-text">
                      {currentScenario.extractedNote.chiefComplaint}
                    </p>
                    <p className="mv-soap-subtext">
                      {currentScenario.extractedNote.historyOfPresentIllness}
                    </p>
                  </div>

                  <div className="mv-soap-card">
                    <span className="mv-soap-label">OBJECTIVE / VITALS &amp; EXAM</span>
                    <p className="mv-soap-text">{currentScenario.extractedNote.vitals}</p>
                  </div>

                  <div className="mv-soap-card">
                    <div className="mv-soap-label-row">
                      <span className="mv-soap-label">
                        ASSESSMENT &amp; ICD-10 MAPPING
                      </span>
                      <span className="mv-icd-pill">
                        {currentScenario.extractedNote.icd10}
                      </span>
                    </div>
                    <p className="mv-soap-text" style={{ whiteSpace: "pre-line" }}>
                      {currentScenario.extractedNote.assessment}
                    </p>
                  </div>
                </div>
              )}

              {activeNoteTab === "rx" && (
                <div className="mv-rx-list">
                  {currentScenario.extractedNote.prescriptions.map((rx, idx) => (
                    <div key={idx} className="mv-rx-card">
                      <div className="mv-rx-card__top">
                        <span className="mv-rx-name">{rx.drug}</span>
                        <span className="mv-rx-dose">{rx.dosage}</span>
                        <span className="mv-rx-duration">{rx.duration}</span>
                      </div>
                      <div className="mv-rx-card__instr">
                        <Clock size={12} className="mv-text-amber" />
                        <span>{rx.instructions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeNoteTab === "investigations" && (
                <div className="mv-orders-container">
                  <div className="mv-order-block">
                    <h4>Diagnostic Investigations &amp; Panels</h4>
                    <ul className="mv-order-list">
                      {currentScenario.extractedNote.investigations.map((inv, idx) => (
                        <li key={idx}>
                          <CheckCircle2 size={14} className="mv-text-emerald" />
                          <span>{inv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mv-order-block">
                    <h4>Clinical Lifestyle &amp; Follow-up Advice</h4>
                    <ul className="mv-order-list">
                      {currentScenario.extractedNote.advice.map((adv, idx) => (
                        <li key={idx}>
                          <HeartPulse size={14} className="mv-text-amber" />
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeNoteTab === "safety" && (
                <div className="mv-safety-container">
                  <div className="mv-alert-card mv-alert-card--danger">
                    <div className="mv-alert-header">
                      <ShieldAlert size={16} />
                      <strong>Critical Warning Signs &amp; Emergency Escalation</strong>
                    </div>
                    <ul className="mv-alert-list">
                      {currentScenario.extractedNote.redFlags.map((flag, idx) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mv-alert-card mv-alert-card--info">
                    <div className="mv-alert-header">
                      <ShieldCheck size={16} />
                      <strong>Clinician Oversight &amp; Signature Policy</strong>
                    </div>
                    <p>
                      MediVaani prepares structured recommendations. Under NMC and DPDP
                      clinical guidelines, all prescriptions and orders must be verified
                      and signed by the licensed attending physician.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* INDIAN LANGUAGES DETECTION & VERNACULAR LAB                   */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-vernacular-section" id="vernacular" data-reveal>
        <div className="mv-section-header">
          <div className="mv-section-tag">
            <Globe size={14} />
            <span>INDIAN LANGUAGE DETECTION &amp; SCRIBING</span>
          </div>
          <h2>Engineered for Multilingual Indian OPD Consultations</h2>
          <p>
            Indian OPD consultations seamlessly blend languages (Hindi, Hinglish, Tamil,
            Telugu, Kannada, Malayalam, Bengali, Marathi). MediVaani detects regional
            dialects and normalizes colloquial symptom descriptions into clean clinical
            terms.
          </p>
        </div>

        <div className="mv-vernacular-grid">
          <div className="mv-vernacular-tabs">
            {VERNACULAR_EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                className={`mv-vernacular-btn ${activeVernacularIndex === idx ? "mv-vernacular-btn--active" : ""}`}
                onClick={() => setActiveVernacularIndex(idx)}
              >
                <span className="mv-vernacular-flag">{ex.flag}</span>
                <span className="mv-vernacular-title">{ex.lang}</span>
              </button>
            ))}
          </div>

          <div className="mv-vernacular-card">
            <div className="mv-vernacular-card__col">
              <div className="mv-vernacular-badge mv-vernacular-badge--raw">
                <Volume2 size={13} />
                <span>SPOKEN REGIONAL CONSULTATION</span>
              </div>
              <p className="mv-raw-text">
                "{VERNACULAR_EXAMPLES[activeVernacularIndex].rawAudio}"
              </p>
            </div>

            <div className="mv-vernacular-arrow">
              <Sparkles size={20} className="mv-text-amber" />
              <span>Acoustic Normalization</span>
            </div>

            <div className="mv-vernacular-card__col mv-vernacular-card__col--extracted">
              <div className="mv-vernacular-badge mv-vernacular-badge--extracted">
                <BadgeCheck size={13} />
                <span>STANDARDIZED CLINICAL RECORD</span>
              </div>
              <p className="mv-extracted-text">
                "{VERNACULAR_EXAMPLES[activeVernacularIndex].extracted}"
              </p>
              <div className="mv-extracted-tags">
                {VERNACULAR_EXAMPLES[activeVernacularIndex].tags.map((tag, i) => (
                  <span key={i} className="mv-tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CLINICAL VOICE AGENTS FOR APPOINTMENT BOOKING                 */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-voice-agents-section" id="voice-agents" data-reveal>
        <div className="mv-section-header">
          <div className="mv-section-tag">
            <PhoneCall size={14} />
            <span>AUTONOMOUS CLINIC VOICE AGENTS</span>
          </div>
          <h2>24/7 AI Voice Agents for Doctor Appointment Booking</h2>
          <p>
            Never miss a patient call. MediVaani's intelligent voice agents answer
            incoming calls around the clock, book and reschedule OPD appointments, answer
            general clinic questions, and drastically cut patient no-shows.
          </p>
        </div>

        <div className="mv-agents-grid">
          <div className="mv-agent-feature-card">
            <div className="mv-agent-icon-wrap">
              <PhoneForwarded size={22} className="mv-text-emerald" />
            </div>
            <h3>24/7 Inbound Call Reception</h3>
            <p>
              Handles simultaneous patient phone calls with natural, polite human-like
              speech in English, Hindi, and regional Indian languages.
            </p>
          </div>

          <div className="mv-agent-feature-card">
            <div className="mv-agent-icon-wrap">
              <CalendarCheck size={22} className="mv-text-emerald" />
            </div>
            <h3>Smart Slot Booking &amp; Rescheduling</h3>
            <p>
              Directly checks doctor availability in real-time, books slots, sends instant
              confirmations, and manages cancellations.
            </p>
          </div>

          <div className="mv-agent-feature-card">
            <div className="mv-agent-icon-wrap">
              <Users size={22} className="mv-text-emerald" />
            </div>
            <h3>68% Reduction in Patient No-Shows</h3>
            <p>
              Automated proactive reminder phone calls confirm attendance 24 hours in
              advance, freeing up empty OPD slots for waiting patients.
            </p>
          </div>

          <div className="mv-agent-feature-card">
            <div className="mv-agent-icon-wrap">
              <Clock size={22} className="mv-text-emerald" />
            </div>
            <h3>Save 15+ Staff Hours Weekly</h3>
            <p>
              Eliminate phone queues and administrative bottlenecks. Your front desk staff
              can focus entirely on in-person patient care.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* WHATSAPP CLINIC INTEGRATION                                   */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-whatsapp-section" id="whatsapp" data-reveal>
        <div className="mv-section-header">
          <div className="mv-section-tag">
            <MessageSquare size={14} />
            <span>SEAMLESS PATIENT ENGAGEMENT</span>
          </div>
          <h2>Instant WhatsApp Clinic Automation</h2>
          <p>
            Deliver digital prescriptions, appointment confirmations, lab instructions,
            and follow-up reminders directly to the patient's WhatsApp immediately after
            consultation sign-off.
          </p>
        </div>

        <div className="mv-whatsapp-showcase">
          <div className="mv-whatsapp-card">
            <div className="mv-wa-chat-header">
              <div className="mv-wa-chat-avatar">
                <Stethoscope size={18} />
              </div>
              <div className="mv-wa-chat-doctor">
                <strong>City Heart &amp; Health Clinic</strong>
                <small>Official Verified WhatsApp · Powered by MediVaani</small>
              </div>
            </div>

            <div className="mv-wa-chat-body">
              <div className="mv-wa-bubble">
                <p>
                  <strong>Namaste Ramesh ji,</strong>
                  <br />
                  Here is your finalized digital prescription from{" "}
                  <strong>Dr. Nair (Cardiology)</strong>.
                </p>
                <div className="mv-wa-rx-attachment">
                  <FileCheck2 size={24} className="mv-text-emerald" />
                  <div>
                    <b>Prescription_RameshVerma_Cardio.pdf</b>
                    <small>Signed &amp; QR Verified · 142 KB</small>
                  </div>
                </div>
                <span className="mv-wa-time">11:45 AM · Read</span>
              </div>

              <div className="mv-wa-bubble">
                <p>
                  📅 <strong>Follow-up Scheduled:</strong> 15 Days (2D ECHO &amp; Lipid
                  Profile Review).
                  <br />
                  Reply <em>"RESCHEDULE"</em> anytime to modify your slot.
                </p>
                <span className="mv-wa-time">11:45 AM · Read</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* HOW IT WORKS: 4-STAGE PIPELINE                                */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-workflow-section" id="workflow" data-reveal>
        <div className="mv-section-header">
          <div className="mv-section-tag">
            <Layers size={14} />
            <span>HOW MEDIVAANI OPERATES</span>
          </div>
          <h2>Zero Friction. Built for High-Volume OPD Practices.</h2>
          <p>
            From the moment you start the consultation to the final signed prescription in
            your EMR, MediVaani runs silently in the background.
          </p>
        </div>

        <div className="mv-steps-grid">
          <div className="mv-step-card">
            <div className="mv-step-num">01</div>
            <div className="mv-step-icon">
              <Mic size={22} />
            </div>
            <h3>Ambient Room Capture</h3>
            <p>
              Open MediVaani on any phone, tablet, or desktop. Speak naturally with the
              patient without looking at a screen.
            </p>
          </div>

          <div className="mv-step-card">
            <div className="mv-step-num">02</div>
            <div className="mv-step-icon">
              <Headphones size={22} />
            </div>
            <h3>Acoustic Diarization</h3>
            <p>
              Advanced neural speech isolation separates doctor and patient voices while
              filtering clinical background noise.
            </p>
          </div>

          <div className="mv-step-card">
            <div className="mv-step-num">03</div>
            <div className="mv-step-icon">
              <WandSparkles size={22} />
            </div>
            <h3>Clinical Note Extraction</h3>
            <p>
              Extracts chief complaints, vitals, dosages, ICD-10 suggestions, and
              lifestyle advice in under 3 seconds.
            </p>
          </div>

          <div className="mv-step-card">
            <div className="mv-step-num">04</div>
            <div className="mv-step-icon">
              <FileCheck2 size={22} />
            </div>
            <h3>Doctor Review &amp; Sign-off</h3>
            <p>
              Review the structured draft, make quick inline edits with automatic version
              history, and sign off into your EMR.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* ROI & TIME SAVINGS CALCULATOR                                 */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-roi-section" id="roi" data-reveal>
        <div className="mv-section-header">
          <div className="mv-section-tag">
            <Calculator size={14} />
            <span>CALCULATE YOUR PRACTICE VALUE</span>
          </div>
          <h2>Reclaim 2+ Hours of Free Time Every Single Day</h2>
          <p>
            Adjust your daily patient load and charting habits to see the exact time you
            will reclaim with MediVaani AI.
          </p>
        </div>

        <div className="mv-roi-container">
          <div className="mv-roi-controls">
            <div className="mv-slider-group">
              <div className="mv-slider-label">
                <span>Patients Seen Daily</span>
                <strong>{patientsPerDay} Patients</strong>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={patientsPerDay}
                onChange={(e) => setPatientsPerDay(parseInt(e.target.value, 10))}
                className="mv-range-slider"
              />
              <div className="mv-slider-bounds">
                <span>10</span>
                <span>45</span>
                <span>80+</span>
              </div>
            </div>

            <div className="mv-slider-group">
              <div className="mv-slider-label">
                <span>Manual Charting Time Per Patient</span>
                <strong>{minsPerPatient} Minutes</strong>
              </div>
              <input
                type="range"
                min="4"
                max="20"
                value={minsPerPatient}
                onChange={(e) => setMinsPerPatient(parseInt(e.target.value, 10))}
                className="mv-range-slider"
              />
              <div className="mv-slider-bounds">
                <span>4 min</span>
                <span>10 min</span>
                <span>20 min</span>
              </div>
            </div>

            <div className="mv-slider-group">
              <div className="mv-slider-label">
                <span>Clinical Days Per Week</span>
                <strong>{workingDaysPerWeek} Days</strong>
              </div>
              <input
                type="range"
                min="4"
                max="7"
                step="0.5"
                value={workingDaysPerWeek}
                onChange={(e) => setWorkingDaysPerWeek(parseFloat(e.target.value))}
                className="mv-range-slider"
              />
              <div className="mv-slider-bounds">
                <span>4 days</span>
                <span>5.5 days</span>
                <span>7 days</span>
              </div>
            </div>
          </div>

          <div className="mv-roi-results">
            <div className="mv-roi-card mv-roi-card--highlight">
              <span className="mv-roi-metric-label">WEEKLY CLINICAL HOURS SAVED</span>
              <div className="mv-roi-metric-val">
                {roiMetrics.weeklyHours} <span>Hours / Wk</span>
              </div>
              <p>Equivalent to getting an entire full day back every week.</p>
            </div>

            <div className="mv-roi-subgrid">
              <div className="mv-roi-card">
                <span className="mv-roi-metric-label">ANNUAL TIME RECLAIMED</span>
                <div className="mv-roi-metric-val mv-roi-metric-val--sm">
                  {roiMetrics.annualHours} <span>Hrs</span>
                </div>
                <small>No more midnight documentation</small>
              </div>

              <div className="mv-roi-card">
                <span className="mv-roi-metric-label">BURNOUT REDUCTION</span>
                <div className="mv-roi-metric-val mv-roi-metric-val--sm mv-text-emerald">
                  {roiMetrics.burnoutReductionPct}%
                </div>
                <small>Higher clinician satisfaction</small>
              </div>
            </div>

            <Link className="mv-btn mv-btn--emerald mv-btn--block" to="/login">
              <span>Start Saving Time Today</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* DPDP ACT 2023 & DATA PRIVACY                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-security-section" id="security" data-reveal>
        <div className="mv-section-header">
          <div className="mv-section-tag">
            <Shield size={14} />
            <span>INDIAN DPDP ACT 2023 COMPLIANCE</span>
          </div>
          <h2>Engineered with Strict Clinical Data Privacy</h2>
          <p>
            Patient trust is paramount. MediVaani is aligned with India's Digital Personal
            Data Protection (DPDP) Act 2023 and modern data security standards.
          </p>
        </div>

        <div className="mv-security-grid">
          <div className="mv-security-card">
            <div className="mv-sec-icon">
              <Lock size={22} className="mv-text-emerald" />
            </div>
            <h3>Zero Model Training on Patient Data</h3>
            <p>
              Your clinical dialogues and patient notes are NEVER used to train
              generalized foundation models. Your clinic data remains strictly yours.
            </p>
          </div>

          <div className="mv-security-card">
            <div className="mv-sec-icon">
              <Server size={22} className="mv-text-emerald" />
            </div>
            <h3>In-Country Data Residency</h3>
            <p>
              All processing happens on sovereign in-country cloud data centers with
              AES-256 encryption at rest and TLS 1.3 in transit.
            </p>
          </div>

          <div className="mv-security-card">
            <div className="mv-sec-icon">
              <Scale size={22} className="mv-text-emerald" />
            </div>
            <h3>DPDP 2023 Explicit Consent</h3>
            <p>
              One-tap digital consent logging built right into the patient intake flow.
              Fully audit-logged and cryptographically timestamped.
            </p>
          </div>

          <div className="mv-security-card">
            <div className="mv-sec-icon">
              <QrCode size={22} className="mv-text-emerald" />
            </div>
            <div className="mv-coming-soon-badge-row">
              <h3>ABDM Health ID Integration</h3>
              <span className="mv-badge-coming-soon">Coming Soon</span>
            </div>
            <p>
              Upcoming interoperability with Ayushman Bharat Digital Mission (ABDM) Health
              ID, FHIR clinical bundles, and standardized health records.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FREQUENTLY ASKED QUESTIONS                                    */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-faq-section" id="faq" data-reveal>
        <div className="mv-section-header">
          <div className="mv-section-tag">
            <FileSpreadsheet size={14} />
            <span>FREQUENT QUESTIONS</span>
          </div>
          <h2>Frequently Asked Questions</h2>
          <p>
            Everything you need to know about getting started with MediVaani AI in your
            practice.
          </p>
        </div>

        <div className="mv-faq-accordion">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`mv-faq-item ${isOpen ? "mv-faq-item--open" : ""}`}
              >
                <button
                  type="button"
                  className="mv-faq-trigger"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="mv-faq-chevron" />
                </button>
                {isOpen && (
                  <div className="mv-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CONTACT & CLINICAL ASSISTANCE SECTION                         */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-contact-section" id="contact" data-reveal>
        <div className="mv-section-header">
          <div className="mv-section-tag">
            <Headphones size={14} />
            <span>CONTACT &amp; CLINICAL SUPPORT</span>
          </div>
          <h2>We Are Here to Assist Your Practice</h2>
          <p>
            Have questions about clinic deployment, technical integration, or voice
            agents? Reach out directly to our engineering and clinical integration team.
          </p>
        </div>

        <div className="mv-contact-container">
          <div className="mv-contact-card-main">
            <div className="mv-contact-mail-orb">
              <Mail size={28} />
            </div>
            <h3>Email Our Lead Clinical Team Directly</h3>
            <p className="mv-contact-email-val">revanth.sharma5198@gmail.com</p>
            <p className="mv-contact-sub">
              Available 24/7 for doctor onboarding, technical inquiries, and ABDM/EMR
              custom integration support.
            </p>

            <div className="mv-contact-actions">
              <a
                href="mailto:revanth.sharma5198@gmail.com?subject=MediVaani%20Inquiry"
                className="mv-btn mv-btn--primary-hero"
              >
                <Mail size={16} />
                <span>Send Email to Team</span>
                <ArrowRight size={15} />
              </a>
              <Link to="/contact" className="mv-btn mv-btn--outline-hero">
                <MessageSquare size={16} />
                <span>Open Contact &amp; Support Page</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM MEGA CALL-TO-ACTION                                    */}
      {/* ------------------------------------------------------------- */}
      <section className="mv-bottom-cta-section" data-reveal>
        <div className="mv-cta-ambient" aria-hidden />
        <div className="mv-cta-card">
          <div className="mv-pill-badge mv-pill-badge--dark">
            <Sparkles size={14} className="mv-text-amber" />
            <span>Empowering Modern Clinicians</span>
          </div>

          <h2>Start Your Free MediVaani Workspace</h2>
          <p>
            Experience ambient AI documentation on your next patient. Setup takes less
            than 60 seconds with no credit card required.
          </p>

          <div className="mv-cta-buttons">
            <Link className="mv-btn mv-btn--primary-hero" to="/login">
              <Mic size={18} />
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </Link>
            <Link className="mv-btn mv-btn--outline-hero" to="/login">
              <span>Doctor Sign In</span>
            </Link>
          </div>

          <div className="mv-cta-foot-note">
            <span>
              ✨ No specialized hardware required · Works on iOS, Android, macOS &amp;
              Windows
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER                                                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="mv-footer">
        <div className="mv-footer-container">
          <div className="mv-footer-brand">
            <div className="mv-brand">
              <BrandMark size={30} className="mv-brand__icon" />
              <span className="mv-brand__text">
                MediVaani<b>AI</b>
              </span>
            </div>
            <p>
              Ambient AI clinical intelligence for modern doctors. Powered by advanced
              multilingual acoustic speech recognition and clinical structuring.
            </p>
          </div>

          <div className="mv-footer-links">
            <div className="mv-footer-col">
              <h4>Product</h4>
              <a href="#simulator">Live Scribe Simulator</a>
              <a href="#vernacular">Indian Languages</a>
              <a href="#voice-agents">Voice Agents</a>
              <a href="#whatsapp">WhatsApp Integration</a>
            </div>

            <div className="mv-footer-col">
              <h4>Security &amp; Compliance</h4>
              <a href="#security">DPDP Act 2023</a>
              <a href="#security">Zero Patient Data Retention</a>
              <a href="#security">Data Localization</a>
              <a href="#security">ABDM Architecture (Coming Soon)</a>
            </div>

            <div className="mv-footer-col">
              <h4>Support &amp; Contact</h4>
              <Link to="/contact">Contact Support Desk</Link>
              <a href="mailto:revanth.sharma5198@gmail.com">
                revanth.sharma5198@gmail.com
              </a>
              <Link to="/login">Doctor Sign In</Link>
              <a href="#faq">Support FAQ</a>
            </div>
          </div>
        </div>

        <div className="mv-footer-bottom">
          <p>
            © {new Date().getFullYear()} MediVaani AI. Built for clinicians with precision
            and care.
          </p>
          <div className="mv-footer-badges">
            <span>DPDP 2023 Aligned</span>
            <span>Data Encryption Active</span>
            <span>ABDM Ready (Coming Soon)</span>
          </div>
        </div>
      </footer>

      {/* Mobile-Only Sticky Floating Bottom Bar */}
      <nav className="mv-mobile-bottom-bar" aria-label="Mobile Quick Actions">
        <Link className="mv-btn mv-btn--ghost-mobile" to="/login">
          Doctor Sign In
        </Link>
        <Link className="mv-btn mv-btn--emerald-mobile" to="/login">
          <Mic size={15} />
          <span>Start Consultation</span>
          <ArrowRight size={14} />
        </Link>
      </nav>
    </main>
  );
}
