"use client"

import Image from "next/image"
import { Code } from "lucide-react"

interface DeviceMockupProps {
  previewImage?: string
  alt?: string
  showAllDevices?: boolean
  className?: string
}

export function DeviceMockup({ 
  previewImage, 
  alt = "Preview", 
  showAllDevices = true,
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

  if (showAllDevices) {
    return (
      <div className={`flex items-end justify-center gap-3 md:gap-6 flex-wrap ${className}`}>
        {/* Laptop - Left side, largest */}
        <div className="relative" style={{ width: '320px', height: '200px' }}>
          {/* Laptop base */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-gray-700 to-gray-900 rounded-b-lg shadow-lg" style={{ transform: 'perspective(500px) rotateX(15deg)' }}></div>
          
          {/* Laptop screen */}
          <div className="absolute inset-0" style={{ transform: 'perspective(1000px) rotateX(8deg)' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-2xl">
              {/* Screen bezel */}
              <div className="absolute inset-0 bg-gray-800 rounded-lg" style={{ margin: '6px' }}>
                {/* Notch at top center */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-gray-700 rounded-b-full"></div>
                
                {/* Screen content */}
                <div className="absolute inset-0 bg-white rounded" style={{ margin: '2px', marginTop: '10px' }}>
                  <div className="relative w-full h-full rounded overflow-hidden bg-white">
                    <Image
                      src={previewImage}
                      alt={alt}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Smartphone - Center, overlapping */}
        <div className="relative z-10" style={{ width: '140px', height: '240px', marginBottom: '-20px' }}>
          <div className="absolute inset-0 bg-black rounded-[24px] shadow-2xl">
            {/* Dynamic island / notch */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-black rounded-full border border-gray-800"></div>
            
            {/* Screen */}
            <div className="absolute inset-0 bg-white rounded-[20px]" style={{ margin: '5px', marginTop: '20px' }}>
              <div className="relative w-full h-full rounded-[16px] overflow-hidden bg-white">
                <Image
                  src={previewImage}
                  alt={alt}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tablet - Right side */}
        <div className="relative" style={{ width: '200px', height: '280px' }}>
          <div className="absolute inset-0 bg-black rounded-[14px] shadow-2xl">
            {/* Screen */}
            <div className="absolute inset-0 bg-white rounded-[10px]" style={{ margin: '7px' }}>
              <div className="relative w-full h-full rounded-[6px] overflow-hidden bg-white">
                <Image
                  src={previewImage}
                  alt={alt}
                  fill
                  className="object-contain"
                  unoptimized
                />
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
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-2xl" 
           style={{ 
             clipPath: 'polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)',
             transform: 'perspective(1000px) rotateX(5deg)'
           }}>
        <div className="absolute inset-0 bg-gray-800 rounded-lg" style={{ margin: '8px' }}>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gray-700 rounded-b-full"></div>
          <div className="absolute inset-0 bg-white rounded" style={{ margin: '2px', marginTop: '12px' }}>
            <div className="relative w-full h-full rounded overflow-hidden">
              <Image
                src={previewImage}
                alt={alt}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
