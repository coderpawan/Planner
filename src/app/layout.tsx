import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CreditProvider } from '@/contexts/CreditContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'ShaadiSathi - Wedding Planning Made Easy',
	description: 'Plan your perfect wedding with ShaadiSathi',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>
				<CreditProvider>
					{children}
				</CreditProvider>
			</body>
		</html>
	)
}
