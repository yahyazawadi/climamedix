export function Button({ 
  children, 
  onClick, 
  className = '', 
  variant = 'gradient', 
  type = 'button',
  disabled = false,
  href,
  target,
  rel,
  as: Component = href ? 'a' : 'button',
  ...props 
}) {
  const getButtonClass = () => {
    switch (variant) {
      case 'gradient':
        return 'figma-gradient-btn';
      case 'outline':
        return 'figma-outline-btn';
      case 'text':
        return 'figma-text-btn';
      case 'more':
        return 'figma-more-btn';
      default:
        return 'figma-gradient-btn';
    }
  };

  const isAnchor = Component === 'a' || Boolean(href);

  return (
    <Component
      {...(isAnchor ? { href, target, rel } : { type, disabled })}
      onClick={onClick}
      className={`${getButtonClass()} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
