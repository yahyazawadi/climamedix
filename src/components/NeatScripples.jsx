import bg2 from '../assets/bg_2.png'

export function NeatScripples() {
  return (
    <div 
      className="neat-scripples" 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${bg2})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: -2,
        pointerEvents: 'none'
      }}
    />
  );
}
