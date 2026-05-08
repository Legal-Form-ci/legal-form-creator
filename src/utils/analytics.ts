import ReactGA from 'react-ga4';

const MEASUREMENT_ID = 'G-XXXXXXXXXX'; // À remplacer par votre ID Google Analytics

export const initGA = () => {
  if (typeof window !== 'undefined') {
    ReactGA.initialize(MEASUREMENT_ID);
  }
};

export const logPageView = (path: string) => {
  if (typeof window !== 'undefined') {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const logEvent = (category: string, action: string, label?: string) => {
  if (typeof window !== 'undefined') {
    ReactGA.event({
      category,
      action,
      label,
    });
  }
};

export const logConversion = (conversionType: string, value?: number) => {
  if (typeof window !== 'undefined') {
    ReactGA.event({
      category: 'Conversion',
      action: conversionType,
      value,
    });
  }
};
