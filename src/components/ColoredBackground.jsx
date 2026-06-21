import bgColored from '../assets/bg_colored_new.png'

export function ColoredBackground() {
  return (
    <div 
      className="colored-background" 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${bgColored})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: -3,
        pointerEvents: 'none'
      }}
    />
  );
}
