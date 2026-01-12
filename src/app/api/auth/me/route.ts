import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const token = request.cookies.get('auth-token')?.value

	if (!token) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		// TODO: Verify JWT and fetch user
		// const decoded = jwt.verify(token, process.env.JWT_SECRET!)
		// const user = await db.user.findUnique({ where: { id: decoded.userId } })

		const user = {
			id: '1',
			fullName: 'John Doe',
			mobile: '9876543210',
			city: 'Mumbai',
		}

		return NextResponse.json(user)
	} catch (error) {
		return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
	}
}
