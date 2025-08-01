import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import Image from "next/image"


const Header = () => {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center min-w-[300px] max-w-[300px]">
          <Image src="/anzvaz-01.png" alt="Anzvaz" className="h-10" width={1920} height={1080} />
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
          <NavigationMenuItem>
          <NavigationMenuTrigger className="rounded-full p-2 px-2">Comprar</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-1 p-2 md:w-[300px] lg:w-[400px]">
                <li>
                  <NavigationMenuLink href="/servicios/web">Desarrollo Web</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="/servicios/movil">Apps Móviles</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
          <NavigationMenuTrigger className=" rounded-full p-2 px-2">Rentar</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-1 p-2 md:w-[300px] lg:w-[400px]">
                <li>
                  <NavigationMenuLink href="/servicios/web">Desarrollo Web</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="/servicios/movil">Apps Móviles</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>          
          <NavigationMenuItem >
          <NavigationMenuLink className=" rounded-full p-2 px-2" href="/nosotros">Agentes</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
          <NavigationMenuLink className=" rounded-full p-2 px-2" href="/contacto">Publicidad</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
          <NavigationMenuLink className=" rounded-full p-2 px-2" href="/nosotros">Blog</NavigationMenuLink>
          </NavigationMenuItem>
          </NavigationMenuList>
      <NavigationMenuViewport />
      </NavigationMenu>


        <nav className="flex items-center min-w-[300px] max-w-[300px] space-x-4">
          <Link href="/login">
            <Button variant="ghost">Acceder</Button>
          </Link>
          <Link href="/signup">
            <Button variant="default">Anunciar Inmueble</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;