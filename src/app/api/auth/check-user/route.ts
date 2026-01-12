import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const mobile = request.nextUrl.searchParams.get('mobile')

	if (!mobile) {
		return NextResponse.json({ error: 'Mobile number required' }, { status: 400 })
	}

	try {
		// TODO: Check if user exists in your database
		// Example: const user = await db.user.findUnique({ where: { mobile } })
		const exists = false // Replace with actual DB check

		return NextResponse.json({ exists })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to check user' }, { status: 500 })
	}
}
