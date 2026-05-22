import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export interface ActionItem {
  ID: number;
  ACCOUNT_ID: number;
  EVENT_ID: number | null;
  USE_CASE_ID: number | null;
  DESCRIPTION: string;
  DUE_DATE: string | null;
  ASSIGNED_TO: string | null;
  OWNER_ID: number | null;
  COMPLETED: boolean;
  COMPLETED_BY: string | null;
  COMPLETED_AT: string | null;
  CREATED_AT: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");
    
    let sql = `SELECT a.*, u.NAME as OWNER_NAME, uc.TITLE as USE_CASE_TITLE 
      FROM HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS a 
      LEFT JOIN HCLS_ACCOUNTS.PUBLIC.USERS u ON a.OWNER_ID = u.ID
      LEFT JOIN HCLS_ACCOUNTS.PUBLIC.USE_CASES uc ON a.USE_CASE_ID = uc.ID`;
    if (accountId) {
      sql += ` WHERE a.ACCOUNT_ID = ${accountId}`;
    }
    sql += ` ORDER BY a.COMPLETED ASC, a.DUE_DATE ASC NULLS LAST, a.CREATED_AT DESC`;
    
    const items = await query<ActionItem>(sql);
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching action items:", error);
    return NextResponse.json({ error: "Failed to fetch action items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { account_id, event_id, use_case_id, description, due_date, assigned_to, owner_id } = body;
    
    await query(`
      INSERT INTO HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS (ACCOUNT_ID, EVENT_ID, USE_CASE_ID, DESCRIPTION, DUE_DATE, ASSIGNED_TO, OWNER_ID)
      VALUES (
        ${account_id},
        ${event_id || 'NULL'},
        ${use_case_id || 'NULL'},
        '${description.replace(/'/g, "''")}',
        ${due_date ? `'${due_date}'` : 'NULL'},
        ${assigned_to ? `'${assigned_to.replace(/'/g, "''")}'` : 'NULL'},
        ${owner_id || 'NULL'}
      )
    `);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating action item:", error);
    return NextResponse.json({ error: "Failed to create action item" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, completed, completed_by } = body;
    
    if (completed) {
      await query(`
        UPDATE HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS 
        SET COMPLETED = TRUE, COMPLETED_BY = '${(completed_by || 'Unknown').replace(/'/g, "''")}', COMPLETED_AT = CURRENT_TIMESTAMP()
        WHERE ID = ${id}
      `);
    } else {
      await query(`
        UPDATE HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS 
        SET COMPLETED = FALSE, COMPLETED_BY = NULL, COMPLETED_AT = NULL
        WHERE ID = ${id}
      `);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating action item:", error);
    return NextResponse.json({ error: "Failed to update action item" }, { status: 500 });
  }
}
