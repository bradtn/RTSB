// src/styles/loadingAnimations.js
export const loadingStyles = `
  /* Progress bar animation */
  @keyframes progress {
    0% { width: 0; }
    20% { width: 20%; }
    40% { width: 40%; }
    60% { width: 60%; }
    80% { width: 80%; }
    100% { width: 100%; }
  }
  .animate-progress {
    animation: progress 5s ease-in-out infinite;
  }
  
  /* Pulse animation */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  /* Float animation for logo */
  @keyframes gentleFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .logo-float {
    animation: gentleFloat 4s ease-in-out infinite;
  }
  
  /* Pulse size animation for logo */
  @keyframes pulsate {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  .logo-pulsate {
    animation: pulsate 2s ease-in-out infinite;
  }
  
  /* Shimmer effect for progress bar */
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .progress-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.2) 50%,
      rgba(255,255,255,0) 100%
    );
    animation: shimmer 2s infinite;
  }
  
  /* Step appearance animation */
  @keyframes stepAppear {
    0% { transform: translateX(-10px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  .step-appear {
    animation: stepAppear 0.5s forwards;
  }
  
  /* Counting animation for schedule count */
  @keyframes countUp {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .count-up {
    animation: countUp 0.5s forwards;
  }
  
  /* Background particle effect */
  .particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
  }
  
  .particle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.3;
    animation-name: particleFloat;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }
  
  @keyframes particleFloat {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(-20px) rotate(360deg); }
  }
  
  /* Confetti animation */
  @keyframes confettiDrop {
    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
  }
  
  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    animation: confettiDrop linear forwards;
  }
  
  /* Button animation */
  @keyframes buttonPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
    50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  }
  .button-pulse {
    animation: buttonPulse 2s infinite;
  }
  
  /* Fade in for button */
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  .fade-in {
    animation: fadeIn 1s forwards;
  }
  
  /* Flash insight animation */
  @keyframes insightFlash {
    0% { opacity: 0; transform: translateY(10px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }
  
  .insight-flash {
    animation: insightFlash 4s ease-in-out forwards;
  }
`;
