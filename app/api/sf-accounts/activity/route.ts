import { NextResponse } from "next/server";
import { query, execute } from "@/lib/snowflake";

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS TEMP.VELOCITY_AI.SF_ACCOUNT_ACTIVITY (
    ID NUMBER AUTOINCREMENT PRIMARY KEY,
    SF_ACCOUNT_ID VARCHAR(255) NOT NULL,
    SF_USE_CASE_ID VARCHAR(255),
    REPORTED_BY_ID NUMBER,
    REPORTED_BY_NAME VARCHAR(255),
    TITLE VARCHAR(500) NOT NULL,
    EVENT_TYPE VARCHAR(100) NOT NULL,
    LOCATION_TYPE VARCHAR(100) NOT NULL,
    EVENT_DATE DATE NOT NULL,
    EVENT_TIME TIME,
    ATTENDEES VARCHAR(2000),
    OBJECTIVE VARCHAR(16000),
    NOTES VARCHAR(16000),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
  )
`;

const MIGRATE_SQL = [
  `ALTER TABLE TEMP.VELOCITY_AI.SF_ACCOUNT_ACTIVITY ADD COLUMN IF NOT EXISTS REPORTED_BY_ID NUMBER`,
  `ALTER TABLE TEMP.VELOCITY_AI.SF_ACCOUNT_ACTIVITY ADD COLUMN IF NOT EXISTS REPORTED_BY_NAME VARCHAR(255)`,
];

export interface Activity {
  ID: number;
  SF_ACCOUNT_ID: string;
  SF_USE_CASE_ID: string | null;
  REPORTED_BY_ID: number | null;
  REPORTED_BY_NAME: string | null;
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

async function ensureSchema() {
  await execute(CREATE_TABLE_SQL);
  for (const sql of MIGRATE_SQL) {
    try {
      await execute(sql);
    } catch {
      // column already exists — safe to ignore
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("account_id");

  if (!accountId) {
    return NextResponse.json({ error: "account_id required" }, { status: 400 });
  }

  const id = accountId.replace(/'/g, "''");
  const useCaseId = searchParams.get("use_case_id");

  let sql = `
    SELECT * FROM TEMP.VELOCITY_AI.SF_ACCOUNT_ACTIVITY
    WHERE SF_ACCOUNT_ID = '${id}'
  `;

  if (useCaseId) {
    sql += ` AND SF_USE_CASE_ID = '${useCaseId.replace(/'/g, "''")}'`;
  }

  sql += ` ORDER BY CREATED_AT DESC`;

  try {
    const rows = await query<Activity>(sql);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();

    const body = await request.json();
    const {
      sf_account_id, sf_use_case_id,
      reported_by_id, reported_by_name,
      title, event_type, location_type,
      event_date, event_time, attendees, objective, notes,
    } = body;

    const e = (s: string) => s.replace(/'/g, "''");

    await execute(`
      INSERT INTO TEMP.VELOCITY_AI.SF_ACCOUNT_ACTIVITY
        (SF_ACCOUNT_ID, SF_USE_CASE_ID, REPORTED_BY_ID, REPORTED_BY_NAME,
         TITLE, EVENT_TYPE, LOCATION_TYPE, EVENT_DATE, EVENT_TIME, ATTENDEES, OBJECTIVE, NOTES)
      VALUES (
        '${e(sf_account_id)}',
        ${sf_use_case_id ? `'${e(sf_use_case_id)}'` : "NULL"},
        ${reported_by_id ? Number(reported_by_id) : "NULL"},
        ${reported_by_name ? `'${e(reported_by_name)}'` : "NULL"},
        '${e(title)}',
        '${e(event_type)}',
        '${e(location_type)}',
        '${event_date}',
        ${event_time ? `'${event_time}'` : "NULL"},
        ${attendees ? `'${e(attendees)}'` : "NULL"},
        ${objective ? `'${e(objective)}'` : "NULL"},
        ${notes ? `'${e(notes)}'` : "NULL"}
      )
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "valid id required" }, { status: 400 });
  }

  try {
    await execute(`DELETE FROM TEMP.VELOCITY_AI.SF_ACCOUNT_ACTIVITY WHERE ID = ${parseInt(id)}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 });
  }
}
