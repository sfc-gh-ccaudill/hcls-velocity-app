import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface TeamActivityRow {
  USER_ID: number;
  USER_NAME: string;
  ACCOUNT_ID: number;
  ACCOUNT_NAME: string;
  ACTIVITY_TYPE: string;
  ACTIVITY_TITLE: string;
  ACTIVITY_DATE: string;
  ACTIVITY_DESCRIPTION: string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0", 10);

    const activities = await query<TeamActivityRow>(`
      WITH target_week AS (
        SELECT 
          DATEADD('week', ${weekOffset}, DATE_TRUNC('week', CURRENT_DATE())) as week_start,
          DATEADD('day', 6, DATEADD('week', ${weekOffset}, DATE_TRUNC('week', CURRENT_DATE()))) as week_end
      )
      SELECT 
        u.ID as USER_ID,
        u.NAME as USER_NAME,
        a.ID as ACCOUNT_ID,
        a.NAME as ACCOUNT_NAME,
        'Event' as ACTIVITY_TYPE,
        e.TITLE as ACTIVITY_TITLE,
        e.EVENT_DATE as ACTIVITY_DATE,
        e.OBJECTIVE as ACTIVITY_DESCRIPTION
      FROM HCLS_ACCOUNTS.PUBLIC.USERS u
      JOIN HCLS_ACCOUNTS.PUBLIC.EVENTS e ON u.ID = e.USER_ID
      JOIN HCLS_ACCOUNTS.PUBLIC.ACCOUNTS a ON e.ACCOUNT_ID = a.ID
      CROSS JOIN target_week tw
      WHERE e.EVENT_DATE BETWEEN tw.week_start AND tw.week_end
      
      UNION ALL
      
      SELECT 
        u.ID as USER_ID,
        u.NAME as USER_NAME,
        a.ID as ACCOUNT_ID,
        a.NAME as ACCOUNT_NAME,
        'Use Case Update' as ACTIVITY_TYPE,
        uc.TITLE as ACTIVITY_TITLE,
        uca.CREATED_AT::DATE as ACTIVITY_DATE,
        uca.DESCRIPTION as ACTIVITY_DESCRIPTION
      FROM HCLS_ACCOUNTS.PUBLIC.USERS u
      JOIN HCLS_ACCOUNTS.PUBLIC.USE_CASE_ACTIVITY uca ON u.ID = uca.USER_ID
      JOIN HCLS_ACCOUNTS.PUBLIC.USE_CASES uc ON uca.USE_CASE_ID = uc.ID
      JOIN HCLS_ACCOUNTS.PUBLIC.ACCOUNTS a ON uc.ACCOUNT_ID = a.ID
      CROSS JOIN target_week tw
      WHERE uca.CREATED_AT::DATE BETWEEN tw.week_start AND tw.week_end
      
      ORDER BY ACTIVITY_DATE DESC, USER_NAME
    `);
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching team activity:", error);
    return NextResponse.json({ error: "Failed to fetch team activity" }, { status: 500 });
  }
}
