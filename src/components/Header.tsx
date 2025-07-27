import { Button } from "@/components/ui/button";
import { Menu, X, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "الرئيسية", href: "#home" },
    { name: "المميزات", href: "#features" },
    { name: "آراء العملاء", href: "#testimonials" },
    { name: "تواصل معنا", href: "#contact" },
  ];

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-cairo font-bold text-lg">م</span>
            </div>
            <div>
              <h1 className="font-cairo font-bold text-xl text-foreground">منيو تك</h1>
              <p className="font-tajawal text-xs text-muted-foreground">للمطاعم الذكية</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="font-cairo font-medium text-foreground hover:text-primary transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="font-cairo text-muted-foreground hover:text-primary"
              onClick={() => window.open('tel:920000000', '_blank')}
            >
              <Phone className="w-4 h-4 ml-2" />
              920000000
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-white font-cairo px-6"
              onClick={() => window.open('https://wa.me/966500000000', '_blank')}
            >
              <MessageCircle className="w-4 h-4 ml-2" />
              واتساب
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <nav className="py-4 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 font-cairo font-medium text-foreground hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="px-4 py-3 space-y-3">
                <Button
                  variant="outline"
                  className="w-full font-cairo border-2 border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={() => {
                    window.open('tel:920000000', '_blank');
                    setIsMenuOpen(false);
                  }}
                >
                  <Phone className="w-4 h-4 ml-2" />
                  اتصل بنا
                </Button>
                <Button
                  className="w-full bg-success hover:bg-success/90 text-white font-cairo"
                  onClick={() => {
                    window.open('https://wa.me/966500000000', '_blank');
                    setIsMenuOpen(false);
                  }}
                >
                  <MessageCircle className="w-4 h-4 ml-2" />
                  تواصل واتساب
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;