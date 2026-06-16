export function Logo({ light = false, size = 22 }: { light?: boolean; size?: number }) {
  return (
    <img
      src={light ? "/provenly-logo-light.svg" : "/provenly-logo.svg"}
      alt="Provenly"
      height={size + 8}
      style={{ height: size + 8, width: "auto", display: "block" }}
    />
  );
}
