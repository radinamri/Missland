"use client";

import { useState } from "react";
import type { QualityPreset } from "@/utils/imageProcessing";

interface TryOnControlsProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onCapture: () => void;
  onSwitchCamera: () => void;
  onToggleFullscreen: () => void;
  onQualityChange: (quality: QualityPreset) => void;
  currentQuality: QualityPreset;
  stats: {
    fps: number;
    latency: number;
    framesProcessed: number;
    framesDropped: number;
  };
  cameraActive: boolean;
}

export default function TryOnControls({
  isPaused,
  onTogglePause,
  onCapture,
  onSwitchCamera,
  onToggleFullscreen,
  onQualityChange,
  currentQuality,
  stats,
  cameraActive,
}: TryOnControlsProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Main Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center justify-center gap-6">
          {/* Pause/Play Button */}
          <button
            onClick={onTogglePause}
            disabled={!cameraActive}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition disabled:opacity-50"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            )}
          </button>

          {/* Capture Button */}
          <button
            onClick={onCapture}
            disabled={!cameraActive || isPaused}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 transition disabled:opacity-50 shadow-lg"
            title="Capture"
          >
            <div className="w-14 h-14 rounded-full border-4 border-[#D98B99]" />
          </button>

          {/* Switch Camera Button */}
          <button
            onClick={onSwitchCamera}
            disabled={!cameraActive}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition disabled:opacity-50"
            title="Switch Camera"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition"
            title="Settings"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-24 left-4 right-4 bg-white rounded-2xl shadow-xl p-6 z-20 max-h-[50vh] overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quality Preset */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Quality Preset</label>
            <div className="flex gap-2">
              {(['low', 'balanced', 'high'] as QualityPreset[]).map((quality) => (
                <button
                  key={quality}
                  onClick={() => onQualityChange(quality)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
                    currentQuality === quality
                      ? 'bg-[#D98B99] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Performance Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">FPS</p>
                <p className="text-lg font-bold text-gray-900">{stats.fps}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Latency</p>
                <p className="text-lg font-bold text-gray-900">{stats.latency}ms</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Processed</p>
                <p className="text-lg font-bold text-gray-900">{stats.framesProcessed}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Dropped</p>
                <p className="text-lg font-bold text-gray-900">{stats.framesDropped}</p>
              </div>
            </div>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition"
          >
            Toggle Fullscreen
          </button>
        </div>
      )}
    </>
  );
}
