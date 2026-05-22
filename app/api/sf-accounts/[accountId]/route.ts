import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface SfUseCase {
  USE_CASE_ID: string;
  USE_CASE_NAME: string;
  USE_CASE_NUMBER: string;
  USE_CASE_STAGE: string | null;
  USE_CASE_EACV: number | null;
  USE_CASE_STATUS: string | null;
  USE_CASE_DESCRIPTION: string | null;
  NEXT_STEPS: string | null;
  DECISION_DATE: string | null;
  TECHNICAL_WIN: string | null;
  ACCOUNT_ID: string;
  ACCOUNT_NAME: string;
  DISTRICT_NAME: string | null;
  ACCOUNT_RVP: string | null;
  ACCOUNT_OWNER_NAME: string | null;
  ACCOUNT_LEAD_SE_NAME: string | null;
  USE_CASE_LEAD_SE_NAME: string | null;
  OWNER_NAME: string | null;
  IS_WON: boolean | null;
  IS_TECH_WON: boolean | null;
  DAYS_IN_STAGE: number | null;
  CREATED_DATE: string | null;
  LAST_MODIFIED_DATE: string | null;
  WORKLOADS: string | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const id = accountId.replace(/'/g, "''");
    const rows = await query<SfUseCase>(`
      SELECT
        d.USE_CASE_ID,
        d.USE_CASE_NAME,
        d.USE_CASE_NUMBER,
        d.USE_CASE_STAGE,
        d.USE_CASE_EACV,
        d.USE_CASE_STATUS,
        d.USE_CASE_DESCRIPTION,
        d.NEXT_STEPS,
        d.DECISION_DATE,
        d.TECHNICAL_WIN,
        d.ACCOUNT_ID,
        d.ACCOUNT_NAME,
        d.DISTRICT_NAME,
        d.ACCOUNT_RVP,
        d.ACCOUNT_OWNER_NAME,
        d.ACCOUNT_LEAD_SE_NAME,
        d.USE_CASE_LEAD_SE_NAME,
        d.OWNER_NAME,
        d.IS_WON,
        d.IS_TECH_WON,
        d.DAYS_IN_STAGE,
        d.CREATED_DATE,
        d.LAST_MODIFIED_DATE,
        d.WORKLOADS
      FROM MDM.MDM_INTERFACES.DIM_USE_CASE d
      WHERE d.REGION_NAME = 'HCLS' and d.THEATER_NAME = 'USMajors'
        AND d.ACCOUNT_ID = '${id}'
      ORDER BY d.USE_CASE_NAME
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching account use cases:", error);
    return NextResponse.json({ error: "Failed to fetch use cases" }, { status: 500 });
  }
}
