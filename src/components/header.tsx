import { Link } from "@tanstack/react-router";

export const Header = () => {
  return (
    <header className="flex justify-between items-center px-8 h-16 bg-gray-950 border-b border-gray-800">
      <Link to="/">
        <h1>asü.app</h1>
      </Link>
    </header>
  );
};
