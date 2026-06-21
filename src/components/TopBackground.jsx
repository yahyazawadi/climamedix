import bgTop from '../assets/bg_top_new.png'

export function TopBackground() {
  return (
    <div 
      className="top-background" 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '350px',
        backgroundImage: `url(${bgTop})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
}
