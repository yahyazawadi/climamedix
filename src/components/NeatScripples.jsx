import leftScribble from '../assets/left-svg.svg';
import rightScribble from '../assets/right-svg.svg';

export function NeatScripples() {
  return (
    <>
      <img 
        src={leftScribble} 
        alt="" 
        className="neat-scribble-left"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '418px',
          height: 'auto',
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />
      <img 
        src={rightScribble} 
        alt="" 
        className="neat-scribble-right"
        style={{
          position: 'absolute',
          right: '-50px',
          top: '150px',
          width: '394px',
          height: 'auto',
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />
    </>
  );
}
