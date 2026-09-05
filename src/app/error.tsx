'use client';

import { useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/8bit-button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("App Error caught by error boundary:", error);
  }, [error]);

  return (
    <div
      className={cn(
        "retro min-h-screen min-h-[100dvh] grid w-full place-content-center gap-5 bg-[#080d0a] text-white px-4 py-16 text-center md:py-24 selection:bg-amber-400 selection:text-black"
      )}
    >
      <div className="retro font-bold text-5xl sm:text-7xl tracking-tight text-rose-500">
        ERROR
      </div>

      <div className="flex justify-center -mt-8 sm:-mt-10">
        <img
          alt="Error Ogre"
          className="pixelated drop-shadow-2xl"
          height={200}
          src="https://www.8bitcn.com/_next/image?url=%2Fimages%2F8bit-ogre.png&w=256&q=75&dpl=dpl_B9Q5u7DD6qZpoCz3VRwuR19npVHK"
          width={200}
        />
      </div>

      <h1 className="retro font-bold text-2xl tracking-tight sm:text-4xl text-white">
        Something went wrong!
      </h1>

      <p className="retro text-zinc-400 text-xs sm:text-sm max-w-md mx-auto">
        {error?.message || "An unexpected error occurred in this room. Turn back or try again."}
      </p>

      <div className="flex flex-wrap justify-center gap-4 mt-2">
        <Button onClick={() => reset()}>
          Try Again
        </Button>
        <a href="/">
          <Button className="bg-zinc-800 text-white hover:bg-zinc-700">
            Return to Home
          </Button>
        </a>
      </div>
    </div>
  );
}
