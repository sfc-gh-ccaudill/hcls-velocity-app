import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");
    
    if (!accountId) {
      return NextResponse.json({ error: "Account ID required" }, { status: 400 });
    }

    const eventsResult = await query<{EVENTS_TEXT: string}>(`
      SELECT LISTAGG(
        EVENT_TYPE || ' on ' || EVENT_DATE || ': ' || TITLE || COALESCE('. ' || OBJECTIVE, ''),
        '; '
      ) WITHIN GROUP (ORDER BY EVENT_DATE DESC) as EVENTS_TEXT
      FROM HCLS_ACCOUNTS.PUBLIC.EVENTS
      WHERE ACCOUNT_ID = ${accountId}
    `);

    const useCasesResult = await query<{USE_CASES_TEXT: string}>(`
      SELECT LISTAGG(
        TITLE || ' (' || COALESCE(STAGE, 'No Stage') || ', ' || COALESCE('$' || ESTIMATED_VALUE::VARCHAR, 'No Value') || ')' || COALESCE(': ' || DESCRIPTION, ''),
        '; '
      ) WITHIN GROUP (ORDER BY PRIORITY NULLS LAST) as USE_CASES_TEXT
      FROM HCLS_ACCOUNTS.PUBLIC.USE_CASES
      WHERE ACCOUNT_ID = ${accountId}
    `);

    const eventsText = eventsResult[0]?.EVENTS_TEXT || 'No events recorded';
    const useCasesText = useCasesResult[0]?.USE_CASES_TEXT || 'No use cases';

    const prompt = `You are an executive assistant. Summarize the following account activity in 2-3 concise sentences. Focus on key themes, recent progress, and important opportunities. Do not include any preamble or introduction - just provide the summary directly.

Events: ${eventsText}

Use Cases: ${useCasesText}`;

    const summaryResult = await query<{SUMMARY: string}>(`
      SELECT SNOWFLAKE.CORTEX.COMPLETE('llama3.1-8b', '${prompt.replace(/'/g, "''")}') as SUMMARY
    `);

    return NextResponse.json({ 
      summary: summaryResult[0]?.SUMMARY || 'Unable to generate summary'
    });
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return NextResponse.json({ 
      summary: "Summary unavailable. Check recent events and use cases below for details."
    });
  }
}
