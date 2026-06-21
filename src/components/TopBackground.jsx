import footerBg from '../assets/footer background.png'
import footerLogo from '../assets/footer_logo.svg'

export function TopBackground() {
  return (
    <div 
      className="top-background" 
      style={{
        position: 'absolute',
        top: '80px',
        left: 0,
        right: 0,
        height: '450px',
        backgroundImage: `url(${footerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}
    >
      <img 
        src={footerLogo} 
        alt="كليما ميديكس" 
        style={{
          width: '240px',
          height: '50px',
          objectFit: 'contain',
          opacity: 0.95
        }}
      />
      <span 
        style={{
          color: '#ffffff',
          fontFamily: 'Tajawal, sans-serif',
          fontSize: '20px',
          fontWeight: '700',
          lineHeight: '1.5',
          direction: 'rtl'
        }}
      >
        انضم إلينا في رحلتنا لدعم الصحة البيئية والتغيير المناخي!
      </span>
    </div>
  );
}
