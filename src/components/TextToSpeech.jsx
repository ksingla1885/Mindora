'use client';

import { Volume2, VolumeX, Volume1, Volume } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import useTextToSpeech from '@/hooks/useTextToSpeech';

export default function TextToSpeech({ text, className = '' }) {
  const {
    isSpeaking,
    isPaused,
    voices,
    voice,
    setVoice,
    pitch,
    setPitch,
    rate,
    setRate,
    volume,
    setVolume,
    speak,
    pause,
    resume,
    stop,
    toggle,
  } = useTextToSpeech();

  // Auto-speak when component mounts (if enabled in user preferences)
  useEffect(() => {
    // Check if auto-speak is enabled in user preferences
    const autoSpeak = localStorage.getItem('ttsAutoSpeak') === 'true';
    
    if (autoSpeak && text) {
      speak(text);
    }

    return () => {
      stop();
    };
  }, [speak, stop, text]);

  const handleToggle = () => {
    toggle(text);
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="h-4 w-4" />;
    if (volume < 0.4) return <Volume className="h-4 w-4" />;
    if (volume < 0.7) return <Volume1 className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        aria-label={isSpeaking ? 'Pause speech' : 'Read aloud'}
        className="h-8 w-8"
      >
        {isSpeaking ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="voice-select">Voice</Label>
              <Select
                value={voice?.name || ''}
                onValueChange={(value) => {
                  const selectedVoice = voices.find((v) => v.name === value);
                  if (selectedVoice) setVoice(selectedVoice);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((v) => (
                    <SelectItem key={v.name} value={v.name}>
                      {`${v.name} (${v.lang})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rate-slider">Speed: {rate.toFixed(1)}x</Label>
              <div className="w-48">
                <Slider
                  id="rate-slider"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[rate]}
                  onValueChange={([value]) => setRate(value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pitch-slider">Pitch: {pitch.toFixed(1)}</Label>
              <div className="w-48">
                <Slider
                  id="pitch-slider"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[pitch]}
                  onValueChange={([value]) => setPitch(value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="volume-slider">Volume</Label>
              <div className="flex items-center gap-2 w-48">
                {getVolumeIcon()}
                <Slider
                  id="volume-slider"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[volume]}
                  onValueChange={([value]) => setVolume(value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-speak">Auto-speak questions</Label>
              <input
                id="auto-speak"
                type="checkbox"
                defaultChecked={localStorage.getItem('ttsAutoSpeak') === 'true'}
                onChange={(e) => {
                  localStorage.setItem('ttsAutoSpeak', e.target.checked);
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
