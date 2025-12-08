import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Mecha Oldal - Calculator',
    description: 'Statics problem calculator with one-time access',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <main className="min-h-screen flex flex-col items-center justify-center p-4">
                    {children}
                </main>
            </body>
        </html>
    )
}
