"use client"

export function DashboardBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0 animate-grid-move"
          style={{
            backgroundImage: `
              linear-gradient(rgba(95, 39, 205, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(95, 39, 205, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Floating section elements */}
      <div className="absolute inset-0">
        {/* Hero section element */}
        <div 
          className="absolute top-20 left-10 w-32 h-20 bg-gradient-to-r from-[#5F27CD] to-[#341F97] rounded-lg opacity-10 blur-sm animate-float-1"
        />
        
        {/* Banner element */}
        <div 
          className="absolute top-40 right-20 w-40 h-16 bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] rounded-lg opacity-10 blur-sm animate-float-2"
          style={{ animationDelay: '2s' }}
        />
        
        {/* Testimonial card element */}
        <div 
          className="absolute bottom-32 left-1/4 w-28 h-28 bg-gradient-to-br from-[#FF6B6B] to-[#EE5A6F] rounded-lg opacity-10 blur-sm animate-float-3"
          style={{ animationDelay: '4s' }}
        />
        
        {/* Product card element */}
        <div 
          className="absolute bottom-20 right-1/3 w-36 h-24 bg-gradient-to-r from-[#11998E] to-[#38EF7D] rounded-lg opacity-10 blur-sm animate-float-4"
          style={{ animationDelay: '1s' }}
        />
        
        {/* Collection grid element */}
        <div 
          className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-[#F093FB] to-[#F5576C] rounded-lg opacity-10 blur-sm animate-float-5"
          style={{ animationDelay: '3s', transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {/* Code brackets animation */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <div className="text-9xl font-mono text-[#5F27CD] select-none">
          <span className="inline-block animate-pulse">&lt;</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.1s' }}>/</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>&gt;</span>
        </div>
      </div>
    </div>
  )
}

