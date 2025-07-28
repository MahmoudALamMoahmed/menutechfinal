import { Button } from "@/components/ui/button";
import { Menu, X, Phone, MessageCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, username, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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
            {user ? (
              <div className="flex items-center gap-3">
                <span className="font-cairo text-sm text-muted-foreground">مرحباً {user.email}</span>
                <Button 
                  variant="secondary"
                  onClick={() => username && navigate(`/${username}`)}
                  disabled={!username}
                  className="font-cairo"
                >
                  إدارة مطعمك
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 ml-1" />
                  تسجيل الخروج
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-cairo text-muted-foreground hover:text-primary"
                  onClick={() => navigate('/auth')}
                >
                  تسجيل الدخول
                </Button>
                <Button
                  className="bg-success hover:bg-success/90 text-white font-cairo px-6"
                  onClick={() => navigate('/auth')}
                >
                  ابدأ الآن
                </Button>
              </>
            )}
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
                {user ? (
                  <div className="space-y-3">
                    <div className="px-3 py-2 text-sm text-muted-foreground font-cairo">
                      مرحباً {user.email}
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full font-cairo"
                      onClick={() => {
                        if (username) {
                          navigate(`/${username}`);
                          setIsMenuOpen(false);
                        }
                      }}
                      disabled={!username}
                    >
                      إدارة مطعمك
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full font-cairo"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 ml-1" />
                      تسجيل الخروج
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full font-cairo border-2 border-primary text-primary hover:bg-primary hover:text-white"
                      onClick={() => {
                        navigate('/auth');
                        setIsMenuOpen(false);
                      }}
                    >
                      تسجيل الدخول
                    </Button>
                    <Button
                      className="w-full bg-success hover:bg-success/90 text-white font-cairo"
                      onClick={() => {
                        navigate('/auth');
                        setIsMenuOpen(false);
                      }}
                    >
                      ابدأ الآن
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;