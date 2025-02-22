class ResolutionManager {
    static adjustResolution(videoWidth: number, videoHeight: number) {
      // Sprawdzenie, czy 'deviceMemory' istnieje w 'navigator'
      const deviceMemory = 'deviceMemory' in navigator ? (navigator as any).deviceMemory : 4;
  
      let scaleFactor = 1;
      if (deviceMemory <= 2) {
        scaleFactor = 0.5; // Obniżenie jakości dla urządzeń o małej ilości pamięci
      } else if (deviceMemory <= 4) {
        scaleFactor = 0.75; // Średnia jakość
      }
  
      return {
        width: Math.round(videoWidth * scaleFactor),
        height: Math.round(videoHeight * scaleFactor),
      };
    }
  }
  
  export default ResolutionManager;  