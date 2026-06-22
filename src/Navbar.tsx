import "./Navbar.css";

function Navbar({ popLevel }: { popLevel: number }) {
  const goBack = () => {
    const segments = window.location.pathname
      .split("/")
      .filter(Boolean);

    window.location.pathname = segments.slice(0, -popLevel).join("/");
  };

  return (
    <nav className="navbar">
      <button onClick={goBack}>Back</button>
    </nav>
  );
}

export default Navbar;