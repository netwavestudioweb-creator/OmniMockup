import type { Metadata } from 'next';

// Page privée : jamais indexée par les moteurs de recherche, jamais liée depuis le site public
export const metadata: Metadata = {
  title: 'Administration • PitchMySite',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
