export function Footer() {
  return (
    <footer className="border-t-[1.5px] border-line px-4 sm:px-8 py-6 mt-auto">
      <div className="mx-auto max-w-[1400px] flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} EduForms
        </p>
      </div>
    </footer>
  );
}
