export interface User {
  ID: number;
  NAME: string;
  EMAIL: string | null;
  SNOWFLAKE_USER: string | null;
}

export interface AfeUseCase {
  USE_CASE_ID: string;
  USE_CASE_NAME: string;
  USE_CASE_NUMBER: string;
  USE_CASE_STAGE: string | null;
  USE_CASE_EACV: number | null;
  ACCOUNT_NAME: string;
  DISTRICT_NAME: string | null;
  ACCOUNT_RVP: string | null;
  ACCOUNT_SE_VP: string | null;
  ACCOUNT_DM: string | null;
  ACCOUNT_OWNER_NAME: string | null;
  USE_CASE_LEAD_SE_NAME: string | null;
  SPECIALIST_COMMENTS: string | null;
  SE_COMMENTS: string | null;
  USE_CASE_STATUS: string | null;
  PSA_AFE_SUPPORT: string | null;
  WHO_HAS_BALL: string | null;
  AI_ENGAGEMENT_LEVEL: string | null;
  REPORTING_RANK: string | null;
  PRIMARY_USE_CASE: string | null;
  NOTES: string | null;
  APP_UPDATED_AT: string | null;
}

export interface PrimaryUseCaseOption {
  ID: number;
  OPTION_NAME: string;
  IS_ACTIVE: boolean;
  SORT_ORDER: number;
}

export const DISTRICT_MAP: Record<string, { label: string; dm: string }> = {
  LifeSciencesWest: { label: "LS West", dm: "Olga Teplitsky" },
  LifeSciencesEast: { label: "LS East", dm: "Joseph Klein" },
  HealthTech: { label: "Healthtech", dm: "Nick Pereira" },
  StrategicHCLS: { label: "Strategics", dm: "Nick Stefanow" },
  PayersProviders: { label: "PayPro", dm: "Gretchen Fowler" },
};

export const PSA_AFE_SUPPORT_OPTIONS = ["Full", "Partial", "Minimal"] as const;

export const WHO_HAS_BALL_OPTIONS = [
  "Andy Samant",
  "Chris Caudill",
  "Tom Meacham",
  "Account Team",
  "Joel Rydbeck",
] as const;

export const AI_ENGAGEMENT_LEVEL_OPTIONS = [
  "Level 0 - Not Engaged",
  "Level 1 - Exec Pitch",
  "Level 2 - Demo/Scope",
  "Level 3 - POC/Decision",
  "Level 4 - Production",
  "On Hold",
] as const;

export const REPORTING_RANK_OPTIONS = [
  "1 - High",
  "2 - Med",
  "3 - Low",
  "4 - No Show",
  "5 - Evaluating",
] as const;
