import { NextResponse } from "next/server";
import { query, execute } from "@/lib/snowflake";

interface ManageCandidate {
  USE_CASE_ID: string;
  USE_CASE_NAME: string;
  USE_CASE_NUMBER: string;
  USE_CASE_STAGE: string | null;
  USE_CASE_EACV: number | null;
  ACCOUNT_NAME: string;
  DISTRICT_NAME: string | null;
  SPECIALIST_COMMENTS: string | null;
  IS_MANAGED: boolean;
}

export async function GET() {
  try {
    const rows = await query<ManageCandidate>(`
      SELECT
        d.USE_CASE_ID,
        d.USE_CASE_NAME,
        d.USE_CASE_NUMBER,
        d.USE_CASE_STAGE,
        d.USE_CASE_EACV,
        d.ACCOUNT_NAME,
        d.DISTRICT_NAME,
        d.SPECIALIST_COMMENTS,
        CASE WHEN a.USE_CASE_ID IS NOT NULL THEN TRUE ELSE FALSE END AS IS_MANAGED
      FROM MDM.MDM_INTERFACES.DIM_USE_CASE d
      LEFT JOIN TEMP.VELOCITY_AI.AFE_USE_CASES a ON d.USE_CASE_ID = a.USE_CASE_ID
      WHERE LOWER(d.SPECIALIST_COMMENTS) LIKE '%#ai%'
        AND LOWER(d.ACCOUNT_RVP) LIKE '%mccull%'
      ORDER BY IS_MANAGED DESC, d.ACCOUNT_NAME, d.USE_CASE_NAME
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching manage candidates:", error);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { use_case_id } = await request.json();
    if (!use_case_id) {
      return NextResponse.json({ error: "use_case_id required" }, { status: 400 });
    }
    const id = use_case_id.replace(/'/g, "''");
    await execute(`
      INSERT INTO TEMP.VELOCITY_AI.AFE_USE_CASES (USE_CASE_ID, CREATED_AT, UPDATED_AT)
      SELECT '${id}', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
      WHERE NOT EXISTS (
        SELECT 1 FROM TEMP.VELOCITY_AI.AFE_USE_CASES WHERE USE_CASE_ID = '${id}'
      )
    `);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding use case:", error);
    return NextResponse.json({ error: "Failed to add use case" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const use_case_id = searchParams.get("id");
    if (!use_case_id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const id = use_case_id.replace(/'/g, "''");
    await execute(`DELETE FROM TEMP.VELOCITY_AI.AFE_USE_CASES WHERE USE_CASE_ID = '${id}'`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing use case:", error);
    return NextResponse.json({ error: "Failed to remove use case" }, { status: 500 });
  }
}
