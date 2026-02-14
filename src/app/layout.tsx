import type { Metadata } from "next";
import { Bricolage_Grotesque } from 'next/font/google';
import "./globals.css";

const bricolage = Bricolage_Grotesque({
    subsets: ["latin"],
    variable: '--font-bricolage'
});

export const metadata: Metadata = {
    title: "Khrien Academy LMS",
    description: "Guided Learning Management System for structured, time-bound, mentor-led education",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${bricolage.variable} font-sans`}>
                {children}
            </body>
        </html>
    );
}
