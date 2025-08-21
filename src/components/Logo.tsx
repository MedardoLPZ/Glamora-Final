import { Sparkles } from 'lucide-react';

interface LogoProps {
  textColor?: string;
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ textColor = 'text-primary-600', iconColor = 'text-accent-500', size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <div className="flex items-center gap-2">
      <Sparkles className={`${iconColor}`} size={iconSizes[size]} />
      <span className={`${sizes[size]} ${textColor} font-heading font-semibold`}>
        Glamora Studio
      </span>
    </div>
  );
}