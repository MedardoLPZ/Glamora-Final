import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, User } from 'lucide-react';
import { Logo } from '../Logo';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle scroll state for transparent to solid transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinkClass = (isActive: boolean) => `
    inline-block px-3 py-2 transition-colors duration-200 relative
    ${isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-primary-600'}
    ${isActive ? 'font-medium' : ''}
  `;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-soft py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container flex items-center justify-between">
        <Link to="/" className="z-10">
          <Logo textColor={isScrolled || !isHomePage ? 'text-primary-600' : 'text-white'} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)}>
            Home
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => navLinkClass(isActive)}>
            Services
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => navLinkClass(isActive)}>
            Products
          </NavLink>
          <NavLink to="/book" className={({ isActive }) => navLinkClass(isActive)}>
            Book
          </NavLink>
          {user && (
            <NavLink to="/my-appointments" className={({ isActive }) => navLinkClass(isActive)}>
              My Appointments
            </NavLink>
          )}
          <NavLink to="/contact" className={({ isActive }) => navLinkClass(isActive)}>
            Contact
          </NavLink>
        </nav>

        {/* Auth/Cart Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/cart" className="relative p-2">
            <ShoppingBag className={`w-5 h-5 ${isHomePage && !isScrolled ? 'text-white' : 'text-gray-700'}`} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center space-x-3">
              <Link to="/account" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
              </Link>
              <Button
                size="sm"
                variant={isHomePage && !isScrolled ? "outline" : "outline"}
                className={isHomePage && !isScrolled ? "border-white text-white hover:bg-white/10" : ""}
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button
                  size="sm"
                  variant={isHomePage && !isScrolled ? "outline" : "outline"}
                  className={isHomePage && !isScrolled ? "border-white text-white hover:bg-white/10" : ""}
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button 
                  size="sm"
                  className={isHomePage && !isScrolled ? "bg-white text-primary-600 hover:bg-white/90" : ""}
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-4 md:hidden">
          <Link to="/cart" className="relative p-2">
            <ShoppingBag className={`w-5 h-5 ${isHomePage && !isScrolled ? 'text-white' : 'text-gray-700'}`} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            onClick={toggleMenu}
            className={`focus:outline-none p-2 ${isHomePage && !isScrolled ? 'text-white' : 'text-gray-700'}`}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg absolute top-full left-0 right-0 animate-slide-down">
          <div className="container py-4 flex flex-col">
            <nav className="flex flex-col space-y-2 mb-5">
              <NavLink to="/" className="nav-link py-3 border-b border-gray-100">
                Home
              </NavLink>
              <NavLink to="/services" className="nav-link py-3 border-b border-gray-100">
                Services
              </NavLink>
              <NavLink to="/products" className="nav-link py-3 border-b border-gray-100">
                Products
              </NavLink>
              <NavLink to="/book" className="nav-link py-3 border-b border-gray-100">
                Book
              </NavLink>
              {user && (
                <NavLink to="/my-appointments" className="nav-link py-3 border-b border-gray-100">
                  My Appointments
                </NavLink>
              )}
              <NavLink to="/contact" className="nav-link py-3 border-b border-gray-100">
                Contact
              </NavLink>
            </nav>

            {user ? (
              <div className="flex flex-col space-y-3">
                <Link to="/account" className="flex items-center space-x-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="font-medium">{user.name}</span>
                </Link>
                <Button
                  onClick={logout}
                  fullWidth
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link to="/login">
                  <Button
                    variant="outline"
                    fullWidth
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button fullWidth>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}