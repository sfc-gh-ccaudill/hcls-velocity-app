import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface TeamActivityRow {
  REPORTED_BY_ID: number | null;
  REPORTED_BY_NAME: string | null;
  SF_ACCOUNT_ID: string;
  ACCOUNT_NAME: string | null;
  EVENT_TYPE: string;
  TITLE: string;
  EVENT_DATE: string;
  OBJECTIVE: string | null;
  NOTES: string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0", 10);

    const activities = await query<TeamActivityRow>(`
      WITH target_week AS (
        SELECT
          DATEADD('week', ${weekOffset}, DATE_TRUNC('week', CURRENT_DATE())) AS week_start,
          DATEADD('day', 6, DATEADD('week', ${weekOffset}, DATE_TRUNC('week', CURRENT_DATE()))) AS week_end
      )
      SELECT
        a.REPORTED_BY_ID,
        a.REPORTED_BY_NAME,
        a.SF_ACCOUNT_ID,
        d.ACCOUNT_NAME,
        a.EVENT_TYPE,
        a.TITLE,
        a.EVENT_DATE,
        a.OBJECTIVE,
        a.NOTES
      FROM TEMP.VELOCITY_AI.SF_ACCOUNT_ACTIVITY a
      LEFT JOIN (
        SELECT DISTINCT ACCOUNT_ID, ACCOUNT_NAME
        FROM MDM.MDM_INTERFACES.DIM_USE_CASE
      ) d ON a.SF_ACCOUNT_ID = d.ACCOUNT_ID
      CROSS JOIN target_week tw
      WHERE a.EVENT_DATE BETWEEN tw.week_start AND tw.week_end
      ORDER BY a.EVENT_DATE DESC, a.REPORTED_BY_NAME
    `);

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching team activity:", error);
    return NextResponse.json({ error: "Failed to fetch team activity" }, { status: 500 });
  }
}
