import React from 'react';

interface AvatarProps {
  src: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = '', size = 'lg' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <img
      className={`inline-block rounded-full ${sizeClasses[size]}`}
      src={src}
      alt={alt}
    />
  );
};

export default Avatar;