import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { User } from "@/lib/types";

export async function GET() {
  try {
    const users = await query<User>(`
      SELECT * FROM HCLS_ACCOUNTS.PUBLIC.USERS ORDER BY NAME
    `);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const snowflakeUser = `HCLS_APP_${name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!`;

    await query(`CREATE USER IF NOT EXISTS ${snowflakeUser} 
      PASSWORD = '${tempPassword}' 
      DEFAULT_ROLE = HCLS_ACCOUNTS_APP_USER 
      MUST_CHANGE_PASSWORD = TRUE`);

    await query(`GRANT ROLE HCLS_ACCOUNTS_APP_USER TO USER ${snowflakeUser}`);

    await query(`
      INSERT INTO HCLS_ACCOUNTS.PUBLIC.USERS (NAME, EMAIL, SNOWFLAKE_USER)
      VALUES ('${name.replace(/'/g, "''")}', ${email ? `'${email.replace(/'/g, "''")}'` : 'NULL'}, '${snowflakeUser}')
    `);

    const [newUser] = await query<User>(`
      SELECT * FROM HCLS_ACCOUNTS.PUBLIC.USERS WHERE SNOWFLAKE_USER = '${snowflakeUser}'
    `);

    return NextResponse.json({ 
      user: newUser, 
      snowflake_user: snowflakeUser,
      temp_password: tempPassword,
      message: "User created. They must change password on first login."
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const [user] = await query<User>(`
      SELECT * FROM HCLS_ACCOUNTS.PUBLIC.USERS WHERE ID = ${id}
    `);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.SNOWFLAKE_USER) {
      try {
        await query(`DROP USER IF EXISTS ${user.SNOWFLAKE_USER}`);
      } catch (e) {
        console.error("Could not drop Snowflake user:", e);
      }
    }

    await query(`UPDATE HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS SET OWNER_ID = NULL WHERE OWNER_ID = ${id}`);
    await query(`UPDATE HCLS_ACCOUNTS.PUBLIC.EVENTS SET USER_ID = NULL WHERE USER_ID = ${id}`);
    await query(`UPDATE HCLS_ACCOUNTS.PUBLIC.USE_CASES SET OWNER_ID = NULL WHERE OWNER_ID = ${id}`);
    await query(`DELETE FROM HCLS_ACCOUNTS.PUBLIC.USE_CASE_ACTIVITY WHERE USER_ID = ${id}`);
    await query(`DELETE FROM HCLS_ACCOUNTS.PUBLIC.USERS WHERE ID = ${id}`);

    return NextResponse.json({ success: true, message: "User and Snowflake account deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
