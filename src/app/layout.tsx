/* The <html> and <body> tags are in [locale]/layout.tsx, so each page gets
   its own lang attribute. This layout only exists for not-found.tsx. */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
