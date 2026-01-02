import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Youtube } from 'lucide-react';

export const Navbar = () => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <nav className="flex items-center justify-between p-4 bg-[#202020] text-white fixed top-0 w-full z-50 shadow-md h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <Youtube size={32} color="#ff0000" fill="#ff0000" />
                <span className="text-xl font-bold tracking-tighter">YouTube TV</span>
            </div>

            <form onSubmit={handleSearch} className="flex-1 max-w-[600px] mx-4 flex items-center bg-[#121212] rounded-full overflow-hidden border border-[#303030] focus-within:border-[#1c62b9]">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent text-white px-4 py-2 outline-none"
                />
                <button type="submit" className="p-2 bg-[#303030] hover:bg-[#404040] transition-colors px-4 border-l border-[#303030]">
                    <Search size={20} />
                </button>
            </form>

            <div className="w-[100px] flex justify-end">
                {/* Placeholder for future buttons */}
            </div>
        </nav>
    );
};
