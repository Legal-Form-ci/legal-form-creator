import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";

interface Props {
  password: string;
}

const checkPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

// Check against known compromised passwords (common ones)
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine',
  'letmein', 'football', 'shadow', 'superman', 'qwerty123', 'admin',
  'welcome', 'hello', '123456789', '1234567890', 'password1', 'password123',
  'azerty', 'motdepasse', 'test', 'test123', 'pass', 'pass123',
];

export const PasswordStrengthIndicator = ({ password }: Props) => {
  const [isCompromised, setIsCompromised] = useState(false);

  useEffect(() => {
    if (!password || password.length < 4) {
      setIsCompromised(false);
      return;
    }
    const lower = password.toLowerCase();
    setIsCompromised(COMMON_PASSWORDS.includes(lower));
  }, [password]);

  if (!password) return null;

  const score = checkPasswordStrength(password);
  
  const getLabel = () => {
    if (isCompromised) return 'Mot de passe compromis';
    if (score <= 2) return 'Faible';
    if (score <= 4) return 'Moyen';
    return 'Fort';
  };

  const getColor = () => {
    if (isCompromised) return 'text-red-600 bg-red-50 border-red-200';
    if (score <= 2) return 'text-red-500';
    if (score <= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBarColor = () => {
    if (isCompromised) return 'bg-red-500';
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const barWidth = isCompromised ? 100 : (score / 6) * 100;

  return (
    <div className="mt-2 space-y-2">
      {isCompromised && (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span className="font-medium">Ce mot de passe est connu et compromis. Choisissez-en un autre.</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-300 rounded-full ${getBarColor()}`} style={{ width: `${barWidth}%` }} />
        </div>
        <span className={`text-xs font-medium ${getColor()}`}>
          {getLabel()}
        </span>
      </div>
      {!isCompromised && score <= 4 && (
        <p className="text-xs text-muted-foreground">
          Utilisez au moins 8 caractères, avec majuscules, chiffres et caractères spéciaux.
        </p>
      )}
    </div>
  );
};
