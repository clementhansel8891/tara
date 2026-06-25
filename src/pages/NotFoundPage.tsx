import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-6xl font-display font-bold text-muted-foreground/20">404</p>
        <p className="text-sm text-muted-foreground">Halaman tidak ditemukan</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
