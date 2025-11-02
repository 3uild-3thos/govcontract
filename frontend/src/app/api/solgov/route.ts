import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get the endpoint path (e.g., 'meta', 'proof/vote_account/...', etc.)
    const rawPath = searchParams.get("path") || "";
    // Support clients sending an encoded path value
    const path = decodeURIComponent(rawPath);
    if (!path) {
      return NextResponse.json(
        { error: "Missing 'path' parameter" },
        { status: 400 }
      );
    }

    // Build the full URL to the solgov API
    // const url = `https://api.solgov.online/${path}`;
    const url = `http://84.32.100.123:8000/${path}`;

    // Forward the request
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.log("url", url);
      console.log("path", path);
      console.error("API responded with status:", response.status);
      const errorBody = await response.text();
      console.error("API error response:", errorBody);

      return NextResponse.json(
        {
          error: `API responded with status ${response.status} ${response.body}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the response with CORS headers
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy request" },
      { status: 500 }
    );
  }
}
