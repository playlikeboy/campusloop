"use client";

import * as React from "react";
import { SwipeCardDeck } from "./swipe-card-deck";

const AVATAR_ANANYA_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%238b5cf6"/></linearGradient></defs><rect width="600" height="800" fill="url(%23g1)"/><circle cx="300" cy="320" r="140" fill="white" fill-opacity="0.2"/><path d="M150 640 C150 480 450 480 450 640 Z" fill="white" fill-opacity="0.2"/><circle cx="300" cy="300" r="85" fill="white" fill-opacity="0.9"/><path d="M180 580 C180 460 420 460 420 580 Z" fill="white" fill-opacity="0.9"/></svg>`;

const AVATAR_ANANYA_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ec4899"/><stop offset="100%" stop-color="%23e11d48"/></linearGradient></defs><rect width="600" height="800" fill="url(%23g2)"/><circle cx="300" cy="320" r="140" fill="white" fill-opacity="0.2"/><path d="M150 640 C150 480 450 480 450 640 Z" fill="white" fill-opacity="0.2"/><circle cx="300" cy="300" r="85" fill="white" fill-opacity="0.9"/><path d="M180 580 C180 460 420 460 420 580 Z" fill="white" fill-opacity="0.9"/></svg>`;

const AVATAR_KABIR_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect width="600" height="800" fill="url(%23g3)"/><circle cx="300" cy="320" r="140" fill="white" fill-opacity="0.2"/><path d="M150 640 C150 480 450 480 450 640 Z" fill="white" fill-opacity="0.2"/><circle cx="300" cy="300" r="85" fill="white" fill-opacity="0.9"/><path d="M180 580 C180 460 420 460 420 580 Z" fill="white" fill-opacity="0.9"/></svg>`;

const AVATAR_KABIR_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="100%" stop-color="%2314b8a6"/></linearGradient></defs><rect width="600" height="800" fill="url(%23g4)"/><circle cx="300" cy="320" r="140" fill="white" fill-opacity="0.2"/><path d="M150 640 C150 480 450 480 450 640 Z" fill="white" fill-opacity="0.2"/><circle cx="300" cy="300" r="85" fill="white" fill-opacity="0.9"/><path d="M180 580 C180 460 420 460 420 580 Z" fill="white" fill-opacity="0.9"/></svg>`;

export default function SwipeCardDeckDemo() {
  const sampleProfiles = [
    {
      id: "1",
      name: "Ananya",
      age: 21,
      college: "IIT Delhi",
      course: "Computer Science '25",
      bio: "Hackathon builder, filter coffee addict, and amateur badminton player. Looking for someone to explore campus cafes with.",
      interests: ["Hackathons", "Film Photography", "Indie Music", "Badminton"],
      photos: [AVATAR_ANANYA_1, AVATAR_ANANYA_2],
      verified: true,
    },
    {
      id: "2",
      name: "Kabir",
      age: 22,
      college: "BIT Mesra",
      course: "Mechanical Engg '24",
      bio: "Formula Student chassis lead. When not in the workshop, you will find me playing guitar in hostel corridors.",
      interests: ["Formula Student", "Acoustic Guitar", "Gym", "Late Night Drives"],
      photos: [AVATAR_KABIR_1, AVATAR_KABIR_2],
      verified: true,
    },
  ];

  return (
    <div className="flex min-h-[640px] w-full items-center justify-center bg-background py-8 px-4">
      <SwipeCardDeck profiles={sampleProfiles} />
    </div>
  );
}
