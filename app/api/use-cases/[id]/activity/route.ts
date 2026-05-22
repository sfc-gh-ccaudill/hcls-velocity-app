import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { UseCaseActivity } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const activities = await query<UseCaseActivity & { USER_NAME: string }>(`
      SELECT a.*, u.NAME as USER_NAME
      FROM HCLS_ACCOUNTS.PUBLIC.USE_CASE_ACTIVITY a
      LEFT JOIN HCLS_ACCOUNTS.PUBLIC.USERS u ON a.USER_ID = u.ID
      WHERE a.USE_CASE_ID = ${id}
      ORDER BY a.CREATED_AT DESC
    `);
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, activity_type, description } = body;
    
    await query(`
      INSERT INTO HCLS_ACCOUNTS.PUBLIC.USE_CASE_ACTIVITY 
      (USE_CASE_ID, USER_ID, ACTIVITY_TYPE, DESCRIPTION)
      VALUES (
        ${id}, 
        ${user_id || 'NULL'}, 
        ${activity_type ? `'${activity_type.replace(/'/g, "''")}'` : 'NULL'}, 
        ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'}
      )
    `);
    
    await query(`
      UPDATE HCLS_ACCOUNTS.PUBLIC.USE_CASES 
      SET UPDATED_AT = CURRENT_TIMESTAMP() 
      WHERE ID = ${id}
    `);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { activity_id, description } = body;
    
    await query(`
      UPDATE HCLS_ACCOUNTS.PUBLIC.USE_CASE_ACTIVITY 
      SET DESCRIPTION = '${description.replace(/'/g, "''")}'
      WHERE ID = ${activity_id}
    `);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activity_id");
    
    if (!activityId) {
      return NextResponse.json({ error: "activity_id is required" }, { status: 400 });
    }
    
    await query(`
      DELETE FROM HCLS_ACCOUNTS.PUBLIC.USE_CASE_ACTIVITY 
      WHERE ID = ${activityId}
    `);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 });
  }
}
