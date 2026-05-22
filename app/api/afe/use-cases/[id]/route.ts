import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { psa_afe_support, who_has_ball, ai_engagement_level, reporting_rank, primary_use_case, notes } = body;

    const escape = (v: string | null) => v ? `'${v.replace(/'/g, "''")}'` : "NULL";

    await query(`
      MERGE INTO TEMP.VELOCITY_AI.AFE_USE_CASES t
      USING (SELECT '${id.replace(/'/g, "''")}' AS USE_CASE_ID) s
      ON t.USE_CASE_ID = s.USE_CASE_ID
      WHEN MATCHED THEN UPDATE SET
        PSA_AFE_SUPPORT = ${escape(psa_afe_support)},
        WHO_HAS_BALL = ${escape(who_has_ball)},
        AI_ENGAGEMENT_LEVEL = ${escape(ai_engagement_level)},
        REPORTING_RANK = ${escape(reporting_rank)},
        PRIMARY_USE_CASE = ${escape(primary_use_case)},
        NOTES = ${escape(notes)},
        UPDATED_AT = CURRENT_TIMESTAMP()
      WHEN NOT MATCHED THEN INSERT
        (USE_CASE_ID, PSA_AFE_SUPPORT, WHO_HAS_BALL, AI_ENGAGEMENT_LEVEL, REPORTING_RANK, PRIMARY_USE_CASE, NOTES)
      VALUES
        (s.USE_CASE_ID, ${escape(psa_afe_support)}, ${escape(who_has_ball)}, ${escape(ai_engagement_level)}, ${escape(reporting_rank)}, ${escape(primary_use_case)}, ${escape(notes)})
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error upserting AFE use case:", error);
    return NextResponse.json({ error: "Failed to save use case data" }, { status: 500 });
  }
}
