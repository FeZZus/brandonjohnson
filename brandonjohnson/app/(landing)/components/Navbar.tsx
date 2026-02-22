const Navbar = () => (
  <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
    <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-8">
      <span className="font-mono text-sm font-semibold text-foreground tracking-wide">Zonary</span>
      <button className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90">
        Request access
      </button>
    </div>
  </nav>
);

export default Navbar;
