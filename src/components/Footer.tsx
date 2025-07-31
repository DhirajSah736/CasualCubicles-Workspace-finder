import React from 'react';
import { Linkedin, Github, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    // <footer className="bg-black/40 backdrop-blur-xl border-t border-orange-500/20 px-4 py-2 flex items-center justify-center gap-4 h-10 z-30">
    <footer className="fixed bottom-0 left-0 w-full bg-black backdrop-blur-xl border-t border-orange-500/20 px-4 py-2 flex items-center justify-center gap-4 h-10 z-[1000]">
      <span className="text-xs text-gray-300 font-sans tracking-wide">
        Designed and developed by <span className='text-orange-400 font-bold'>Dhiraj Sah</span>
      </span>
      
      <div className="flex items-center gap-2">
        <a
          href="https://www.linkedin.com/in/dhiraj-sah-tech/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-orange-400 transition-colors duration-300 p-1"
          title="LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
        </a>
        
        <a
          href="https://github.com/DhirajSah736"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-orange-400 transition-colors duration-300 p-1"
          title="GitHub"
        >
          <Github className="w-4 h-4" />
        </a>
        
        <a
          href="https://www.dhirajsah99.com.np"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-orange-400 transition-colors duration-300 p-1"
          title="Portfolio"
        >
          <Globe className="w-4 h-4" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;