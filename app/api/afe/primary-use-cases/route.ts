import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { PrimaryUseCaseOption } from "@/lib/types";

export async function GET() {
  try {
    const rows = await query<PrimaryUseCaseOption>(`
      SELECT ID, OPTION_NAME, IS_ACTIVE, SORT_ORDER
      FROM TEMP.VELOCITY_AI.PRIMARY_USE_CASE_OPTIONS
      WHERE IS_ACTIVE = TRUE
      ORDER BY SORT_ORDER, OPTION_NAME
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching primary use case options:", error);
    return NextResponse.json({ error: "Failed to fetch options" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { option_name } = await request.json();
    if (!option_name?.trim()) {
      return NextResponse.json({ error: "option_name required" }, { status: 400 });
    }
    await query(`
      INSERT INTO TEMP.VELOCITY_AI.PRIMARY_USE_CASE_OPTIONS (OPTION_NAME, SORT_ORDER)
      SELECT '${option_name.replace(/'/g, "''")}',
             COALESCE((SELECT MAX(SORT_ORDER) FROM TEMP.VELOCITY_AI.PRIMARY_USE_CASE_OPTIONS), 0) + 1
    `);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding primary use case option:", error);
    return NextResponse.json({ error: "Failed to add option" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await query(`UPDATE TEMP.VELOCITY_AI.PRIMARY_USE_CASE_OPTIONS SET IS_ACTIVE = FALSE WHERE ID = ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting primary use case option:", error);
    return NextResponse.json({ error: "Failed to delete option" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, option_name } = await request.json();
    if (!id || !option_name?.trim()) {
      return NextResponse.json({ error: "id and option_name required" }, { status: 400 });
    }
    await query(`UPDATE TEMP.VELOCITY_AI.PRIMARY_USE_CASE_OPTIONS SET OPTION_NAME = '${option_name.replace(/'/g, "''")}' WHERE ID = ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating primary use case option:", error);
    return NextResponse.json({ error: "Failed to update option" }, { status: 500 });
  }
}
