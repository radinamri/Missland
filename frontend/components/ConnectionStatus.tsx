"use client";

interface ConnectionStatusProps {
  connected: boolean;
  latency: number;
}

export default function ConnectionStatus({
  connected,
  latency,
}: ConnectionStatusProps) {
  const getQuality = () => {
    if (!connected) return { text: "Disconnected", color: "text-red-500", dot: "bg-red-500" };
    if (latency < 100) return { text: "Excellent", color: "text-green-500", dot: "bg-green-500" };
    if (latency < 200) return { text: "Good", color: "text-yellow-500", dot: "bg-yellow-500" };
    return { text: "Poor", color: "text-red-500", dot: "bg-red-500" };
  };

  const quality = getQuality();

  return (
    <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
      <div className={`w-2 h-2 rounded-full ${quality.dot} ${connected ? 'animate-pulse' : ''}`} />
      <span className={`text-sm font-medium ${quality.color}`}>
        {quality.text}
      </span>
      {connected && (
        <span className="text-xs text-white/70">{latency}ms</span>
      )}
    </div>
  );
}
