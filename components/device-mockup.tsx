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
      <div className={`flex items-end justify-center gap-3 sm:gap-5 md:gap-6 lg:gap-8 flex-wrap w-full ${className}`}>
        {/* Laptop - Left side */}
        <div className="relative w-[240px] sm:w-[280px] md:w-[320px] lg:w-[360px] h-[150px] sm:h-[175px] md:h-[200px] lg:h-[225px] flex-shrink-0">
          {/* Laptop Screen */}
          <div className="absolute inset-0" style={{ transform: 'perspective(1200px) rotateX(2deg)', transformOrigin: 'bottom' }}>
            {/* Outer bezel - MacBook style */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-t-lg shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
              {/* Inner bezel */}
              <div className="absolute inset-[3px] bg-gray-800 rounded-t-md">
                {/* Notch at top center - MacBook style */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60px] sm:w-[70px] md:w-[80px] lg:w-[90px] h-[5px] bg-gray-900 rounded-b-full"></div>
                
                {/* Screen area */}
                <div className="absolute inset-[1px] top-[8px] bg-white rounded-sm overflow-hidden shadow-inner">
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
          
          {/* Laptop Base/Keyboard */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '12%', transform: 'perspective(800px) rotateX(15deg)', transformOrigin: 'top' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-lg shadow-[0_5px_20px_rgba(0,0,0,0.3)]">
              {/* Keyboard area indicator */}
              <div className="absolute inset-x-[8%] top-[20%] bottom-[30%] bg-gray-900/30 rounded"></div>
              {/* Trackpad */}
              <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[25%] h-[8%] bg-gray-900/40 rounded"></div>
            </div>
          </div>
        </div>

        {/* Smartphone - Right side */}
        <div className="relative z-10 w-[100px] sm:w-[120px] md:w-[140px] lg:w-[160px] h-[180px] sm:h-[210px] md:h-[240px] lg:h-[270px] flex-shrink-0">
          <div className="absolute inset-0">
            {/* Phone frame - iPhone style */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-[18px] sm:rounded-[22px] md:rounded-[26px] lg:rounded-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              {/* Outer bezel glow */}
              <div className="absolute inset-[1px] bg-gradient-to-b from-gray-800/50 to-transparent rounded-[17px] sm:rounded-[21px] md:rounded-[25px] lg:rounded-[29px]"></div>
              
              {/* Dynamic island / notch at top */}
              <div className="absolute top-[6px] sm:top-[7px] md:top-[8px] lg:top-[9px] left-1/2 -translate-x-1/2 w-[40px] sm:w-[48px] md:w-[56px] lg:w-[64px] h-[18px] sm:h-[21px] md:h-[24px] lg:h-[27px] bg-black rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                <div className="absolute inset-[1px] bg-gray-900 rounded-full"></div>
              </div>
              
              {/* Screen area */}
              <div className="absolute inset-[3px] sm:inset-[3.5px] md:inset-[4px] lg:inset-[4.5px] top-[24px] sm:top-[28px] md:top-[32px] lg:top-[36px] bg-white rounded-[14px] sm:rounded-[17px] md:rounded-[20px] lg:rounded-[24px] overflow-hidden shadow-inner">
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
              
              {/* Home indicator (for older iPhone style) */}
              <div className="absolute bottom-[4px] sm:bottom-[5px] md:bottom-[5px] lg:bottom-[6px] left-1/2 -translate-x-1/2 w-[30px] sm:w-[36px] md:w-[42px] lg:w-[48px] h-[3px] sm:h-[3.5px] md:h-[4px] bg-gray-700 rounded-full"></div>
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
