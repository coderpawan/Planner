import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
	const { mobile, otp, fullName, city, isNewUser } = await request.json()

	try {
		// TODO: Verify OTP from Redis/DB
		// if (storedOtp !== otp) throw new Error('Invalid OTP')

		let user

		if (isNewUser) {
			// Create new user
			// user = await db.user.create({ data: { mobile, fullName, city } })
			user = { id: '1', mobile, fullName, city }
		} else {
			// Fetch existing user
			// user = await db.user.findUnique({ where: { mobile } })
			user = { id: '1', mobile, fullName: 'Existing User', city: 'Delhi' }
		}

		// Generate JWT token
		// const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!)

		const response = NextResponse.json({ user, success: true })
		
		// Set HTTP-only cookie
		response.cookies.set('auth-token', 'dummy-token', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
		})

		return response
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 })
	}
}
