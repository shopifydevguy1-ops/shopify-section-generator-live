"use client"

import Image from "next/image"
import { Code } from "lucide-react"

interface DeviceMockupProps {
  previewImage?: string
  mobileImage?: string
  alt?: string
  showAllDevices?: boolean
  showLaptopMobileOnly?: boolean
  className?: string
}

export function DeviceMockup({ 
  previewImage,
  mobileImage,
  alt = "Preview", 
  showAllDevices = true,
  showLaptopMobileOnly = false,
  className = "" 
}: DeviceMockupProps) {
  if (!previewImage) {
    return (
      <div className={`flex items-center justify-center h-full text-muted-foreground ${className}`}>
        <div className="text-center">
          <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-medium">Preview image not available</p>
        </div>
      </div>
    )
  }

  // Laptop + Mobile only view
  if (showLaptopMobileOnly) {
    return (
      <div className={`flex items-end justify-center gap-4 sm:gap-6 md:gap-8 flex-wrap w-full ${className}`}>
        {/* Laptop - Left side - Silver/Grey MacBook style */}
        <div className="relative w-[240px] sm:w-[280px] md:w-[320px] lg:w-[360px] h-[150px] sm:h-[175px] md:h-[200px] lg:h-[225px] flex-shrink-0">
          {/* Laptop Screen */}
          <div className="absolute inset-0" style={{ transform: 'perspective(1200px) rotateX(2deg)', transformOrigin: 'bottom' }}>
            {/* Outer bezel - Silver/Grey MacBook style */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300 rounded-t-lg shadow-[0_15px_40px_rgba(0,0,0,0.3)] border border-slate-400/30">
              {/* Inner bezel - Thin black */}
              <div className="absolute inset-[2px] bg-black rounded-t-md">
                {/* Subtle notch/camera at top center */}
                <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-[50px] sm:w-[60px] md:w-[70px] lg:w-[80px] h-[3px] bg-slate-400/40 rounded-b-full"></div>
                
                {/* Screen area */}
                <div className="absolute inset-[1px] top-[4px] bg-white rounded-sm overflow-hidden shadow-inner">
                  <div className="relative w-full h-full">
                    <Image
                      src={previewImage || ''}
                      alt={alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, (max-width: 1024px) 320px, 360px"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Laptop Base/Keyboard - Silver/Grey */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '14%', transform: 'perspective(800px) rotateX(18deg)', transformOrigin: 'top' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300 rounded-b-lg shadow-[0_5px_20px_rgba(0,0,0,0.3)] border-t border-slate-400/30">
              {/* Speaker grilles at bottom */}
              <div className="absolute bottom-[15%] left-[5%] right-[5%] h-[2px] flex gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-1 h-full bg-slate-400/20 rounded"></div>
                ))}
              </div>
              
              {/* Keyboard area - Grey keys */}
              <div className="absolute inset-x-[6%] top-[25%] bottom-[25%] bg-slate-400/20 rounded">
                {/* Keyboard rows */}
                <div className="absolute inset-x-[2%] top-[10%] h-[18%] flex gap-[1px]">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-slate-500/30 rounded-sm"></div>
                  ))}
                </div>
                <div className="absolute inset-x-[2%] top-[35%] h-[18%] flex gap-[1px]">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-slate-500/30 rounded-sm"></div>
                  ))}
                </div>
                <div className="absolute inset-x-[2%] top-[60%] h-[18%] flex gap-[1px]">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-slate-500/30 rounded-sm"></div>
                  ))}
                </div>
              </div>
              
              {/* Trackpad - Dark area */}
              <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-[22%] h-[12%] bg-slate-600/40 rounded-lg border border-slate-500/30"></div>
            </div>
          </div>
        </div>

        {/* Smartphone - Overlapping laptop on the right - Black iPhone style */}
        <div className="relative z-20 w-[100px] sm:w-[120px] md:w-[140px] lg:w-[160px] h-[180px] sm:h-[210px] md:h-[240px] lg:h-[270px] flex-shrink-0 -ml-[40px] sm:-ml-[50px] md:-ml-[60px] lg:-ml-[70px] mb-[20px] sm:mb-[25px] md:mb-[30px] lg:mb-[35px]">
          <div className="absolute inset-0">
            {/* Phone frame - Black with visible bezel */}
            <div className="absolute inset-0 bg-black rounded-[20px] sm:rounded-[24px] md:rounded-[28px] lg:rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
              {/* Outer bezel - visible black frame */}
              <div className="absolute inset-0 bg-black rounded-[20px] sm:rounded-[24px] md:rounded-[28px] lg:rounded-[32px]"></div>
              
              {/* Dynamic island - Prominent elongated oval at top center */}
              <div className="absolute top-[6px] sm:top-[7px] md:top-[8px] lg:top-[9px] left-1/2 -translate-x-1/2 w-[50px] sm:w-[58px] md:w-[66px] lg:w-[74px] h-[22px] sm:h-[24px] md:h-[26px] lg:h-[28px] bg-black rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.9)] z-10">
                <div className="absolute inset-[1px] bg-gray-950 rounded-full"></div>
                {/* Inner highlight for depth */}
                <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-gray-800/30 rounded-full"></div>
              </div>
              
              {/* Screen area - With visible bezel around it */}
              <div className="absolute inset-[3px] sm:inset-[3.5px] md:inset-[4px] lg:inset-[4.5px] top-[28px] sm:top-[31px] md:top-[34px] lg:top-[37px] bg-white rounded-[14px] sm:rounded-[17px] md:rounded-[20px] lg:rounded-[24px] overflow-hidden shadow-inner">
                <div className="relative w-full h-full">
                  <Image
                    src={mobileImage || previewImage || ''}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, (max-width: 1024px) 140px, 160px"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showAllDevices) {
    return (
      <div className={`flex items-end justify-center gap-2 sm:gap-4 md:gap-6 flex-wrap ${className}`}>
        {/* Laptop - Left side, largest */}
        <div className="relative w-[280px] sm:w-[320px] md:w-[360px] h-[180px] sm:h-[200px] md:h-[220px]">
          {/* Laptop screen frame */}
          <div className="absolute inset-0">
            {/* Outer frame - dark gray/black */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              {/* Inner bezel */}
              <div className="absolute inset-[4px] bg-gray-800 rounded-md">
                {/* Notch at top center - MacBook style */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] sm:w-[90px] md:w-[100px] h-[6px] bg-gray-700 rounded-b-full"></div>
                
                {/* Screen area - white background */}
                <div className="absolute inset-[2px] top-[10px] bg-white rounded-sm overflow-hidden">
                  <div className="relative w-full h-full">
                    <Image
                      src={previewImage}
                      alt={alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, 360px"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Laptop base - subtle shadow underneath */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[95%] h-[4px] bg-gray-700 rounded-b-lg shadow-lg"></div>
        </div>

        {/* Smartphone - Center, slightly overlapping */}
        <div className="relative z-10 w-[120px] sm:w-[140px] md:w-[160px] h-[200px] sm:h-[240px] md:h-[280px] -mb-4 sm:-mb-6">
          <div className="absolute inset-0">
            {/* Phone frame - black with rounded corners */}
            <div className="absolute inset-0 bg-black rounded-[20px] sm:rounded-[24px] md:rounded-[28px] shadow-[0_8px_25px_rgba(0,0,0,0.4)]">
              {/* Dynamic island / notch at top */}
              <div className="absolute top-[8px] sm:top-[10px] md:top-[12px] left-1/2 -translate-x-1/2 w-[50px] sm:w-[60px] md:w-[70px] h-[20px] sm:h-[24px] md:h-[28px] bg-black rounded-full border border-gray-900"></div>
              
              {/* Screen area */}
              <div className="absolute inset-[4px] sm:inset-[5px] md:inset-[6px] top-[28px] sm:top-[34px] md:top-[40px] bg-white rounded-[16px] sm:rounded-[18px] md:rounded-[20px] overflow-hidden">
                <div className="relative w-full h-full">
                  <Image
                    src={previewImage}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 120px, (max-width: 768px) 140px, 160px"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tablet - Right side */}
        <div className="relative w-[160px] sm:w-[180px] md:w-[200px] h-[220px] sm:h-[250px] md:h-[280px]">
          <div className="absolute inset-0">
            {/* Tablet frame - black with rounded corners */}
            <div className="absolute inset-0 bg-black rounded-[10px] sm:rounded-[12px] md:rounded-[14px] shadow-[0_8px_25px_rgba(0,0,0,0.4)]">
              {/* Screen area */}
              <div className="absolute inset-[5px] sm:inset-[6px] md:inset-[7px] bg-white rounded-[6px] sm:rounded-[7px] md:rounded-[8px] overflow-hidden">
                <div className="relative w-full h-full">
                  <Image
                    src={previewImage}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, 200px"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Single device view (desktop only)
  return (
    <div className={`relative w-full h-full min-h-[300px] ${className}`}>
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-[4px] bg-gray-800 rounded-md">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[6px] bg-gray-700 rounded-b-full"></div>
            <div className="absolute inset-[2px] top-[10px] bg-white rounded-sm overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src={previewImage}
                  alt={alt}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[95%] h-[4px] bg-gray-700 rounded-b-lg shadow-lg"></div>
      </div>
    </div>
  )
}
