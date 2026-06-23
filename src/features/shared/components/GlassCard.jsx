export function GlassCard({ children, className = '', ...props }) {
  return (
    <div className={`figma-glass-card ${className}`} {...props}>
      {children}
    </div>
  );
}
