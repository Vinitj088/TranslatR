'use client';

import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Languages, SlidersHorizontal, X, Copy, Check, Github } from 'lucide-react';

interface SlangLevel {
  id: string;
  label: string;
  prompt: string;
}

const slangLevels: SlangLevel[] = [
  { id: 'mild', label: 'Mild Slang', prompt: 'Convert to mild internet slang' },
  { id: 'medium', label: 'Medium Slang', prompt: 'Use moderate internet slang and abbreviations' },
  { id: 'heavy', label: 'Heavy Slang', prompt: 'Use heavy internet slang and abbreviations' },
  { id: 'extreme', label: 'Extreme Slang', prompt: 'Use extreme internet slang with lots of emoji' },
  { id: 'crazy', label: 'Crazy Slang', prompt: 'Go absolutely wild with internet slang and emoji' }
];

const TextAnimator: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('medium');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    gsap.registerPlugin(ScrollTrigger);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const animateText = () => {
    if (!isClient || !textRef.current || !translatedText) return;

    const elements = Array.from(textRef.current.children);
    if (elements.length === 0) return;

    gsap.fromTo(
      elements,
      {
        y: 50,
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power1.out'
      }
    );
  };

  const handleCopy = async () => {
    if (!isClient || !translatedText) return;

    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      setError('Failed to copy text');
    }
  };

  const handleTranslate = async (forceTranslate = false) => {
    if (!inputText.trim() || (loading && !forceTranslate)) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError('');

    try {
      const selectedLevelConfig = slangLevels.find(level => level.id === selectedLevel);
      if (!selectedLevelConfig) throw new Error('Invalid slang level');

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          level: selectedLevelConfig.prompt
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.translatedText) {
        throw new Error('No translation received');
      }

      setTranslatedText(data.translatedText);
      setIsFilterOpen(false);

      // Delay animation to ensure DOM update
      if (isClient) {
        requestAnimationFrame(() => {
          setTimeout(animateText, 100);
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      console.error('Translation error:', error);
      setError(error.message || 'Translation failed. Please try again.');
      setTranslatedText('');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
    if (inputText.trim()) {
      handleTranslate(true);
    }
  };

  const renderTranslatedText = (text: string | null) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <div key={i} className="text-2xl md:text-4xl leading-relaxed mb-2">{line}</div>
    ));
  };

  return (
    <div className="flex min-h-screen bg-[#7542ff]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-[400px] m-1 p-8 bg-[#111111] rounded-2xl border-gray-800">
        <div className="flex text-gray-400 text-4xl font-bold mb-6 items-center">
          Translatr
          <Languages className="ml-2 w-8 h-11" />
          <a
            href="https://github.com/Vinitj088/TranslatR"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-gray-400 hover:text-white transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="w-8 h-8" />
          </a>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-gray-400 mb-2">Input Text</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 bg-[#161616] text-white rounded-md p-3 resize-none"
              placeholder="Enter text..."
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            onClick={() => handleTranslate(true)}
            disabled={loading || !inputText.trim()}
            className="w-full bg-[#333] hover:bg-[#676774] text-white p-3 rounded-md flex items-center justify-center disabled:opacity-50 transition-colors"
          >
            {loading ? 'Translating...' : 'Translate'}
          </button>
        </div>
      </div>

      {/* Mobile View Container */}
      <div className="w-full md:hidden flex flex-col h-screen">
        {/* Mobile Header */}
        <div className="bg-[#111111] px-3 py-2 flex justify-between items-center z-50">
          <div className="flex items-center text-gray-400 text-lg font-bold">
            Translatr
            <Languages className="ml-2 w-4 h-5" />
            <a
              href="https://github.com/Vinitj088/TranslatR"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 text-gray-400 hover:text-white transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="text-gray-400"
            aria-label={isFilterOpen ? "Close menu" : "Open menu"}
          >
            {isFilterOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <SlidersHorizontal className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Filter Dropdown */}
        <div
          className={`bg-[#111111] overflow-hidden transition-all duration-300 ease-in-out ${
            isFilterOpen ? 'max-h-48' : 'max-h-0'
          }`}
        >
          <div className="p-3 border-t border-gray-800">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-20 bg-[#161616] text-white rounded-md p-2 text-sm resize-none mb-3"
              placeholder="Enter text..."
            />
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <button
              onClick={() => handleTranslate(true)}
              disabled={loading || !inputText.trim()}
              className="w-full bg-[#333] hover:bg-[#676774] text-white py-2 rounded-md flex items-center justify-center text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Translating...' : 'Translate'}
            </button>
          </div>
        </div>

        {/* Mobile Main Content */}
        <div className="flex-1 bg-[#f8f5ff] p-3 relative">
          {/* Slang Level Buttons */}
          <div className="overflow-x-auto no-scrollbar mb-4">
            <div className="flex space-x-2 w-max min-w-full">
              {slangLevels.map(level => (
                <button
                  key={level.id}
                  onClick={() => handleLevelSelect(level.id)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                    selectedLevel === level.id
                      ? 'bg-[#161618] text-white'
                      : 'bg-[#eae6f2] text-[#676774] hover:bg-[#333] hover:text-white'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Translated Text */}
          <div className="flex flex-col justify-center min-h-[60vh]">
            <div ref={textRef} className="px-2 text-center">
              {loading ? (
                <div className="text-2xl text-gray-400">Translating...</div>
              ) : (
                renderTranslatedText(translatedText)
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 w-full left-0 px-4">
            <div className="flex justify-between items-center">
              {translatedText && (
                <button
                  onClick={animateText}
                  className="flex items-center text-gray-400 text-xs hover:text-black transition-colors"
                >
                  play again
                  <ArrowRight className="ml-1 w-3 h-3" />
                </button>
              )}

              {translatedText && (
                <button
                  onClick={handleCopy}
                  className="flex items-center bg-[#161618] text-white px-3 py-1.5 rounded-full text-xs hover:bg-[#333] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy text
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Main Content */}
      <div className="hidden md:block flex-1 p-8 mb-1 mr-1 ml-0 mt-1 rounded-2xl bg-[#f8f5ff] text-black relative">
        <div className="mb-8 flex space-x-4">
          {slangLevels.map(level => (
            <button
              key={level.id}
              onClick={() => handleLevelSelect(level.id)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedLevel === level.id
                  ? 'bg-[#161618] text-white'
                  : 'bg-[#eae6f2] text-[#676774] hover:bg-[#333] hover:text-white'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col justify-center min-h-[60vh]">
          <div ref={textRef} className="text-black text-center">
            {loading ? (
              <div className="text-3xl text-gray-400">Translating...</div>
            ) : (
              renderTranslatedText(translatedText)
            )}
          </div>
        </div>

        <div className="absolute bottom-8 w-full left-0 px-8">
          <div className="flex justify-between items-center">
            {translatedText && (
              <button
                onClick={animateText}
                className="flex items-center text-gray-400 hover:text-black transition-colors"
              >
                play again
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            )}

            {translatedText && (
              <button
                onClick={handleCopy}
                className="flex items-center bg-[#161618] text-white px-4 py-2 rounded-full hover:bg-[#333] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy text
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextAnimator;