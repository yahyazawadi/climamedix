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
      <div 
        className="neat-scribble-left"
        style={{
          position: 'absolute',
          left: '-180px',
          top: '10px',
          bottom: 0,
          width: '633px',
          backgroundImage: `url(${leftScribble})`,
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% auto',
          pointerEvents: 'none'
        }}
      />
      <div 
        className="neat-scribble-right"
        style={{
          position: 'absolute',
          right: '-120px',
          top: '1486px',
          bottom: 0,
          width: '467px',
          backgroundImage: `url(${rightScribble})`,
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% auto',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
