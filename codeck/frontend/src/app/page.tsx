"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

type Slide = {
  id: number;
  content: string;
};

export default function Home() {
  // Initialize with default values to avoid hydration mismatch
  const [slides, setSlides] = useState<Slide[]>([
    { id: 1, content: `# Slide 1\n\nHello, World!` },
    { id: 2, content: `# Slide 2\n\nSecond slide content` }
  ]);
  
  const [currentSlideId, setCurrentSlideId] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [viewMode, setViewMode] = useState<"slide" | "code">("slide");

  // Load data from localStorage after component mounts
  useEffect(() => {
    const savedSlides = localStorage.getItem('codeck-slides');
    const savedCurrentSlide = localStorage.getItem('codeck-current-slide');
    
    if (savedSlides) {
      setSlides(JSON.parse(savedSlides));
    }
    if (savedCurrentSlide) {
      setCurrentSlideId(parseInt(savedCurrentSlide));
    }
    setIsLoaded(true);
  }, []);

  // 保存slides到localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('codeck-slides', JSON.stringify(slides));
    }
  }, [slides]);

  // 保存当前选中的slide到localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('codeck-current-slide', currentSlideId.toString());
    }
  }, [currentSlideId]);

  const currentSlide = slides.find(slide => slide.id === currentSlideId) || slides[0];

  const updateSlideContent = (content: string) => {
    setSlides(slides.map(slide => 
      slide.id === currentSlideId 
        ? { ...slide, content }
        : slide
    ));
  };

  const addSlide = () => {
    const newId = Math.max(...slides.map(s => s.id)) + 1;
    const newSlide = {
      id: newId,
      content: `# Slide ${newId}\n\nNew slide content`
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideId(newId);
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-background">
      <header className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">✓ Codeck</span>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left Column: Slide Thumbnails */}
        <aside className="w-48 p-2 border-r overflow-y-auto">
          <h2 className="text-sm font-semibold mb-2">Slides</h2>
          <div className="space-y-2">
            {slides.map((slide) => (
              <Card 
                key={slide.id} 
                className={`h-24 flex items-center justify-center cursor-pointer hover:border-primary ${
                  slide.id === currentSlideId ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setCurrentSlideId(slide.id)}
              >
                <CardContent className="p-0">
                  <span className="text-xs text-muted-foreground">Slide {slide.id}</span>
                </CardContent>
              </Card>
            ))}
            <div 
              className="h-24 flex items-center justify-center cursor-pointer border-2 border-dashed rounded-lg hover:border-primary"
              onClick={addSlide}
            >
              <span className="text-2xl text-muted-foreground">+</span>
            </div>
          </div>
        </aside>

        {/* Center Column: Main Preview Area */}
        <section className="flex-1 flex flex-col p-4">
          <div className="flex justify-end mb-2">
            <Button 
              variant={viewMode === "slide" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode("slide")}
            >
              Slide
            </Button>
            <Button 
              variant={viewMode === "code" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode("code")}
            >
              Code
            </Button>
          </div>
          <div className={`flex-1 border rounded-lg p-4 ${
            viewMode === "slide" ? "bg-gray-50 dark:bg-gray-900" : "bg-gray-900"
          }`}>
            {viewMode === "slide" ? (
              <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: currentSlide.content.replace(/\n/g, "<br>") }} />
            ) : (
              <Textarea
                className="w-full h-full resize-none border-0 focus:ring-0 bg-transparent text-gray-100 placeholder-gray-400"
                value={currentSlide.content}
                onChange={(e) => updateSlideContent(e.target.value)}
                style={{ 
                  fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Menlo, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                  fontSize: '11px',
                  lineHeight: '1.3'
                }}
              />
            )}
          </div>
        </section>

        {/* Right Column: Edit By Chat */}
        <aside className="w-80 p-2 border-l flex flex-col">
          <h2 className="text-sm font-semibold mb-2">Edit By Chat</h2>
          <div className="flex-1 border rounded-lg p-2 mb-2 overflow-y-auto">
            <p className="text-sm">Welcome! How can I help you design your presentation?</p>
          </div>
          <div className="relative">
            <Input type="text" placeholder="e.g., Change the title to 'Hello Next.js'" />
          </div>
        </aside>
      </main>
    </div>
  );
}
