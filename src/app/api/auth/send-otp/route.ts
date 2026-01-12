import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
	const { mobile } = await request.json()

	if (!mobile) {
		return NextResponse.json({ error: 'Mobile number required' }, { status: 400 })
	}

	try {
		// TODO: Generate OTP and send via SMS service (Twilio, MSG91, etc.)
		// const otp = Math.floor(100000 + Math.random() * 900000).toString()
		// await sendSMS(mobile, `Your OTP is: ${otp}`)
		// Store OTP in Redis/DB with expiry

		console.log(`Sending OTP to ${mobile}`)
		
		return NextResponse.json({ success: true })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
	}
}
