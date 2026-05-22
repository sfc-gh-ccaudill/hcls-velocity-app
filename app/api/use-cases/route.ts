import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { UseCaseWithDetails } from "@/lib/types";

export async function GET() {
  try {
    const useCases = await query<UseCaseWithDetails>(`
      SELECT 
        uc.*,
        a.NAME as ACCOUNT_NAME,
        u.NAME as OWNER_NAME,
        la.DESCRIPTION as LATEST_ACTIVITY,
        la.CREATED_AT as LATEST_ACTIVITY_DATE
      FROM HCLS_ACCOUNTS.PUBLIC.USE_CASES uc
      JOIN HCLS_ACCOUNTS.PUBLIC.ACCOUNTS a ON uc.ACCOUNT_ID = a.ID
      LEFT JOIN HCLS_ACCOUNTS.PUBLIC.USERS u ON uc.OWNER_ID = u.ID
      LEFT JOIN (
        SELECT USE_CASE_ID, DESCRIPTION, CREATED_AT,
               ROW_NUMBER() OVER (PARTITION BY USE_CASE_ID ORDER BY CREATED_AT DESC) as rn
        FROM HCLS_ACCOUNTS.PUBLIC.USE_CASE_ACTIVITY
      ) la ON uc.ID = la.USE_CASE_ID AND la.rn = 1
      ORDER BY uc.PRIORITY ASC, uc.ESTIMATED_VALUE DESC NULLS LAST
    `);
    return NextResponse.json(useCases);
  } catch (error) {
    console.error("Error fetching use cases:", error);
    return NextResponse.json({ error: "Failed to fetch use cases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      account_id, use_case_id, title, priority, estimated_value, stage, 
      account_executive, solution_engineer, owner_id, description, salesforce_link 
    } = body;
    
    await query(`
      INSERT INTO HCLS_ACCOUNTS.PUBLIC.USE_CASES 
      (ACCOUNT_ID, USE_CASE_ID, TITLE, PRIORITY, ESTIMATED_VALUE, STAGE, ACCOUNT_EXECUTIVE, SOLUTION_ENGINEER, OWNER_ID, DESCRIPTION, SALESFORCE_LINK)
      VALUES (
        ${account_id}, 
        ${use_case_id ? `'${use_case_id.replace(/'/g, "''")}'` : 'NULL'},
        '${title.replace(/'/g, "''")}', 
        ${priority || 'NULL'}, 
        ${estimated_value || 'NULL'}, 
        ${stage ? `'${stage.replace(/'/g, "''")}'` : 'NULL'}, 
        ${account_executive ? `'${account_executive.replace(/'/g, "''")}'` : 'NULL'}, 
        ${solution_engineer ? `'${solution_engineer.replace(/'/g, "''")}'` : 'NULL'}, 
        ${owner_id || 'NULL'}, 
        ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'}, 
        ${salesforce_link ? `'${salesforce_link.replace(/'/g, "''")}'` : 'NULL'}
      )
    `);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating use case:", error);
    return NextResponse.json({ error: "Failed to create use case" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, use_case_id, title, priority, estimated_value, stage, 
      account_executive, solution_engineer, owner_id, description, salesforce_link 
    } = body;
    
    await query(`
      UPDATE HCLS_ACCOUNTS.PUBLIC.USE_CASES 
      SET 
        USE_CASE_ID = ${use_case_id ? `'${use_case_id.replace(/'/g, "''")}'` : 'NULL'},
        TITLE = '${title.replace(/'/g, "''")}',
        PRIORITY = ${priority || 'NULL'},
        ESTIMATED_VALUE = ${estimated_value || 'NULL'},
        STAGE = ${stage ? `'${stage.replace(/'/g, "''")}'` : 'NULL'},
        ACCOUNT_EXECUTIVE = ${account_executive ? `'${account_executive.replace(/'/g, "''")}'` : 'NULL'},
        SOLUTION_ENGINEER = ${solution_engineer ? `'${solution_engineer.replace(/'/g, "''")}'` : 'NULL'},
        OWNER_ID = ${owner_id || 'NULL'},
        DESCRIPTION = ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'},
        SALESFORCE_LINK = ${salesforce_link ? `'${salesforce_link.replace(/'/g, "''")}'` : 'NULL'},
        UPDATED_AT = CURRENT_TIMESTAMP()
      WHERE ID = ${id}
    `);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating use case:", error);
    return NextResponse.json({ error: "Failed to update use case" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    
    await query(`DELETE FROM HCLS_ACCOUNTS.PUBLIC.USE_CASE_ACTIVITY WHERE USE_CASE_ID = ${id}`);
    await query(`DELETE FROM HCLS_ACCOUNTS.PUBLIC.USE_CASES WHERE ID = ${id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting use case:", error);
    return NextResponse.json({ error: "Failed to delete use case" }, { status: 500 });
  }
}
