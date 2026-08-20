import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

type Variant = 'primary' | 'ghost';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'pill-btn pill-btn-primary text-sm',
  ghost: 'pill-btn pill-btn-ghost text-sm',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  to?: string;
}

/**
 * App-shell action button. Reuses the landing page's .pill-btn family so
 * primary actions look identical whether they're on the public site or
 * inside the authenticated app.
 */
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', to, className, children, ...rest }) => {
  const classes = clsx(VARIANT_CLASSES[variant], className);

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

export default Button;
