export interface User {
  ID: number;
  NAME: string;
  EMAIL: string | null;
  SNOWFLAKE_USER: string | null;
  CREATED_AT: string;
}

export interface Account {
  ID: number;
  NAME: string;
  INDUSTRY: string;
  ACCOUNT_TYPE: string | null;
  DESCRIPTION: string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export const ACCOUNT_TYPES = ["Payer", "Provider", "HealthTech", "Life Sciences"] as const;
export type AccountType = typeof ACCOUNT_TYPES[number];

export interface Event {
  ID: number;
  ACCOUNT_ID: number;
  USER_ID: number | null;
  USE_CASE_ID: number | null;
  TITLE: string;
  EVENT_TYPE: string;
  LOCATION_TYPE: string;
  EVENT_DATE: string;
  EVENT_TIME: string | null;
  ATTENDEES: string | null;
  OBJECTIVE: string | null;
  NOTES: string | null;
  CREATED_AT: string;
}

export interface UseCase {
  ID: number;
  ACCOUNT_ID: number;
  USE_CASE_ID: string | null;
  TITLE: string;
  PRIORITY: number | null;
  ESTIMATED_VALUE: number | null;
  STAGE: string | null;
  ACCOUNT_EXECUTIVE: string | null;
  SOLUTION_ENGINEER: string | null;
  OWNER_ID: number | null;
  DESCRIPTION: string | null;
  SALESFORCE_LINK: string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface UseCaseActivity {
  ID: number;
  USE_CASE_ID: number;
  USER_ID: number | null;
  ACTIVITY_TYPE: string | null;
  DESCRIPTION: string | null;
  CREATED_AT: string;
}

export interface AccountSummary extends Account {
  LAST_EVENT_DATE: string | null;
  USE_CASE_COUNT: number;
  TOTAL_VALUE: number | null;
}

export interface UseCaseWithDetails extends UseCase {
  ACCOUNT_NAME: string;
  OWNER_NAME: string | null;
  LATEST_ACTIVITY: string | null;
  LATEST_ACTIVITY_DATE: string | null;
}

export interface UserActivity {
  USER_ID: number;
  USER_NAME: string;
  ACCOUNT_ID: number;
  ACCOUNT_NAME: string;
  EVENT_ID: number | null;
  EVENT_TITLE: string | null;
  EVENT_DATE: string | null;
  EVENT_TYPE: string | null;
  USE_CASE_ID: number | null;
  USE_CASE_TITLE: string | null;
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

export interface ActionItem {
  ID: number;
  ACCOUNT_ID: number;
  EVENT_ID: number | null;
  USE_CASE_ID: number | null;
  DESCRIPTION: string;
  DUE_DATE: string | null;
  ASSIGNED_TO: string | null;
  OWNER_ID: number | null;
  OWNER_NAME: string | null;
  USE_CASE_TITLE: string | null;
  COMPLETED: boolean;
  COMPLETED_BY: string | null;
  COMPLETED_AT: string | null;
  CREATED_AT: string;
}
