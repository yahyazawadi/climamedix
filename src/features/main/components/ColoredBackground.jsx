import bg1 from '../../../assets/bg_1.png'

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
        zIndex: -3,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {[...Array(20)].map((_, i) => (
        <img
          key={i}
          src={bg1}
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            transform: i % 2 !== 0 ? 'scaleY(-1)' : 'none',
            flexShrink: 0,
            marginTop: i > 0 ? '-1px' : '0'
          }}
        />
      ))}
    </div>
  );
}
