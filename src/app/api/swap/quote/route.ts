import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const apiKey = process.env.NEXT_PUBLIC_ZERO_EX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Forward all search parameters to the 0x API
  const quoteParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    quoteParams.append(key, value);
  });

  const headers = {
    "Content-Type": "application/json",
    "0x-api-key": apiKey,
    "0x-version": "v2",
  };

  try {
    console.log('Proxying quote request to 0x API:', `https://api.0x.org/swap/allowance-holder/quote?${quoteParams.toString()}`);
    
    const response = await fetch(
      `https://api.0x.org/swap/allowance-holder/quote?${quoteParams.toString()}`,
      { headers }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('0x API Quote Error:', errorText);
      return NextResponse.json(
        { error: `0x API Error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying quote to 0x API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote from 0x API' },
      { status: 500 }
    );
  }
}
