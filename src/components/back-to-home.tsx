"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BackToHome() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              size="icon"
              variant="default"
              className="h-12 w-12 rounded-full shadow-xl hover:scale-110 transition-transform bg-primary text-primary-foreground border-2 border-white/20"
            >
              <Link href="/">
                <House className="h-6 w-6" />
                <span className="sr-only">Voltar para Home</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-semibold">
            Voltar para a página principal
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}