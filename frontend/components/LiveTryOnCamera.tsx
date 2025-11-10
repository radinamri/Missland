"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useCameraStream } from "@/hooks/useCameraStream";
import {
  createBinaryMessage,
  parseFrameMetadata,
  extractImageData,
  arrayBufferToObjectURL,
  QUALITY_PRESETS,
  type QualityPreset,
} from "@/utils/imageProcessing";
import ConnectionStatus from "./ConnectionStatus";
import NailReferencePanel from "./NailReferencePanel";
import TryOnControls from "./TryOnControls";
import { useAuth } from "@/context/AuthContext";

interface LiveTryOnCameraProps {
  nailReferenceUrl: string;
  nailPostId?: number;
  onBack: () => void;
}

export default function LiveTryOnCamera({
  nailReferenceUrl,
  nailPostId,
  onBack,
}: LiveTryOnCameraProps) {
  const { user, showToastWithMessage } = useAuth();
  
  // State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>("balanced");
  const [processedFrameUrl, setProcessedFrameUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({
    fps: 0,
    latency: 0,
    framesProcessed: 0,
    framesDropped: 0,
  });

  // Refs
  const sequenceRef = useRef(0);
  const pendingFramesRef = useRef(new Map<number, number>()); // sequence -> timestamp
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get quality settings
  const qualityConfig = QUALITY_PRESETS[qualityPreset];

  // Camera hook
  const {
    getStream,
    stopStream,
    switchCamera,
    captureFrame,
    stats: cameraStats,
  } = useCameraStream({
    facingMode: "user",
    resolution: qualityConfig.resolution,
    frameRate: qualityConfig.fps,
  });

  // WebSocket hook
  const { sendMessage, sendBinary, stats: wsStats } = useWebSocket(
    sessionId
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
          window.location.host
        }/ws/try-on/${sessionId}/`
      : null,
    {
      onMessage: handleWebSocketMessage,
      onBinaryMessage: handleBinaryMessage,
      onError: (error) => {
        console.error("[Try-On] WebSocket error:", error);
        showToastWithMessage("Connection error. Please try again.");
      },
      onClose: () => {
        showToastWithMessage("Connection closed");
      },
    }
  );

  // Handle WebSocket JSON messages
  interface WebSocketMessage {
    type: string;
    session_id?: string;
    message?: string;
    recoverable?: boolean;
    sequence?: number;
    fps?: number;
    avg_latency_ms?: number;
    frames_processed?: number;
    frames_dropped?: number;
  }

  function handleWebSocketMessage(message: WebSocketMessage) {
    switch (message.type) {
      case "session_ready":
        console.log("[Try-On] Session ready:", message.session_id);
        break;

      case "error":
        console.error("[Try-On] Error:", message);
        if (!message.recoverable) {
          showToastWithMessage(message.message || "An error occurred");
        }
        // Remove from pending frames
        if (message.sequence) {
          pendingFramesRef.current.delete(message.sequence);
        }
        break;

      case "stats":
        setStats({
          fps: message.fps || 0,
          latency: message.avg_latency_ms || 0,
          framesProcessed: message.frames_processed || 0,
          framesDropped: message.frames_dropped || 0,
        });
        break;

      case "frame_saved":
        showToastWithMessage("Frame saved successfully!");
        break;

      default:
        console.log("[Try-On] Unknown message type:", message.type);
    }
  }

  // Handle binary messages (processed frames)
  function handleBinaryMessage(data: ArrayBuffer) {
    try {
      const metadata = parseFrameMetadata(data);
      const imageData = extractImageData(data);

      // Calculate latency
      const sentTime = pendingFramesRef.current.get(metadata.sequence);
      if (sentTime) {
        const latency = Date.now() - sentTime;
        pendingFramesRef.current.delete(metadata.sequence);
        
        setStats((prev) => ({
          ...prev,
          latency,
          framesProcessed: prev.framesProcessed + 1,
        }));
      }

      // Display processed frame
      const url = arrayBufferToObjectURL(imageData);
      
      // Revoke old URL
      if (processedFrameUrl) {
        URL.revokeObjectURL(processedFrameUrl);
      }
      
      setProcessedFrameUrl(url);
    } catch (error) {
      console.error("[Try-On] Failed to process binary message:", error);
    }
  }

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch("/api/try-on/session/create/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nail_post_id: nailPostId,
            user_id: user?.id,
          }),
        });

        const data = await response.json();
        setSessionId(data.session_id);
      } catch (error) {
        console.error("[Try-On] Failed to create session:", error);
        showToastWithMessage("Failed to initialize try-on session");
      }
    };

    initSession();
  }, [nailPostId, user, showToastWithMessage]);

  // Start camera when session ready
  useEffect(() => {
    if (sessionId) {
      getStream();
    }

    return () => {
      stopStream();
    };
  }, [sessionId, getStream, stopStream]);

  // Send frames to WebSocket
  useEffect(() => {
    if (!sessionId || !cameraStats.active || isPaused || !wsStats.connected) {
      return;
    }

    const interval = setInterval(async () => {
      // Skip if too many pending frames
      if (pendingFramesRef.current.size > 2) {
        setStats((prev) => ({
          ...prev,
          framesDropped: prev.framesDropped + 1,
        }));
        return;
      }

      const frame = await captureFrame("webp", qualityConfig.quality);
      if (!frame) return;

      const sequence = ++sequenceRef.current;
      const timestamp = Date.now();

      // Track pending frame
      pendingFramesRef.current.set(sequence, timestamp);

      // Create metadata
      const metadata = {
        sequence,
        timestamp,
        format: "webp",
        width: qualityConfig.resolution.width,
        height: qualityConfig.resolution.height,
        quality: qualityConfig.quality * 100,
      };

      // Convert blob to ArrayBuffer and send
      const arrayBuffer = await frame.arrayBuffer();
      const binaryMessage = createBinaryMessage(metadata, arrayBuffer);
      sendBinary(binaryMessage);
    }, 1000 / qualityConfig.fps);

    return () => clearInterval(interval);
  }, [
    sessionId,
    cameraStats.active,
    isPaused,
    wsStats.connected,
    qualityConfig,
    captureFrame,
    sendBinary,
  ]);

  // Send init message when WebSocket connects
  useEffect(() => {
    if (sessionId && wsStats.connected) {
      sendMessage({
        type: "init_session",
        mode: "explore",
        data: {
          nail_post_id: nailPostId,
          user_id: user?.id,
        },
        timestamp: Date.now(),
      });
    }
  }, [sessionId, wsStats.connected, nailPostId, user, sendMessage]);

  // Fullscreen API
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error("[Try-On] Fullscreen failed:", error);
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle capture
  const handleCapture = useCallback(() => {
    sendMessage({
      type: "capture",
      save_to_collection: true,
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  // Handle pause/resume
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
    
    sendMessage({
      type: "control",
      action: isPaused ? "resume" : "pause",
      timestamp: Date.now(),
    });
  }, [isPaused, sendMessage]);

  // Display processed frame or fallback to null
  const displayUrl = processedFrameUrl;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden"
    >
      {/* Camera/Processed Frame Display */}
      <div className="absolute inset-0">
        {displayUrl && (
          <Image
            src={displayUrl}
            alt="Try-on preview"
            fill
            className="object-cover"
            unoptimized
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white font-semibold hover:opacity-80 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <ConnectionStatus
            connected={wsStats.connected}
            latency={stats.latency}
          />
        </div>
      </div>

      {/* Nail Reference Panel */}
      {!isFullscreen && (
        <NailReferencePanel
          imageUrl={nailReferenceUrl}
          expanded={!isFullscreen}
        />
      )}

      {/* Controls */}
      <TryOnControls
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onCapture={handleCapture}
        onSwitchCamera={switchCamera}
        onToggleFullscreen={toggleFullscreen}
        onQualityChange={setQualityPreset}
        currentQuality={qualityPreset}
        stats={stats}
        cameraActive={cameraStats.active}
      />

      {/* Permission Denied Message */}
      {cameraStats.permissionDenied && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center text-white p-8">
            <h2 className="text-2xl font-bold mb-4">Camera Access Required</h2>
            <p className="mb-6">
              Please allow camera access to use the try-on feature.
            </p>
            <button
              onClick={getStream}
              className="bg-[#D98B99] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
            >
              Grant Access
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
