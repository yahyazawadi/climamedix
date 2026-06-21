import bg3 from '../assets/bg_3.png'

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
        backgroundImage: `url(${bg3})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
}
