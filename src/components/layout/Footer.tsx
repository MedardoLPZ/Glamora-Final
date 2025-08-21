import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 pt-16 pb-8 border-t border-gray-200">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Brand Column */}
          <div className="flex flex-col">
            <Logo />
            <p className="mt-4 text-gray-600">
              Descubre la belleza y la relajación en Glamora Studio, donde cada servicio se entrega con pasión y experiencia.
            </p>
            <div className="flex mt-6 space-x-4">
              <a href="https://instagram.com" className="text-gray-400 hover:text-primary-500 transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://facebook.com" className="text-gray-400 hover:text-primary-500 transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com" className="text-gray-400 hover:text-primary-500 transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="text-gray-600 hover:text-primary-500 transition-colors">
                  Eyelash Extensions
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-600 hover:text-primary-500 transition-colors">
                  Professional Makeup
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-600 hover:text-primary-500 transition-colors">
                  Manicure & Pedicure
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  Res. Costas del Sol, <br />
                  15 calle 21103 San Pedro Sula, Cortés
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0" />
                <a href="tel:+5049524-8210" className="text-gray-600 hover:text-primary-500 transition-colors">
                  (504) 9524-8210
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0" />
                <a href="mailto:info@glamorastudiohn.com" className="text-gray-600 hover:text-primary-500 transition-colors">
                  info@glamorastudiohn.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with copyright and legal links */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {currentYear} Glamora Studio. All rights reserved.</p>
          <div className="flex mt-4 md:mt-0 space-x-6">
            <Link to="/privacy" className="hover:text-primary-500 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary-500 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}