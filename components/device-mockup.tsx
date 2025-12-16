"use client"

import Image from "next/image"
import { Code } from "lucide-react"
import { useState } from "react"

interface DeviceMockupProps {
  previewImage?: string
  mobileImage?: string
  alt?: string
  showAllDevices?: boolean
  showLaptopMobileOnly?: boolean
  showLaptopOnly?: boolean
  className?: string
}

export function DeviceMockup({ 
  previewImage,
  mobileImage,
  alt = "Preview", 
  showAllDevices = true,
  showLaptopMobileOnly = false,
  showLaptopOnly = false,
  className = "" 
}: DeviceMockupProps) {
  const [imageError, setImageError] = useState(false)
  const [mobileImageError, setMobileImageError] = useState(false)

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

  // Laptop + Mobile only view - shows main and mobile images side-by-side
  if (showLaptopMobileOnly) {
    return (
      <div className={`flex items-center justify-center gap-4 sm:gap-6 w-full ${className}`}>
        {/* Main/Desktop Image */}
        {previewImage && !imageError && (
          <div className="relative flex-1 max-w-[50%] aspect-video min-h-[200px]">
            <Image
              src={previewImage}
              alt={alt}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 50vw, 400px"
              unoptimized
              onError={() => setImageError(true)}
            />
          </div>
        )}
        {imageError && (
          <div className="flex-1 max-w-[50%] aspect-video min-h-[200px] flex items-center justify-center bg-muted/30 text-muted-foreground">
            <div className="text-center">
              <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Image unavailable</p>
            </div>
          </div>
        )}
        
        {/* Mobile Image */}
        {mobileImage && !mobileImageError && (
          <div className="relative flex-1 max-w-[50%] aspect-[9/16] min-h-[200px]">
            <Image
              src={mobileImage}
              alt={`${alt} - Mobile`}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 50vw, 300px"
              unoptimized
              onError={() => setMobileImageError(true)}
            />
          </div>
        )}
        {mobileImageError && (
          <div className="flex-1 max-w-[50%] aspect-[9/16] min-h-[200px] flex items-center justify-center bg-muted/30 text-muted-foreground">
            <div className="text-center">
              <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Mobile image unavailable</p>
            </div>
          </div>
        )}
        
        {/* Fallback if only one image */}
        {previewImage && !mobileImage && (
          <div className="relative w-full aspect-video min-h-[200px]">
            <Image
              src={previewImage}
              alt={alt}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 800px"
              unoptimized
            />
          </div>
        )}
      </div>
    )
  }

  // Laptop only view - displays main image only
  if (showLaptopOnly) {
    return (
      <div className={`flex items-center justify-center w-full ${className}`}>
        <div className="relative w-full aspect-video min-h-[200px]">
          <Image
            src={previewImage || ''}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 800px"
            unoptimized
          />
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
                      className="object-contain"
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
                <div className="relative w-full h-full bg-white">
                  <Image
                    src={previewImage}
                    alt={alt}
                    fill
                    className="object-contain"
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
                <div className="relative w-full h-full bg-white">
                  <Image
                    src={previewImage}
                    alt={alt}
                    fill
                    className="object-contain"
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
              <div className="relative w-full h-full bg-white">
                <Image
                  src={previewImage}
                  alt={alt}
                  fill
                  className="object-contain"
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