export interface ClientProfile {
  id: string;
  name: string;
  birthDate?: string;
  gender?: "남" | "여";
  relationNotes?: string; // Relationship or general characteristics
  defaultTemperature?: string; // e.g. "36.5"
}

export interface SectionState {
  presets: string[];
  memo: string;
  temperature?: string; // Only for health category
  checkInTime?: string; // Only for checkInOut category
  checkOutTime?: string; // Only for checkInOut category
  amProgram1?: string;   // Slot 1
  amProgram2?: string;   // Slot 2
  pmProgram1?: string;   // Slot 3
  pmProgram2?: string;   // Slot 4
}

export interface DailyReportSections {
  checkInOut: SectionState;
  hygiene: SectionState;
  meals: SectionState;
  health: SectionState;
  programs: SectionState;
  other: SectionState;
}

export interface DailyReport {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  sections: DailyReportSections;
  generatedText: string;
  createdAt: string;
}

export interface PresetItem {
  id: string;
  label: string;
  keywords: string[]; // Words/phrases to add to draft
}
