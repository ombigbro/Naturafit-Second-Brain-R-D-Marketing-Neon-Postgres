'use strict';
'use client';

import React from 'react';
import Link from 'next/link';
import { BrainCircuit, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="inline-flex p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-6">
        <BrainCircuit className="h-10 w-10 text-purple-400" />
      </div>
      <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">404 - Page Not Found</h1>
      <p className="text-zinc-400 text-sm max-w-md mb-8">
        The strategy sparring sandbox you are looking for does not exist or has been wiped from local storage.
      </p>
      
      <div className="flex items-center space-x-4">
        <Link
          href="/"
          className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-purple text-white font-semibold text-xs rounded-xl shadow-lg hover:shadow-purple-500/10 transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Home Directory</span>
        </Link>
      </div>
    </div>
  );
}
