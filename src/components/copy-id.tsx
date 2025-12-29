"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!id || id === "Pendente de sincronização") return;
    
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success("ID copiado!");
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1.5 hover:bg-gray-200 rounded-md transition-colors inline-flex items-center"
      title="Copiar ID"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      )}
    </button>
  );
}