"use client"

export function LandingBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0 animate-grid-move"
          style={{
            backgroundImage: `
              linear-gradient(rgba(95, 39, 205, 0.25) 1px, transparent 1px),
              linear-gradient(90deg, rgba(95, 39, 205, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating section elements - more vibrant for landing page */}
      <div className="absolute inset-0">
        {/* Hero section element */}
        <div 
          className="absolute top-32 left-16 w-40 h-24 bg-gradient-to-r from-[#5F27CD] to-[#341F97] rounded-xl opacity-25 blur-md animate-float-1"
        />
        
        {/* Banner element */}
        <div 
          className="absolute top-52 right-24 w-48 h-20 bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] rounded-xl opacity-25 blur-md animate-float-2"
          style={{ animationDelay: '2s' }}
        />
        
        {/* Feature card element */}
        <div 
          className="absolute bottom-40 left-1/4 w-32 h-32 bg-gradient-to-br from-[#FF6B6B] to-[#EE5A6F] rounded-xl opacity-25 blur-md animate-float-3"
          style={{ animationDelay: '4s' }}
        />
        
        {/* Product card element */}
        <div 
          className="absolute bottom-32 right-1/3 w-44 h-28 bg-gradient-to-r from-[#11998E] to-[#38EF7D] rounded-xl opacity-25 blur-md animate-float-4"
          style={{ animationDelay: '1s' }}
        />
        
        {/* Collection grid element */}
        <div 
          className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-[#F093FB] to-[#F5576C] rounded-xl opacity-25 blur-md animate-float-5"
          style={{ animationDelay: '3s', transform: 'translate(-50%, -50%)' }}
        />
        
        {/* Additional floating elements for more visual interest */}
        <div 
          className="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full opacity-20 blur-lg animate-float-1"
          style={{ animationDelay: '5s' }}
        />
        
        <div 
          className="absolute bottom-1/3 left-1/3 w-28 h-28 bg-gradient-to-br from-[#f093fb] to-[#4facfe] rounded-full opacity-20 blur-lg animate-float-2"
          style={{ animationDelay: '6s' }}
        />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-[#5F27CD]/30 to-[#00D2FF]/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-[#F093FB]/30 to-[#F5576C]/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
      </div>

      {/* Code brackets animation - larger and more prominent */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="text-[12rem] font-mono text-[#5F27CD] select-none">
          <span className="inline-block animate-pulse">&lt;</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.1s' }}>/</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>&gt;</span>
        </div>
      </div>

      {/* Animated particles/dots */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-${(i % 5) + 1} ${8 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

