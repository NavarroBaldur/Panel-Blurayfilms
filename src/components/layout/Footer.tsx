'use client';

import Link from 'next/link';
import {
  Facebook,
  Instagram,
} from 'lucide-react';
import Image from 'next/image';

const TikTokIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    className="h-8 w-8"
    viewBox="0 0 24 24"
  >
    <path d="M16.5 1.5h3a4.5 4.5 0 0 0 4.5 4.5v3a9 9 0 0 1-7.5-3.9v7.65a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V1.5z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-[#111827] text-white mt-16 py-12 border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Image src="/anzvaz-01.png" alt="Anzvaz" className="h-10 brightness-0 invert" width={100} height={100} />
            </div>
            <h4 className="text-gray-300">
              Anuncios inmobiliarios, conéctate y anuncia tu inmueble. Conecta con inmuebles y compra o renta.
            </h4>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Enlaces</h4>
            <ul className="space-y-2">
              <li><Link href="/disciplinas" className="text-gray-300 hover:text-white transition-colors">Disciplinas</Link></li>
              <li><Link href="/profesionales" className="text-gray-300 hover:text-white transition-colors">Profesionales</Link></li>
              <li><Link href="/eventos" className="text-gray-300 hover:text-white transition-colors">Eventos</Link></li>
              <li><Link href="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/politicas-de-privacidad" className="text-gray-300 hover:text-white transition-colors">Políticas de privacidad</Link></li>
              <li><Link href="/terminos-y-condiciones" className="text-gray-300 hover:text-white transition-colors">Términos y condiciones</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Síguenos</h4>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Instagram" className="text-gray-300 hover:text-white transition-colors">
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="TikTok" className="text-gray-300 hover:text-white transition-colors">
                <TikTokIcon />
              </Link>
              <Link href="#" aria-label="Facebook" className="text-gray-300 hover:text-white transition-colors">
                <Facebook className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Anzvaz. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;