"use client";

import { Scale, Plus, Sparkles } from "lucide-react";

interface HeaderProps {
  onNewMatter: () => void;
}

export default function Header({ onNewMatter }: HeaderProps) {
  return (
    <header className='bg-slate-900 border-b border-slate-700 px-6 py-4'>
      <div className='flex items-center justify-between max-w-screen-2xl mx-auto'>
        {/* Logo */}
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-blue-600 rounded-lg'>
            <Scale className='w-6 h-6 text-white' />
          </div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold text-white tracking-tight'>
              Saathi.ai
            </h1>
            <Sparkles className='w-4 h-4 text-blue-400' />
          </div>
          <span className='hidden sm:inline-block text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full ml-2'>
            Legal AI Assistant
          </span>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-4'>
          <button
            onClick={onNewMatter}
            className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-blue-600/20'
          >
            <Plus className='w-4 h-4' />
            <span className='hidden sm:inline'>New Matter</span>
          </button>
        </div>
      </div>
    </header>
  );
}
