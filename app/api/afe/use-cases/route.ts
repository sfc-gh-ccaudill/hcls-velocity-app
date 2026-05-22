import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { AfeUseCase } from "@/lib/types";

export async function GET() {
  try {
    const rows = await query<AfeUseCase>(`
      SELECT
        d.USE_CASE_ID,
        d.USE_CASE_NAME,
        d.USE_CASE_NUMBER,
        d.USE_CASE_STAGE,
        d.USE_CASE_EACV,
        d.ACCOUNT_NAME,
        d.DISTRICT_NAME,
        d.ACCOUNT_RVP,
        d.ACCOUNT_SE_VP,
        d.ACCOUNT_DM,
        d.ACCOUNT_OWNER_NAME,
        d.USE_CASE_LEAD_SE_NAME,
        d.SPECIALIST_COMMENTS,
        d.SE_COMMENTS,
        d.USE_CASE_STATUS,
        a.PSA_AFE_SUPPORT,
        a.WHO_HAS_BALL,
        a.AI_ENGAGEMENT_LEVEL,
        a.REPORTING_RANK,
        a.PRIMARY_USE_CASE,
        a.NOTES,
        a.UPDATED_AT AS APP_UPDATED_AT
      FROM TEMP.VELOCITY_AI.AFE_USE_CASES a
      JOIN MDM.MDM_INTERFACES.DIM_USE_CASE d ON a.USE_CASE_ID = d.USE_CASE_ID
      ORDER BY
        CASE a.REPORTING_RANK
          WHEN '1 - High' THEN 1
          WHEN '2 - Med' THEN 2
          WHEN '3 - Low' THEN 3
          WHEN '4 - No Show' THEN 4
          WHEN '5 - Evaluating' THEN 5
          ELSE 6
        END,
        d.USE_CASE_EACV DESC NULLS LAST
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching AFE use cases:", error);
    return NextResponse.json({ error: "Failed to fetch AFE use cases" }, { status: 500 });
  }
}
