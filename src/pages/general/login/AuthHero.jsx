import React from "react";

const features = [
  {
    icon: "🗓️",
    text: "Manage patient appointments effortlessly",
  },
  {
    icon: "👨‍⚕️",
    text: "Coordinate across doctors, staff & roles",
  },
  {
    icon: "🗂️",
    text: "Access patient records & billing in one place",
  },
  {
    icon: "📊",
    text: "Track clinic performance & reports",
  },
];

const AuthHero = () => {
  return (
    <div className="hidden lg:flex flex-col justify-center items-start w-1/2 bg-[#28328c] relative overflow-hidden p-16 h-screen">
      {/* Background decorative circles */}
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-white/5" />
      <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full bg-white/5" />
      <div className="absolute top-1/2 right-[-40px] w-40 h-40 rounded-full bg-[#14bef0]/10" />

      <div className="relative z-10 max-w-md">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#14bef0] flex items-center justify-center">
            <span className="text-white font-black text-sm">PHN</span>
          </div>
          <span className="text-white font-bold text-lg tracking-wide">
            Physician Health Net
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-white mb-3 leading-snug">
          Your Clinic, <span className="text-[#14bef0]">Smarter.</span>
        </h2>

        {/* Subtitle */}
        <p className="text-white/70 text-sm leading-relaxed mb-10">
          The all-in-one clinic management platform for doctors, receptionists,
          and administrators — built for PHN-registered clinics.
        </p>

        {/* Feature List */}
        <div className="space-y-4">
          {features.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-lg shrink-0">
                {item.icon}
              </div>
              <span className="text-white/85 text-sm font-medium">
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-white/30 text-xs mt-14">
          © 2025 Physician Health Net. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthHero;
