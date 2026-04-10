import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5',
};

export function Card({ children, padding = 'md', className, ...rest }: CardProps) {
  return (
    <View
      className={`bg-[#18181B] rounded-2xl ${paddingClasses[padding]} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </View>
  );
}
