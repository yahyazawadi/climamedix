import topBgText from '../assets/topbackgroundtext.svg'

export function TopBackground() {
  return (
    <div className="top-background">
      {/* Faint decorative text/pattern overlay from Figma */}
      <img
        src={topBgText}
        alt=""
        aria-hidden="true"
        className="top-background-pattern"
      />
    </div>
  );
}
