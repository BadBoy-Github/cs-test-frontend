import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const Confetti = ({ trigger, duration = 3000, onComplete }) => {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;

      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        } else if (onComplete) {
          onComplete();
        }
      };

      frame();

      // Reset after duration
      setTimeout(() => {
        hasTriggered.current = false;
      }, duration);
    }
  }, [trigger, duration, onComplete]);

  return null;
};

export default Confetti;
