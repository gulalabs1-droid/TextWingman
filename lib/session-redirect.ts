import { NextResponse } from 'next/server';
import { safeReturnPath } from '@/lib/navigation';

export function sessionRedirect(requestUrl: string, destination: string, sessionResponse: NextResponse): NextResponse {
  const response = NextResponse.redirect(new URL(safeReturnPath(destination), requestUrl));
  sessionResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie));
  return response;
}
