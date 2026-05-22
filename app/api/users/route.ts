import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { User } from "@/lib/types";

export async function GET() {
  try {
    const users = await query<User>(`
      SELECT ID, NAME, EMAIL, SNOWFLAKE_USER
      FROM TEMP.VELOCITY_AI.USERS
      ORDER BY NAME
    `);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
