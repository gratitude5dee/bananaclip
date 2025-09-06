import { useState, useCallback } from 'react';
import { AdBrief, AdPackage, AdPackageSchema } from '@/lib/schemas';

// The global prompt context - this entire specification
const GLOBAL_PROMPT_CONTEXT = `
✅ Production Prompt (v2) — Two Tabs: "Nano Banana" + "AdBanana"

Product Name

Banana Studio — dual-workflow creator suite with Tabs:
	•	Nano Banana: AI video scene generator/editor (Fal workflow)
	•	AdBanana: Ad-creative builder that uses this prompt as global context for copy, shots, overlays, captions, and variants

Global Context Rule (critical):
Every AdBanana generation call must prepend:
"Use the Banana Studio specification you are currently reading as contextual knowledge. Prioritize its vocabulary, structures, field names, constraints, and examples."

[Full specification context would be included here...]
`;

export interface GenerateAdParams {
  brief: AdBrief;
  variantCount: number;
}

export function useAdBanana() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdPackage | null>(null);

  const generateAdPackage = useCallback(async (params: GenerateAdParams) => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Prepare context
      const userContext = params.brief.briefContext ?? '';
      const fullContext = `${GLOBAL_PROMPT_CONTEXT}\n\nUSER_BRIEF_CONTEXT:\n${userContext}`;

      // Simulate progress
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock ad package
      const mockPackage: AdPackage = {
        brief: params.brief,
        baseScript: {
          hook: generateHook(params.brief),
          beats: generateBeats(params.brief),
          cta: generateCTA(params.brief),
          captions: generateCaptions(params.brief),
          hashtags: generateHashtags(params.brief),
          complianceNotes: generateComplianceNotes(params.brief),
        },
        variants: Array.from({ length: params.variantCount }, (_, i) => 
          generateVariant(params.brief, i)
        ),
      };

      setProgress(100);
      setResult(AdPackageSchema.parse(mockPackage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const exportToJSON = useCallback((adPackage: AdPackage) => {
    const blob = new Blob([JSON.stringify(adPackage, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${adPackage.brief.brand}_ad_package.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportToSRT = useCallback((script: AdPackage['baseScript']) => {
    let srtContent = '';
    script.beats.forEach((beat, index) => {
      if (beat.voiceover) {
        const start = formatTime(beat.tStart);
        const end = formatTime(beat.tEnd);
        srtContent += `${index + 1}\n${start} --> ${end}\n${beat.voiceover}\n\n`;
      }
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'script_captions.srt';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    generateAdPackage,
    isGenerating,
    progress,
    error,
    result,
    exportToJSON,
    exportToSRT,
    reset,
  };
}

// Helper functions for mock generation
function generateHook(brief: AdBrief): string {
  const hooks = [
    `What if ${brief.product} could change everything?`,
    `The secret ${brief.audience} doesn't want you to know`,
    `This ${brief.product} hack will blow your mind`,
    `Why ${brief.brand} is different from everyone else`,
    `The one thing about ${brief.product} that surprised me`,
  ];
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function generateBeats(brief: AdBrief) {
  const duration = brief.durationSec;
  const beatCount = Math.min(4, Math.floor(duration / 3));
  
  return Array.from({ length: beatCount }, (_, i) => {
    const start = (duration / beatCount) * i;
    const end = (duration / beatCount) * (i + 1);
    
    return {
      tStart: Math.round(start * 10) / 10,
      tEnd: Math.round(end * 10) / 10,
      voiceover: `Beat ${i + 1}: Showcasing ${brief.product}`,
      onScreenText: `${brief.brand} ${brief.product}`,
      overlay: i === 0 ? ['sparkle', 'brand_logo'] : [],
      shotNotes: `${i === 0 ? 'Opening shot' : 'Product demo'} - ${brief.platform} style`,
    };
  });
}

function generateCTA(brief: AdBrief): string {
  const ctas = {
    awareness: `Learn more about ${brief.brand}`,
    traffic: `Visit ${brief.brand}.com today`,
    conversion: `Get ${brief.product} now - limited time`,
  };
  return ctas[brief.objective];
}

function generateCaptions(brief: AdBrief): string {
  return `Discover ${brief.product} - ${brief.valueProp}. Perfect for ${brief.audience}. ${generateCTA(brief)}`;
}

function generateHashtags(brief: AdBrief): string[] {
  return [
    `#${brief.brand.toLowerCase()}`,
    `#${brief.product.toLowerCase().replace(/\s+/g, '')}`,
    `#${brief.platform}`,
    '#viral',
    '#trending',
  ];
}

function generateComplianceNotes(brief: AdBrief): string[] {
  const notes = [];
  if (brief.sensitiveClaims) {
    notes.push('Review claims for compliance with platform guidelines');
  }
  notes.push('Ensure brand logo placement follows platform safe area guidelines');
  notes.push('Music licensing required for background audio');
  return notes;
}

function generateVariant(brief: AdBrief, index: number) {
  const tones = ['playful', 'bold', 'authoritative', 'friendly', 'luxury'] as const;
  const tone = tones[index % tones.length];
  
  return {
    id: `variant-${index + 1}`,
    tone,
    hookRewrite: `${tone.charAt(0).toUpperCase() + tone.slice(1)} version: ${generateHook(brief)}`,
    ctaRewrite: `${generateCTA(brief)} (${tone} tone)`,
    platform: brief.platform,
    script: {
      hook: generateHook(brief),
      beats: generateBeats(brief),
      cta: generateCTA(brief),
      captions: generateCaptions(brief),
      hashtags: generateHashtags(brief),
      complianceNotes: generateComplianceNotes(brief),
    },
  };
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}