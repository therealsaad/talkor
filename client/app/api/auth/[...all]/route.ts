import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'talkora-auth-proxy' })
}

export async function POST() {
  return NextResponse.json({ status: 'ok', service: 'talkora-auth-proxy' })
}
