"use client"

import Link from "next/link"

export default function WelcomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08000f] flex flex-col">
      {/* ===== BACKGROUND LAYERS ===== */}

      {/* Animated base gradient — slowly drifts through color positions */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 0%, #1a0035 0%, #08000f 50%, #001a1a 100%)",
          backgroundSize: "200% 200%",
          animation: "welcome-bg-drift 20s ease-in-out infinite",
        }}
      />

      {/* Star field layer 1 — small dim stars, slow diagonal drift */}
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 95px 140px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 170px 60px, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 250px 190px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 55px 210px, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 310px 80px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 130px 260px, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 380px 160px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 200px 310px, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 340px 280px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 420px 40px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 70px 350px, rgba(255,255,255,0.6), transparent)
          `,
          backgroundSize: "450px 380px",
          animation: "welcome-stars-1 50s linear infinite",
        }}
      />

      {/* Star field layer 2 — brighter stars, different speed & direction for parallax */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 40px 80px, rgba(255,255,255,0.9), transparent),
            radial-gradient(1.5px 1.5px at 180px 30px, rgba(200,220,255,0.8), transparent),
            radial-gradient(1px 1px at 300px 120px, rgba(255,255,255,0.6), transparent),
            radial-gradient(2px 2px at 120px 200px, rgba(255,220,255,0.7), transparent),
            radial-gradient(1.5px 1.5px at 350px 250px, rgba(200,255,255,0.8), transparent),
            radial-gradient(1px 1px at 230px 300px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1.5px 1.5px at 80px 150px, rgba(255,240,255,0.7), transparent),
            radial-gradient(2px 2px at 410px 180px, rgba(200,220,255,0.6), transparent)
          `,
          backgroundSize: "480px 350px",
          animation: "welcome-stars-2 35s linear infinite",
        }}
      />

      {/* Star field layer 3 — rare large twinkling stars */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(2.5px 2.5px at 150px 100px, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 400px 300px, rgba(200,240,255,0.8), transparent),
            radial-gradient(2.5px 2.5px at 600px 180px, rgba(255,200,255,0.7), transparent),
            radial-gradient(2px 2px at 280px 450px, rgba(255,255,220,0.8), transparent)
          `,
          backgroundSize: "700px 550px",
          animation: "welcome-stars-twinkle 4s ease-in-out infinite, welcome-stars-1 80s linear infinite",
        }}
      />

      {/* Ambient glow blobs — drifting colored lights */}
      <div
        className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[#ff2d95] opacity-[0.07] blur-[150px]"
        style={{ animation: "welcome-glow-drift 8s ease-in-out infinite" }}
      />
      <div
        className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#00f0ff] opacity-[0.07] blur-[150px]"
        style={{ animation: "welcome-glow-drift 10s ease-in-out infinite reverse" }}
      />
      <div
        className="absolute bottom-[30%] left-[40%] w-[400px] h-[400px] rounded-full bg-[#b537f2] opacity-[0.05] blur-[120px]"
        style={{ animation: "welcome-glow-drift 12s ease-in-out infinite 2s" }}
      />

      {/* Retro sun - half circle with horizontal stripe cutouts */}
      <div
        className="absolute left-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px]"
        style={{
          bottom: "18%",
          animation: "welcome-sun-breathe 6s ease-in-out infinite",
        }}
      >
        {/* Sun gradient circle, masked to only show top half */}
        <div
          className="w-full h-full rounded-full overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #ffde00 0%, #ff8a00 30%, #ff2d95 65%, #b537f2 100%)",
            maskImage:
              "linear-gradient(to bottom, black 50%, transparent 50%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 50%, transparent 50%)",
          }}
        >
          {/* Horizontal dark stripes across the sun */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0px, transparent 8px, #08000f 8px, #08000f 14px)",
              opacity: 0.35,
            }}
          />
        </div>
      </div>

      {/* Horizon neon line */}
      <div
        className="absolute left-0 right-0 h-[2px]"
        style={{
          bottom: "18%",
          background:
            "linear-gradient(90deg, transparent 5%, #ff2d95 20%, #ffde00 50%, #ff2d95 80%, transparent 95%)",
          boxShadow:
            "0 0 15px 2px rgba(255,45,149,0.4), 0 0 40px 4px rgba(255,45,149,0.15)",
          animation: "welcome-neon-pulse 3s ease-in-out infinite",
        }}
      />

      {/* Perspective grid floor */}
      <div
        className="absolute bottom-0 left-0 right-0 overflow-hidden"
        style={{ height: "18%", perspective: "400px" }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "-50%",
            right: "-50%",
            height: "300%",
            backgroundImage: `
              linear-gradient(to right, rgba(255,45,149,0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,45,149,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            transform: "rotateX(55deg)",
            transformOrigin: "top center",
            animation: "welcome-grid-scroll 1.5s linear infinite",
          }}
        />
      </div>

      {/* Scanline overlay (subtle CRT effect) */}
      <div
        className="pointer-events-none absolute inset-0 z-[45] opacity-[0.02]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)",
        }}
      />

      {/* ===== CONTENT ===== */}
      <div className="relative z-50 flex flex-col min-h-screen">
        {/* Title section */}
        <div className="text-center pt-8 pb-4 sm:pt-10 sm:pb-6 md:pt-14 md:pb-8 px-4">
          <h1
            className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter select-none"
            style={{
              background:
                "linear-gradient(90deg, #ff2d95, #b537f2, #00f0ff, #b537f2, #ff2d95)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "welcome-gradient-shift 6s linear infinite",
              filter:
                "drop-shadow(0 0 40px rgba(255,45,149,0.35)) drop-shadow(0 0 80px rgba(0,240,255,0.15))",
            }}
          >
            STONKA DONKA
          </h1>
          <p
            className="text-zinc-500 mt-2 sm:mt-3 md:mt-4 text-[10px] sm:text-xs md:text-sm tracking-[0.25em] sm:tracking-[0.3em] uppercase font-light"
            style={{ animation: "welcome-neon-pulse 4s ease-in-out infinite 1s" }}
          >
            Choose your path, trader
          </p>
        </div>

        {/* Split panels */}
        <div className="flex-1 flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6 px-4 sm:px-6 md:px-12 pb-4 sm:pb-6 md:pb-10 max-w-6xl mx-auto w-full">
          {/* LEFT PANEL: r/wallstreetbets */}
          <a
            href="https://reddit.com/r/wallstreetbets"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-1 relative rounded-2xl border border-[#ff2d95]/20 bg-[#ff2d95]/[0.03] backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-[#ff2d95]/50 hover:bg-[#ff2d95]/[0.07] hover:shadow-[0_0_80px_-20px_#ff2d95] hover:scale-[1.02] flex flex-col items-center justify-center p-5 sm:p-6 md:p-8 min-h-[220px] sm:min-h-[260px] md:min-h-0 cursor-pointer"
          >
            {/* Neon accent lines (top + bottom) */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff2d95] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff2d95]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-[#ff2d95]/25 group-hover:border-[#ff2d95]/70 transition-colors duration-500" />
            <div className="absolute top-3 right-3 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-[#ff2d95]/25 group-hover:border-[#ff2d95]/70 transition-colors duration-500" />
            <div className="absolute bottom-3 left-3 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-[#ff2d95]/25 group-hover:border-[#ff2d95]/70 transition-colors duration-500" />
            <div className="absolute bottom-3 right-3 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-[#ff2d95]/25 group-hover:border-[#ff2d95]/70 transition-colors duration-500" />

            <span className="text-5xl sm:text-6xl md:text-7xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-500 select-none">
              🚀
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#ff2d95] tracking-tight mb-1.5 sm:mb-2 transition-[filter] duration-500 group-hover:[filter:drop-shadow(0_0_12px_#ff2d95)]">
              TO THE MOON
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm text-center max-w-[240px] leading-relaxed">
              Join the legendary degenerates at{" "}
              <span className="text-[#ff2d95]/70">r/wallstreetbets</span>
            </p>
            <div className="mt-4 sm:mt-5 md:mt-6 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[#ff2d95]/30 text-[#ff2d95] text-xs sm:text-sm font-semibold tracking-wide group-hover:bg-[#ff2d95]/10 group-hover:border-[#ff2d95]/60 group-hover:shadow-[0_0_20px_-5px_#ff2d95] transition-all duration-500">
              Diamond Hands &rarr;
            </div>
          </a>

          {/* Divider */}
          <div className="hidden md:flex items-center px-2">
            <div className="w-[1px] h-3/4 bg-gradient-to-b from-transparent via-[#b537f2]/30 to-transparent" />
          </div>
          <div className="md:hidden flex justify-center">
            <div className="h-[1px] w-2/3 bg-gradient-to-r from-transparent via-[#b537f2]/30 to-transparent" />
          </div>

          {/* RIGHT PANEL: Sign In */}
          <Link
            href="/login"
            className="group flex-1 relative rounded-2xl border border-[#00f0ff]/20 bg-[#00f0ff]/[0.03] backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-[#00f0ff]/50 hover:bg-[#00f0ff]/[0.07] hover:shadow-[0_0_80px_-20px_#00f0ff] hover:scale-[1.02] flex flex-col items-center justify-center p-5 sm:p-6 md:p-8 min-h-[220px] sm:min-h-[260px] md:min-h-0 cursor-pointer"
          >
            {/* Neon accent lines */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-[#00f0ff]/25 group-hover:border-[#00f0ff]/70 transition-colors duration-500" />
            <div className="absolute top-3 right-3 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-[#00f0ff]/25 group-hover:border-[#00f0ff]/70 transition-colors duration-500" />
            <div className="absolute bottom-3 left-3 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-[#00f0ff]/25 group-hover:border-[#00f0ff]/70 transition-colors duration-500" />
            <div className="absolute bottom-3 right-3 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-[#00f0ff]/25 group-hover:border-[#00f0ff]/70 transition-colors duration-500" />

            <span className="text-5xl sm:text-6xl md:text-7xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-500 select-none">
              📈
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#00f0ff] tracking-tight mb-1.5 sm:mb-2 transition-[filter] duration-500 group-hover:[filter:drop-shadow(0_0_12px_#00f0ff)]">
              YOUR DASHBOARD
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm text-center max-w-[240px] leading-relaxed">
              Sign in to access your{" "}
              <span className="text-[#00f0ff]/70">Stonka Donka</span>{" "}
              intelligence hub
            </p>
            <div className="mt-4 sm:mt-5 md:mt-6 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[#00f0ff]/30 text-[#00f0ff] text-xs sm:text-sm font-semibold tracking-wide group-hover:bg-[#00f0ff]/10 group-hover:border-[#00f0ff]/60 group-hover:shadow-[0_0_20px_-5px_#00f0ff] transition-all duration-500">
              Sign In &rarr;
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center pb-3 sm:pb-4 md:pb-6">
          <p className="text-zinc-700 text-[10px] sm:text-xs tracking-[0.25em] uppercase">
            Stonka Donka &copy; 2026
          </p>
        </div>
      </div>
    </div>
  )
}
