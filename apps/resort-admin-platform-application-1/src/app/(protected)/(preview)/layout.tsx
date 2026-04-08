export default function PreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen flex-col">
      {children}
    </div>
  )
}
