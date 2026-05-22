import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export interface VelocityUser {
  ID: number;
  NAME: string;
  EMAIL: string | null;
  SNOWFLAKE_USER: string | null;
}

export async function GET() {
  try {
    const users = await query<VelocityUser>(
      `SELECT ID, NAME, EMAIL, SNOWFLAKE_USER FROM TEMP.VELOCITY_AI.USERS ORDER BY NAME`
    );
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching velocity users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
