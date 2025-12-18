// Proxy auth requests to the backend
const BACKEND_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth', '');
  const backendUrl = `${BACKEND_URL}/api/auth${path}${url.search}`;

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        host: new URL(BACKEND_URL).host,
      },
      credentials: 'include',
    });

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
      },
    });
  } catch (error) {
    return new Response('Backend connection failed', { status: 503 });
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth', '');
  const backendUrl = `${BACKEND_URL}/api/auth${path}${url.search}`;

  try {
    const body = await request.text();
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        host: new URL(BACKEND_URL).host,
        'content-type': request.headers.get('content-type') || 'application/json',
      },
      body,
      credentials: 'include',
    });

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
      },
    });
  } catch (error) {
    return new Response('Backend connection failed', { status: 503 });
  }
}

