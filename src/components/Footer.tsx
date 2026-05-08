import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";

const Footer = () => {
  const { t } = useTranslation();

  const services = [
    "Création d'entreprise",
    "Création d'association",
    "Création d'ONG",
    "Documents juridiques",
    "Immatriculation CNPS",
  ];

  const regions = [
    "Abidjan (Lagunes)",
    "Yamoussoukro (Lacs)",
    "Bouaké (Vallée du Bandama)",
    "Daloa (Sassandra-Marahoué)",
    "San-Pédro (Bas-Sassandra)",
    "Korhogo (Savanes)",
    "Man (Montagnes)",
    "Abengourou (Comoé)",
    "Bondoukou (Zanzan)",
    "Gagnoa (Gôh-Djiboua)",
  ];

  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img src={logo} alt="Legal Form SARL" className="h-10 w-10" />
              <span className="font-heading font-bold text-xl text-primary">Legal Form SARL</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('footer.description', 'Votre partenaire de confiance pour créer et développer votre entreprise en Côte d\'Ivoire.')}
            </p>
            <div className="flex space-x-3">
              <a href="https://facebook.com/legalformci" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/legalformci" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com/company/legalformci" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-heading font-semibold text-foreground mb-4">{t('footer.services', 'Nos Services')}</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    to="/services"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Regions */}
          <div>
            <h3 className="font-heading font-semibold text-foreground mb-4">{t('footer.regions', 'Nos Régions')}</h3>
            <ul className="space-y-2">
              {regions.map((region) => (
                <li key={region}>
                  <Link
                    to="/regions"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {region}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-semibold text-foreground mb-4">{t('footer.contact', 'Contact')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <div>+225 07 09 67 79 25</div>
                  <div>+225 01 71 50 04 73</div>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <MessageCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <a 
                  href="https://wa.me/2250709677925" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-green-500 transition-colors"
                >
                  WhatsApp: +225 07 09 67 79 25
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <div>contact@legalform.ci</div>
                  <div>monentreprise@legalform.ci</div>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <a 
                  href="https://maps.app.goo.gl/HNxpTdi9dZptmf8G9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  BPM 387, Grand-Bassam, ANCIENNE CIE<br />
                  Côte d'Ivoire
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-10 pt-8 border-t border-border">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h3 className="font-heading font-semibold text-lg text-foreground">Restez informé</h3>
            <p className="text-sm text-muted-foreground">
              Recevez nos guides juridiques, actualités et offres exclusives directement dans votre boîte mail.
            </p>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <NewsletterSubscribe source="footer" variant="inline" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Legal Form SARL. {t('footer.rights', 'Tous droits réservés.')}
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.privacy', 'Confidentialité')}
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.terms', 'Conditions')}
              </Link>
            </div>
          </div>
          
          {/* Developer credit */}
          <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-3">
            <a 
              href="https://www.ikoffi.agricapital.ci" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img 
                src="/images/developer-photo.jpg" 
                alt="Inocent KOFFI" 
                className="h-8 w-8 rounded-full object-cover border-2 border-primary"
              />
              <span className="text-sm text-muted-foreground">
                Plateforme développée par <strong className="text-foreground">Inocent KOFFI</strong>
              </span>
            </a>
            <span className="text-muted-foreground hidden sm:inline">-</span>
            <a 
              href="https://wa.me/2250759566087" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-green-500 transition-colors"
            >
              +225 07 59 56 60 87
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
