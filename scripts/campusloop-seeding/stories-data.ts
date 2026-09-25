/**
 * CampusLoop Campus Vibe Stories Catalog (30 Items)
 * 
 * Short visual/text micro-moments capturing everyday student life:
 * library desks, sunrise runs, canteen chai, fest lights, late-night coding, and rain.
 */

export interface SeedStoryItem {
  id: string;
  userIndex: number; // 0 to 54
  text: string;
  mediaUrl?: string;
  backgroundColor: string;
  hoursAgo: number;
}

export const SEED_STORIES: SeedStoryItem[] = [
  {
    id: "seed_202609_story_001",
    userIndex: 0,
    text: "Kernel module compiled on first attempt without kernel panic 😭☕ Miracles do happen at 3 AM",
    backgroundColor: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    hoursAgo: 4,
  },
  {
    id: "seed_202609_story_002",
    userIndex: 1,
    text: "Golden hour light cutting through the central library glass facade ✨ Best spot to sketch UI flows",
    mediaUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80",
    backgroundColor: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    hoursAgo: 2,
  },
  {
    id: "seed_202609_story_003",
    userIndex: 2,
    text: "Soldering iron smoke + monsoon rain outside the hostel window 🌧️ Ultimate engineering nostalgia",
    backgroundColor: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    hoursAgo: 6,
  },
  {
    id: "seed_202609_story_004",
    userIndex: 3,
    text: "Powai lake morning run: 6.2 km done before the 8:30 AM lecture! Mind reset 🏃‍♀️💨",
    mediaUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80",
    backgroundColor: "linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)",
    hoursAgo: 7,
  },
  {
    id: "seed_202609_story_005",
    userIndex: 4,
    text: "Chassis dyno pull test sounding like an absolute jet engine in the DTU workshop! 🏎️🔥",
    backgroundColor: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
    hoursAgo: 5,
  },
  {
    id: "seed_202609_story_006",
    userIndex: 6,
    text: "Gate 4 cha bhaiya giving extra ginger today because the weather is gloomy ☕ Pure love",
    backgroundColor: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
    hoursAgo: 3,
  },
  {
    id: "seed_202609_story_007",
    userIndex: 7,
    text: "CEG red building looking like Hogwarts after the evening shower 🏰🌧️",
    mediaUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80",
    backgroundColor: "linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)",
    hoursAgo: 1,
  },
  {
    id: "seed_202609_story_008",
    userIndex: 8,
    text: "Sunset at End Point hits different when you just submitted your major project report 🌅🌊",
    backgroundColor: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    hoursAgo: 8,
  },
  {
    id: "seed_202609_story_009",
    userIndex: 9,
    text: "Assi Ghat lemon tea & hot jalebi at 6:15 AM. Nothing beats Varanasi morning air 🌞",
    backgroundColor: "linear-gradient(135deg, #f97316 0%, #fbbf24 100%)",
    hoursAgo: 9,
  },
  {
    id: "seed_202609_story_010",
    userIndex: 10,
    text: "Hostel 1st year corridor cricket: broke the dustbin lid again. Match paused indefinitely 🏏😂",
    backgroundColor: "linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)",
    hoursAgo: 10,
  },
  {
    id: "seed_202609_story_011",
    userIndex: 11,
    text: "Wireshark packet stream looking like The Matrix code. Time to sleep 💤",
    backgroundColor: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
    hoursAgo: 12,
  },
  {
    id: "seed_202609_story_012",
    userIndex: 13,
    text: "Turf lights on! 5v5 futsal tournament kicks off in 10 minutes ⚽🏆",
    mediaUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
    backgroundColor: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    hoursAgo: 2,
  },
  {
    id: "seed_202609_story_013",
    userIndex: 17,
    text: "Reading Dostoevsky under the banyan tree between classes 📖 Autumn campus breeze is bliss",
    backgroundColor: "linear-gradient(135deg, #78350f 0%, #92400e 100%)",
    hoursAgo: 4,
  },
  {
    id: "seed_202609_story_014",
    userIndex: 18,
    text: "Kameng hostel lake view: mist rising off the water this morning. Nature at its finest 🌲🦆",
    mediaUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80",
    backgroundColor: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
    hoursAgo: 11,
  },
  {
    id: "seed_202609_story_015",
    userIndex: 20,
    text: "Arman's Canteen hot samosas right out of the kadhai. Crispy golden heaven 🥟🔥",
    backgroundColor: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    hoursAgo: 1,
  },
  {
    id: "seed_202609_story_016",
    userIndex: 21,
    text: "Nilgiri hostel common room: 4 laptops, 8 empty chai cups, 1 shared whiteboard. Hackathon mode 🚀",
    backgroundColor: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    hoursAgo: 3,
  },
  {
    id: "seed_202609_story_017",
    userIndex: 22,
    text: "Sound check in the SAC auditorium: drums hitting through the chest! Fest season is finally here 🥁⚡",
    backgroundColor: "linear-gradient(135deg, #a855f7 0%, #d946ef 100%)",
    hoursAgo: 5,
  },
  {
    id: "seed_202609_story_018",
    userIndex: 23,
    text: "Surviving 8 AM engineering physics lecture with one eye open and zero caffeine ☕😴",
    backgroundColor: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
    hoursAgo: 6,
  },
  {
    id: "seed_202609_story_019",
    userIndex: 24,
    text: "Rating +64 on Codeforces Div. 2! Finally touched Candidate Master! Hard work pays off 🎯📈",
    backgroundColor: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
    hoursAgo: 13,
  },
  {
    id: "seed_202609_story_020",
    userIndex: 27,
    text: "BIT Mesra IC Canteen cold coffee on a humid afternoon. Lifesaver 🥤🧊",
    backgroundColor: "linear-gradient(135deg, #713f12 0%, #854d0e 100%)",
    hoursAgo: 2,
  },
  {
    id: "seed_202609_story_021",
    userIndex: 28,
    text: "First pull request merged to open source repo! Seeing your code deployed to millions is surreal ✨👩‍💻",
    backgroundColor: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    hoursAgo: 7,
  },
  {
    id: "seed_202609_story_022",
    userIndex: 30,
    text: "Assi Ghat midnight walk: river reflection of illuminated temples. Varanasi has my heart 🪔🌙",
    backgroundColor: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    hoursAgo: 14,
  },
  {
    id: "seed_202609_story_023",
    userIndex: 32,
    text: "The campus stray cat decided my lap was the best bed during my 2-hour study break 🐱🐾",
    backgroundColor: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    hoursAgo: 3,
  },
  {
    id: "seed_202609_story_024",
    userIndex: 34,
    text: "Wind tunnel smoke visualization lines looking absolutely gorgeous on the wing model! 💨✈️",
    backgroundColor: "linear-gradient(135deg, #0369a1 0%, #0284c7 100%)",
    hoursAgo: 8,
  },
  {
    id: "seed_202609_story_025",
    userIndex: 37,
    text: "Setting up the telescope on the rooftop. Ring of Saturn clearly visible tonight! 🪐🔭",
    backgroundColor: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    hoursAgo: 15,
  },
  {
    id: "seed_202609_story_026",
    userIndex: 40,
    text: "Quadcopter PID tuning: hovering rock steady without drifting an inch! Let's go 🛸",
    backgroundColor: "linear-gradient(135deg, #047857 0%, #059669 100%)",
    hoursAgo: 4,
  },
  {
    id: "seed_202609_story_027",
    userIndex: 41,
    text: "BIT Mesra main building clock tower at night. Always watching over 6,000 dreamers 🏛️✨",
    mediaUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80",
    backgroundColor: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)",
    hoursAgo: 1,
  },
  {
    id: "seed_202609_story_028",
    userIndex: 45,
    text: "Reading room 4th floor: pin drop silence, rainfall drumming on the skylight. Deep focus 📚🌧️",
    backgroundColor: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
    hoursAgo: 5,
  },
  {
    id: "seed_202609_story_029",
    userIndex: 49,
    text: "Hostel 11 corridor badminton rally: 42 shots before the birdie hit the floor! Epic 🏸🔥",
    backgroundColor: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    hoursAgo: 2,
  },
  {
    id: "seed_202609_story_030",
    userIndex: 54,
    text: "Convocation robes arrived today. 4 years summarized in a black gown and blue sash. Emotional 🎓❤️",
    backgroundColor: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
    hoursAgo: 6,
  },
];
