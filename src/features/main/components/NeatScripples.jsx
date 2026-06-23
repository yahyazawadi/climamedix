import leftScribble from '../../../assets/left-svg.svg';
import rightScribble from '../../../assets/right-svg.svg';

export function NeatScripples() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: -1,
      overflow: 'hidden'
    }}>
      <img 
        src={leftScribble} 
        alt="" 
        className="neat-scribble-left"
        style={{
          position: 'absolute',
          left: '-180px',
          top: '10px',
          width: '633px',
          height: 'auto',
          pointerEvents: 'none'
        }}
      />
      <img 
        src={rightScribble} 
        alt="" 
        className="neat-scribble-right"
        style={{
          position: 'absolute',
          right: '-120px',
          top: '1486px',
          width: '467px',
          height: 'auto',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
