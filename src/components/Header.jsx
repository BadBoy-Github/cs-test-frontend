import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-blue-600 text-white p-4 shadow">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/dashboard"
          className="text-2xl font-bold hover:text-gray-200"
        >
          Code Scapex Test
        </Link>
      </div>
    </header>
  );
};

export default Header;