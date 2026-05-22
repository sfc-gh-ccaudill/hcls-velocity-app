import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET() {
  try {
    const [useCases, options] = await Promise.all([
      query<Record<string, unknown>>(`
        SELECT
          a.USE_CASE_ID,
          d.USE_CASE_NUMBER,
          d.USE_CASE_NAME,
          d.ACCOUNT_NAME,
          d.DISTRICT_NAME,
          d.USE_CASE_STAGE,
          d.USE_CASE_EACV,
          d.USE_CASE_STATUS,
          d.USE_CASE_LEAD_SE_NAME,
          d.ACCOUNT_OWNER_NAME,
          a.PSA_AFE_SUPPORT,
          a.WHO_HAS_BALL,
          a.AI_ENGAGEMENT_LEVEL,
          a.REPORTING_RANK,
          a.PRIMARY_USE_CASE,
          a.NOTES,
          a.CREATED_AT,
          a.UPDATED_AT
        FROM TEMP.VELOCITY_AI.AFE_USE_CASES a
        JOIN MDM.MDM_INTERFACES.DIM_USE_CASE d ON a.USE_CASE_ID = d.USE_CASE_ID
        ORDER BY d.USE_CASE_NUMBER
      `),
      query<Record<string, unknown>>(`
        SELECT ID, OPTION_NAME, IS_ACTIVE, SORT_ORDER, CREATED_AT
        FROM TEMP.VELOCITY_AI.PRIMARY_USE_CASE_OPTIONS
        ORDER BY SORT_ORDER, OPTION_NAME
      `),
    ]);

    return NextResponse.json({
      exported_at: new Date().toISOString(),
      afe_use_cases: useCases,
      primary_use_case_options: options,
    });
  } catch (error) {
    console.error("Error generating backup:", error);
    return NextResponse.json({ error: "Failed to generate backup" }, { status: 500 });
  }
}
