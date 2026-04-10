import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-primary',
  secondary: 'bg-[#27272A]',
  ghost:     'bg-transparent border border-[#52525B]',
  danger:    'bg-[#EF4444]',
};

const textClasses: Record<Variant, string> = {
  primary:   'text-white',
  secondary: 'text-white',
  ghost:     'text-[#A1A1AA]',
  danger:    'text-white',
};

const sizeClasses: Record<Size, string> = {
  sm: 'py-2 px-3 rounded-xl',
  md: 'py-3.5 px-5 rounded-2xl',
  lg: 'py-4 px-6 rounded-2xl',
};

const textSizeClasses: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base',
};

export function Button({
  title, variant = 'primary', size = 'md',
  loading = false, disabled, leftIcon, className, ...rest
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${(disabled || loading) ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...rest}
    >
      {loading
        ? <ActivityIndicator color="white" size="small" />
        : leftIcon && <Text className={textSizeClasses[size]}>{leftIcon}</Text>
      }
      <Text className={`font-bold ${textClasses[variant]} ${textSizeClasses[size]}`}>{title}</Text>
    </TouchableOpacity>
  );
}
