export function Button({ 
  children, 
  onClick, 
  className = '', 
  variant = 'gradient', 
  type = 'button',
  disabled = false,
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

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${getButtonClass()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
