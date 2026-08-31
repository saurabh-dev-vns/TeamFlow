import React from 'react';

const COLORS = ['bg-primary-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500'];

const getColor = (name = '') => {
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx] || COLORS[0];
};

const SIZES = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-11 h-11 text-sm' };

const Avatar = ({ name = '?', src, size = 'md' }) => {
  if (src) {
    return <img src={src} alt={name} className={`${SIZES[size]} rounded-full object-cover`} />;
  }
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`${SIZES[size]} ${getColor(name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;
