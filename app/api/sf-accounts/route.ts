import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface SfAccountSummary {
  ACCOUNT_ID: string;
  ACCOUNT_NAME: string;
  DISTRICT_NAME: string | null;
  ACCOUNT_RVP: string | null;
  ACCOUNT_OWNER_NAME: string | null;
  ACCOUNT_LEAD_SE_NAME: string | null;
  USE_CASE_COUNT: number;
  TOTAL_EACV: number;
}

export async function GET() {
  try {
    const rows = await query<SfAccountSummary>(`
      SELECT
        d.ACCOUNT_ID,
        d.ACCOUNT_NAME,
        d.DISTRICT_NAME,
        d.ACCOUNT_RVP,
        d.ACCOUNT_OWNER_NAME,
        d.ACCOUNT_LEAD_SE_NAME,
        COUNT(CASE WHEN REGEXP_LIKE(d.WORKLOADS, '(^|.*;)AI(;.*|$)')
          AND TRY_TO_NUMBER(LEFT(d.USE_CASE_STAGE, 1)) NOT IN (7, 8) THEN 1 END) AS USE_CASE_COUNT,
        COALESCE(SUM(d.USE_CASE_EACV), 0) AS TOTAL_EACV
      FROM MDM.MDM_INTERFACES.DIM_USE_CASE d
      WHERE d.REGION_NAME = 'HCLS' and d.THEATER_NAME = 'USMajors'
      GROUP BY
        d.ACCOUNT_ID,
        d.ACCOUNT_NAME,
        d.DISTRICT_NAME,
        d.ACCOUNT_RVP,
        d.ACCOUNT_OWNER_NAME,
        d.ACCOUNT_LEAD_SE_NAME
      ORDER BY d.ACCOUNT_NAME
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching SF accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}
