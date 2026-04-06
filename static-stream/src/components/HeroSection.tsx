const HeroSection = () => {
  return (
    <div className="w-full">
      <div className="relative w-full aspect-video">
        <video
          src="/WhatsApp Video 2026-03-17 at 19.53.00.mp4"
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
        />
        <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight">
            CHOMBEZO TAMU
          </h1>
          <p className="mt-2 text-base md:text-lg font-body text-muted-foreground">
            Video tamu za kukojoza — Watch. Share. Download.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 justify-center p-4">
        <a
          href="https://duka.chombezo.online/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-3 bg-red-600 text-white font-body font-medium text-center border border-border hover:bg-red-700 transition-colors"
        >
          DUKA LA UTAMU
        </a>
        <a
          href="https://whatsapp.com/channel/0029Vb7to1Z5Ui2Rq1i0r23T"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-3 bg-whatsapp text-primary-foreground font-body font-medium text-center border border-border"
        >
          WHATSAPP
        </a>
        <a
          href="https://t.me/chombezotamusana"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-3 bg-telegram text-foreground font-body font-medium text-center border border-border"
        >
          TELEGRAM
        </a>
      </div>
    </div>
  );
};

export default HeroSection;
